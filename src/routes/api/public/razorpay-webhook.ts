import { createFileRoute } from "@tanstack/react-router";

/**
 * Razorpay webhook (order.paid / payment.captured / payment.failed).
 * - Verifies X-Razorpay-Signature (HMAC-SHA256 of the raw body with RAZORPAY_WEBHOOK_SECRET)
 * - Idempotent: every event id is recorded once in webhook_events; duplicates are ignored
 * - Never creates orders; only updates the matching internal order
 */
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getWebhookSecret, hmacSha256Hex, safeEqual } = await import("@/lib/razorpay.server");
        const secret = getWebhookSecret();
        if (!secret) {
          return new Response("Webhook not configured", { status: 503 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const expected = await hmacSha256Hex(secret, rawBody);
        if (!signature || !safeEqual(expected, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const eventType: string = payload?.event ?? "unknown";
        const paymentEntity = payload?.payload?.payment?.entity;
        const orderEntity = payload?.payload?.order?.entity;
        const razorpayOrderId: string | undefined = paymentEntity?.order_id ?? orderEntity?.id;
        const razorpayPaymentId: string | undefined = paymentEntity?.id;
        const eventId =
          request.headers.get("x-razorpay-event-id") ??
          `${eventType}:${razorpayOrderId ?? "none"}:${razorpayPaymentId ?? "none"}:${payload?.created_at ?? ""}`;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: insert the event id; a unique violation means we've already handled it.
        const { error: evErr } = await supabaseAdmin.from("webhook_events").insert({
          event_id: eventId,
          event_type: eventType,
          razorpay_order_id: razorpayOrderId ?? null,
          payload,
        });
        if (evErr) {
          if (evErr.code === "23505") return Response.json({ ok: true, duplicate: true });
          console.error("[webhook] event log failed", evErr);
          return new Response("Event log failed", { status: 500 });
        }

        if (!razorpayOrderId) return Response.json({ ok: true, ignored: true });

        if (eventType === "order.paid" || eventType === "payment.captured") {
          const { error } = await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "paid",
              razorpay_payment_id: razorpayPaymentId ?? null,
              voucher_status: "processing",
            })
            .eq("razorpay_order_id", razorpayOrderId)
            .neq("payment_status", "paid");
          if (error) {
            console.error("[webhook] mark paid failed", error);
            return new Response("Update failed", { status: 500 });
          }
        } else if (eventType === "payment.failed") {
          await supabaseAdmin
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("razorpay_order_id", razorpayOrderId)
            .eq("payment_status", "pending");
        } else if (eventType === "refund.processed") {
          await supabaseAdmin
            .from("orders")
            .update({ payment_status: "refunded" })
            .eq("razorpay_order_id", razorpayOrderId)
            .eq("payment_status", "paid");
        }

        return Response.json({ ok: true });
      },
    },
  },
});
