/**
 * Server-only Razorpay helpers. Uses the REST API + Web Crypto so it runs
 * cleanly in the edge runtime. Never import this file from client code.
 */

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super("PAYMENTS_NOT_CONFIGURED");
    this.name = "PaymentsNotConfiguredError";
  }
}

export function getRazorpayKeys() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new PaymentsNotConfiguredError();
  return { keyId, keySecret };
}

export function getWebhookSecret() {
  return process.env["RAZORPAY_WEBHOOK_SECRET"] ?? "";
}

export async function hmacSha256Hex(secret: string, data: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createRazorpayOrderRemote(params: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getRazorpayKeys();
  const auth = btoa(`${keyId}:${keySecret}`);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[razorpay] order create failed", res.status, text);
    throw new Error("RAZORPAY_ORDER_FAILED");
  }
  return (await res.json()) as RazorpayOrder;
}

export async function verifyPaymentSignature(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const { keySecret } = getRazorpayKeys();
  const expected = await hmacSha256Hex(
    keySecret,
    `${input.razorpay_order_id}|${input.razorpay_payment_id}`,
  );
  return safeEqual(expected, input.razorpay_signature);
}
