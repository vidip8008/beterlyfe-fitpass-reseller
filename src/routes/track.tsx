import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MessageCircle, Search } from "lucide-react";
import { z } from "zod";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTimeline, deriveSteps } from "@/components/site/StatusTimeline";
import { trackOrder, type TrackedOrder } from "@/lib/orders.functions";
import { PAYMENT_STATUS, VOUCHER_STATUS, formatINR, formatWhatsApp, supportWhatsAppUrl, type PaymentStatus, type VoucherStatus } from "@/lib/site";
import { buildSupportMessage } from "@/lib/whatsapp";

const TITLE = "Track Your Order | BeterLyfe";
const DESC = "Track your FITPASS membership order status with your Order ID and WhatsApp number.";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ order_id: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/track" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/track" }],
  }),
  component: TrackPage,
});

function TrackPage() {
  const search = Route.useSearch();
  const track = useServerFn(trackOrder);
  const [orderId, setOrderId] = useState(search.order_id ?? "");
  const [wa, setWa] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "found" | "notfound" | "error"; order?: TrackedOrder }>({ status: "idle" });

  useEffect(() => {
    if (search.order_id) setOrderId(search.order_id);
  }, [search.order_id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await track({ data: { order_id: orderId, whatsapp_number: wa } });
      setState(res.ok ? { status: "found", order: res.order } : { status: "notfound" });
    } catch {
      setState({ status: "error" });
    }
  }

  const o = state.order;

  return (
    <SiteLayout>
      <PageHeader eyebrow="Order status" title="Track Your Order" intro="Enter the Order ID from your confirmation and the WhatsApp number you used at checkout." />
      <section className="pb-24">
        <div className="container-site grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={onSubmit} className="surface-card grid gap-5 self-start rounded-3xl p-6 sm:p-8">
            <div className="grid gap-2">
              <Label htmlFor="order_id" className="font-semibold">Order ID</Label>
              <Input id="order_id" placeholder="BL-2026-000001" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} className="font-mono" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wa" className="font-semibold">WhatsApp Number</Label>
              <Input id="wa" type="tel" inputMode="numeric" placeholder="10-digit mobile number" value={wa} onChange={(e) => setWa(e.target.value)} required />
            </div>
            <Button type="submit" variant="hero" size="lg" disabled={state.status === "loading"}>
              {state.status === "loading" ? <Loader2 className="animate-spin" /> : <Search />} Track Order
            </Button>
            {state.status === "notfound" && (
              <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
                No order found for that Order ID and WhatsApp number. Please check both and try again.
              </p>
            )}
            {state.status === "error" && (
              <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
                Something went wrong. Please try again in a moment.
              </p>
            )}
          </form>

          <div className="surface-card rounded-3xl p-6 sm:p-8">
            {o ? <OrderResult order={o} /> : <EmptyState />}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full min-h-64 place-items-center text-center">
      <div>
        <p className="font-semibold">Your order status will appear here</p>
        <p className="mt-2 text-sm text-muted-foreground">Only you can see your order — both details must match.</p>
      </div>
    </div>
  );
}

function OrderResult({ order }: { order: TrackedOrder }) {
  const payment = order.payment_status as PaymentStatus;
  const voucher = order.voucher_status as VoucherStatus;
  const steps = deriveSteps(payment, voucher);
  const rows: [string, string][] = [
    ["Order ID", order.order_id],
    ["Membership", order.membership],
    ["Amount", formatINR(order.amount)],
    ["Payment", PAYMENT_STATUS[payment] ?? order.payment_status],
    ["Voucher", VOUCHER_STATUS[voucher] ?? order.voucher_status],
    ["Order date", new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })],
    ["WhatsApp", formatWhatsApp(order.whatsapp_number)],
  ];
  const headline =
    voucher === "issue"
      ? "We’re resolving an issue with your voucher"
      : voucher === "completed" || voucher === "sent"
        ? "Your voucher has been sent ✓"
        : voucher === "voucher_ready"
          ? "Voucher Ready ✓ — WhatsApp delivery is next"
          : payment === "paid"
            ? "Payment received — voucher processing"
            : payment === "failed"
              ? "Payment failed"
              : payment === "refunded"
                ? "This order has been refunded"
                : "Awaiting payment";

  return (
    <div className="animate-fade-in">
      <p className="eyebrow">Current status</p>
      <h2 className="mt-2 text-2xl font-extrabold">{headline}</h2>
      {voucher === "issue" && (
        <p className="mt-2 text-sm text-muted-foreground">
          Our team is looking into it. Please contact support with your Order ID if you need an update.
        </p>
      )}
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-background/50 px-4 py-3">
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{k}</dt>
            <dd className="mt-1 text-sm font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8">
        <StatusTimeline steps={steps} />
      </div>
      <div className="mt-8">
        <Button asChild variant="whatsapp" size="lg" className="w-full sm:w-auto">
          <a href={supportWhatsAppUrl(buildSupportMessage(order.order_id))} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> Contact Support
          </a>
        </Button>
      </div>
    </div>
  );
}
