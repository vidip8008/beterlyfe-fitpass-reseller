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
        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const eventId = request.headers.get("x-razorpay-event-id") ?? "";

        const { getPublicServerClient } = await import("@/lib/supabase-public.server");
        const supabase = getPublicServerClient();

        // The database function re-verifies the signature against the stored
        // webhook secret, records the event id (idempotency) and applies the
        // order update. Nothing is written for an unverified request.
        const { data, error } = await supabase.rpc("razorpay_webhook_apply", {
          _raw_body: rawBody,
          _signature: signature,
          _event_id: eventId,
        });

        if (error) {
          console.error("[webhook] apply failed", error.message);
          return new Response("Webhook processing failed", { status: 500 });
        }

        const result = (data ?? {}) as { ok?: boolean; code?: string; duplicate?: boolean };
        if (result.ok === false) {
          if (result.code === "invalid_signature") {
            return new Response("Invalid signature", { status: 401 });
          }
          if (result.code === "not_configured") {
            return new Response("Webhook not configured", { status: 503 });
          }
          return new Response("Bad payload", { status: 400 });
        }

        return Response.json(result);
      },
    },
  },
});
