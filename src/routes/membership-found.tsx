import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Loader2, MessageCircle } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { StatusTimeline, deriveSteps } from "@/components/site/StatusTimeline";
import { trackOrder } from "@/lib/orders.functions";
import {
  PAYMENT_STATUS,
  SITE,
  VOUCHER_STATUS,
  formatWhatsApp,
  supportWhatsAppUrl,
  type PaymentStatus,
  type VoucherStatus,
} from "@/lib/site";
import { buildSupportMessage } from "@/lib/whatsapp";

const TITLE = "Existing Membership Found | BeterLyfe";
const DESC = "This WhatsApp number already has a FITPASS membership order with BeterLyfe.";

export const Route = createFileRoute("/membership-found")({
  validateSearch: z.object({
    order_id: z.string().optional().catch(undefined),
    wa: z.string().optional().catch(undefined),
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembershipFoundPage,
});

function MembershipFoundPage() {
  const { order_id, wa } = Route.useSearch();
  const track = useServerFn(trackOrder);
  const query = useQuery({
    queryKey: ["existing-membership", order_id, wa],
    enabled: Boolean(order_id && wa),
    retry: false,
    queryFn: () => track({ data: { order_id: order_id!, whatsapp_number: wa! } }),
  });

  const order = query.data?.ok ? query.data.order : null;
  const payment = (order?.payment_status ?? "paid") as PaymentStatus;
  const voucher = (order?.voucher_status ?? "processing") as VoucherStatus;

  return (
    <SiteLayout>
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="container-site relative mx-auto max-w-2xl">
          <div className="surface-card rounded-[2rem] p-7 text-center sm:p-12">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-primary animate-pop">
              <BadgeCheck className="size-11" strokeWidth={2.2} />
            </span>
            <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Existing Membership Found</h1>
            <p className="mt-3 text-muted-foreground">
              This WhatsApp number already has a {SITE.product} with us, so no new payment was
              started. This is your existing order — not a new payment.
            </p>

            {query.isPending && Boolean(order_id && wa) && (
              <div className="mt-10 grid place-items-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            )}

            {order && (
              <>
                <dl className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                  {(
                    [
                      ["Existing Order Number", order.order_id],
                      ["Membership", order.membership],
                      ["Payment Status", PAYMENT_STATUS[payment] ?? order.payment_status],
                      ["Voucher Status", VOUCHER_STATUS[voucher] ?? order.voucher_status],
                      ["WhatsApp", formatWhatsApp(order.whatsapp_number)],
                      [
                        "Order date",
                        new Date(order.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }),
                      ],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="rounded-xl border bg-background/50 px-4 py-3">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="mt-1 break-all text-sm font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-10 text-left">
                  <StatusTimeline steps={deriveSteps(payment, voucher)} />
                </div>
              </>
            )}

            {!query.isPending && !order && (
              <p className="mt-8 text-sm text-muted-foreground">
                We couldn’t load the order details from this link. You can track your order with
                your WhatsApp number, or contact support.
              </p>
            )}

            <div className="mt-10 rounded-2xl border bg-background/50 p-5 text-left text-sm">
              <p className="font-semibold">What happens next</p>
              <p className="mt-2 text-muted-foreground">
                Your voucher is procured by our team and sent to your WhatsApp number —{" "}
                {SITE.voucherEta}. If you believe you need a second membership, please contact
                support first so we don’t charge you twice by mistake.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <Link to="/track" search={order_id ? { order_id } : {}}>
                  Track Your Order
                </Link>
              </Button>
              <Button asChild variant="whatsapp" size="lg">
                <a
                  href={supportWhatsAppUrl(buildSupportMessage(order?.order_id ?? order_id))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle /> Contact Support
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              WhatsApp support: {SITE.whatsappDisplay}
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
