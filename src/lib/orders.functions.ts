import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SITE, normalizeWhatsApp } from "./site";

/* ---------- Validation ---------- */

export const checkoutSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(100, "Name is too long"),
  whatsapp_number: z
    .string()
    .trim()
    .transform((v) => normalizeWhatsApp(v))
    .refine((v) => /^91[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian WhatsApp number"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  city: z.string().trim().min(2, "Please enter your city").max(100),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

const orderIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^BL-\d{4}-\d{6}$/, "Order ID looks like BL-2026-000001");

const whatsappSchema = z
  .string()
  .trim()
  .transform((v) => normalizeWhatsApp(v))
  .refine((v) => /^91\d{10}$/.test(v), "Enter a valid 10-digit WhatsApp number");

/* ---------- Public: create order (amount fixed server-side) ---------- */

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { getPublicServerClient } = await import("./supabase-public.server");
    const { createRazorpayOrderRemote, getRazorpayKeys, PaymentsNotConfiguredError } =
      await import("./razorpay.server");
    const supabase = getPublicServerClient();

    // Fail fast with a clear message when Razorpay credentials are not set yet.
    let keyId: string;
    try {
      keyId = getRazorpayKeys().keyId;
    } catch (e) {
      if (e instanceof PaymentsNotConfiguredError) {
        return { ok: false as const, code: "PAYMENTS_NOT_CONFIGURED" as const };
      }
      throw e;
    }

    // 1. Duplicate-membership guard + order creation happen inside one hardened
    //    database function: amount/currency are fixed server-side (800000 INR),
    //    and a WhatsApp number that already has a PAID membership never gets a
    //    second Razorpay order.
    const { data: started, error: startErr } = await supabase.rpc("checkout_start", {
      _customer_name: data.customer_name,
      _whatsapp_number: data.whatsapp_number,
      _email: data.email,
      _city: data.city,
    });

    const row = Array.isArray(started) ? started[0] : started;
    if (startErr || !row) {
      console.error("[orders] checkout_start failed", startErr);
      throw new Error("ORDER_CREATE_FAILED");
    }

    if (row.status === "existing") {
      return {
        ok: false as const,
        code: "EXISTING_MEMBERSHIP" as const,
        order_id: row.order_id,
        whatsapp_number: data.whatsapp_number,
      };
    }

    // 2. Create the Razorpay order server-side for exactly 800000 paise.
    const rz = await createRazorpayOrderRemote({
      amountPaise: SITE.pricePaise,
      currency: SITE.currency,
      receipt: row.order_id,
      notes: { beterlyfe_order_id: row.order_id, product: SITE.product },
    });

    // 3. Store the Razorpay order id.
    const { error: attachErr } = await supabase.rpc("checkout_attach_razorpay_order", {
      _order_uuid: row.order_uuid,
      _razorpay_order_id: rz.id,
    });
    if (attachErr) {
      console.error("[orders] store razorpay id failed", attachErr);
      throw new Error("ORDER_CREATE_FAILED");
    }

    return {
      ok: true as const,
      order_id: row.order_id,
      razorpay_order_id: rz.id,
      amount: SITE.pricePaise,
      currency: SITE.currency,
      key_id: keyId,
      prefill: {
        name: data.customer_name,
        email: data.email,
        contact: `+${data.whatsapp_number}`,
      },
    };
  });

/* ---------- Public: verify payment signature ---------- */

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        razorpay_order_id: z.string().min(5).max(100),
        razorpay_payment_id: z.string().min(5).max(100),
        razorpay_signature: z.string().min(10).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyPaymentSignature } = await import("./razorpay.server");

    const valid = await verifyPaymentSignature(data);
    if (!valid) {
      return { ok: false as const, code: "INVALID_SIGNATURE" as const };
    }

    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id, order_id, payment_status, whatsapp_number")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .maybeSingle();

    if (!existing) return { ok: false as const, code: "ORDER_NOT_FOUND" as const };

    // Idempotent: only transition to paid once.
    if (existing.payment_status !== "paid") {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          voucher_status: "processing",
        })
        .eq("id", existing.id)
        .neq("payment_status", "paid");
      if (error) {
        console.error("[orders] mark paid failed", error);
        throw new Error("VERIFY_FAILED");
      }
    }

    return {
      ok: true as const,
      order_id: existing.order_id,
      whatsapp_number: existing.whatsapp_number,
    };
  });

/* ---------- Public: customer order tracking (Order ID + WhatsApp must match) ---------- */

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ order_id: orderIdSchema, whatsapp_number: whatsappSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "order_id, customer_name, whatsapp_number, city, amount, currency, payment_status, voucher_status, whatsapp_status, created_at, updated_at",
      )
      .eq("order_id", data.order_id)
      .eq("whatsapp_number", data.whatsapp_number)
      .maybeSingle();

    if (!order) return { ok: false as const, code: "NOT_FOUND" as const };
    return { ok: true as const, order: { ...order, membership: SITE.product } };
  });

export type TrackedOrder = Extract<Awaited<ReturnType<typeof trackOrder>>, { ok: true }>["order"];

/* ---------- Public: customer order tracking by WhatsApp number ---------- */

/**
 * Lists the customer's own orders for a WhatsApp number. Only safe,
 * customer-facing columns are selected — never admin notes, voucher codes,
 * Razorpay ids or any other customer's data.
 */
export const trackOrdersByWhatsApp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ whatsapp_number: whatsappSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("orders")
      .select(
        "order_id, customer_name, whatsapp_number, city, amount, currency, payment_status, voucher_status, whatsapp_status, created_at, updated_at",
      )
      .eq("whatsapp_number", data.whatsapp_number)
      .order("created_at", { ascending: false })
      .limit(10);

    const orders = (rows ?? []).map((o) => ({ ...o, membership: SITE.product }));
    if (orders.length === 0) return { ok: false as const, code: "NOT_FOUND" as const };
    return { ok: true as const, orders };
  });
