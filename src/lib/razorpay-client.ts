/**
 * Browser-side loader for Razorpay Standard Checkout.
 * The order + amount are always created server-side; this only opens the modal.
 */

export interface RazorpaySuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  notes?: Record<string, string>;
}

type CheckoutResult =
  | { status: "success"; payload: RazorpaySuccessPayload }
  | { status: "failed"; reason?: string }
  | { status: "dismissed" };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (resp: unknown) => void) => void;
    };
  }
}

let loading: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      loading = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return loading;
}

export async function openRazorpayCheckout(opts: RazorpayOptions): Promise<CheckoutResult> {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) return { status: "failed", reason: "SCRIPT_LOAD_FAILED" };

  return new Promise((resolve) => {
    let settled = false;
    const done = (r: CheckoutResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    const rz = new window.Razorpay!({
      ...opts,
      theme: { color: "#C8F542", backdrop_color: "rgba(9,11,13,0.85)" },
      handler: (resp: RazorpaySuccessPayload) => done({ status: "success", payload: resp }),
      modal: { ondismiss: () => done({ status: "dismissed" }), confirm_close: true },
      retry: { enabled: true, max_count: 3 },
    });
    rz.on("payment.failed", (resp: unknown) => {
      const r = resp as { error?: { description?: string } };
      done({ status: "failed", reason: r.error?.description });
    });
    rz.open();
  });
}
