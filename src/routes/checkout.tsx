import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE, supportWhatsAppUrl } from "@/lib/site";
import { checkoutSchema, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/orders.functions";
import { openRazorpayCheckout } from "@/lib/razorpay-client";

const TITLE = "Checkout — FITPASS 8-Month Membership ₹8,000 | BeterLyfe";
const DESC = "Secure checkout for your FITPASS 8-month membership. One-time payment of ₹8,000 via Razorpay, digital voucher delivery on WhatsApp.";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/checkout" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

type Field = "customer_name" | "whatsapp_number" | "email" | "city";
type Errors = Partial<Record<Field, string>>;

function CheckoutPage() {
  const navigate = useNavigate();
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const [values, setValues] = useState<Record<Field, string>>({
    customer_name: "",
    whatsapp_number: "",
    email: "",
    city: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<"idle" | "creating" | "paying" | "verifying" | "failed" | "unconfigured">("idle");

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as Field;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setPhase("creating");

    let created: Awaited<ReturnType<typeof createOrder>>;
    try {
      created = await createOrder({ data: values });
    } catch (err) {
      console.error(err);
      setPhase("failed");
      toast.error("We couldn't start your order. Please try again or contact support.");
      return;
    }
    if (!created.ok) {
      setPhase("unconfigured");
      return;
    }

    setPhase("paying");
    const result = await openRazorpayCheckout({
      key: created.key_id,
      amount: created.amount,
      currency: created.currency,
      order_id: created.razorpay_order_id,
      name: SITE.name,
      description: SITE.product,
      prefill: created.prefill,
      notes: { order_id: created.order_id },
    });

    if (result.status === "dismissed") {
      setPhase("idle");
      toast("Payment cancelled. Your order is saved as pending — you can pay again anytime.");
      return;
    }
    if (result.status === "failed") {
      setPhase("failed");
      return;
    }

    setPhase("verifying");
    try {
      const verified = await verifyPayment({ data: result.payload });
      if (!verified.ok) {
        setPhase("failed");
        return;
      }
      navigate({
        to: "/success",
        search: { order_id: verified.order_id, wa: verified.whatsapp_number },
      });
    } catch (err) {
      console.error(err);
      setPhase("failed");
    }
  }

  const busy = phase === "creating" || phase === "paying" || phase === "verifying";

  return (
    <SiteLayout>
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="container-site relative grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-12">
          {/* Form */}
          <div>
            <p className="eyebrow">Secure checkout</p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Get Your FITPASS Membership</h1>
            <p className="mt-3 text-muted-foreground">
              Enter your details. Your voucher will be sent to the WhatsApp number you provide.
            </p>

            {phase === "unconfigured" && (
              <Alert tone="warning" title="Online payments are not live yet">
                Payment setup is being completed. Please contact us on WhatsApp to complete your purchase.
                <div className="mt-3">
                  <Button asChild variant="whatsapp" size="sm">
                    <a href={supportWhatsAppUrl("Hi BeterLyfe, I'd like to buy the FITPASS 8-Month Membership.")} target="_blank" rel="noopener noreferrer">
                      Chat on WhatsApp
                    </a>
                  </Button>
                </div>
              </Alert>
            )}
            {phase === "failed" && (
              <Alert tone="error" title="Payment not completed">
                Your payment could not be confirmed. No voucher will be issued for a failed payment. If money
                was deducted, it is normally reversed automatically by your bank. Contact support with your
                details and we'll sort it out.
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPhase("idle")}>Try again</Button>
                  <Button asChild variant="whatsapp" size="sm">
                    <a href={supportWhatsAppUrl("Hi BeterLyfe, my payment failed during checkout. Please help.")} target="_blank" rel="noopener noreferrer">
                      Contact Support
                    </a>
                  </Button>
                </div>
              </Alert>
            )}

            <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5">
              <Field label="Full Name" id="customer_name" error={errors.customer_name}>
                <Input id="customer_name" autoComplete="name" placeholder="Your full name" value={values.customer_name} onChange={set("customer_name")} disabled={busy} />
              </Field>
              <Field label="WhatsApp Number" id="whatsapp_number" error={errors.whatsapp_number} hint="Your voucher will be delivered here.">
                <Input id="whatsapp_number" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" value={values.whatsapp_number} onChange={set("whatsapp_number")} disabled={busy} />
              </Field>
              <Field label="Email" id="email" error={errors.email}>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={set("email")} disabled={busy} />
              </Field>
              <Field label="City" id="city" error={errors.city}>
                <Input id="city" autoComplete="address-level2" placeholder="Your city" value={values.city} onChange={set("city")} disabled={busy} />
              </Field>

              <Button type="submit" variant="hero" size="xl" disabled={busy} className="mt-2 w-full">
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {phase === "creating" && "Preparing secure payment…"}
                    {phase === "paying" && "Complete payment in Razorpay…"}
                    {phase === "verifying" && "Verifying payment…"}
                  </>
                ) : (
                  <>
                    <Lock /> Pay {SITE.priceLabel} Securely
                  </>
                )}
              </Button>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" /> Secure payment powered by Razorpay
              </p>
              <p className="text-center text-xs text-muted-foreground">
                By paying you agree to our{" "}
                <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link> and{" "}
                <Link to="/refund-policy" className="underline underline-offset-4 hover:text-foreground">Refund Policy</Link>.
              </p>
            </form>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="surface-card rounded-3xl p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Order summary</p>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold">{SITE.product}</p>
                  <p className="mt-1 text-sm text-muted-foreground">One-time payment</p>
                </div>
                <p className="text-2xl font-extrabold">{SITE.priceLabel}</p>
              </div>
              <div className="my-6 h-px bg-border" />
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="text-3xl font-extrabold tracking-tight">{SITE.priceLabel}</span>
              </div>
              <ul className="mt-6 grid gap-2.5 text-sm text-muted-foreground">
                {[
                  "Access participating gyms via the FITPASS platform",
                  "Voucher processed after payment confirmation",
                  `Delivered on WhatsApp — ${SITE.voucherEta}`,
                  "Order tracking with your Order ID + WhatsApp",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
                Gym availability and access are subject to applicable FITPASS membership terms and access rules. BeterLyfe is an independent reseller, not FITPASS.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold">{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function Alert({ tone, title, children }: { tone: "warning" | "error" | "info"; title: string; children: React.ReactNode }) {
  const cls =
    tone === "error"
      ? "border-destructive/40 bg-destructive/10"
      : tone === "warning"
        ? "border-warning/40 bg-warning/10"
        : "border-primary/30 bg-primary/10";
  return (
    <div role="status" className={`mt-6 rounded-2xl border p-4 text-sm ${cls}`}>
      <p className="font-bold text-foreground">{title}</p>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </div>
  );
}

// keep zod import used for potential future field-level validators
void z;
