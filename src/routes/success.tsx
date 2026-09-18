import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { StatusTimeline, deriveSteps } from "@/components/site/StatusTimeline";
import { SITE, formatWhatsApp, supportWhatsAppUrl } from "@/lib/site";
import { buildSupportMessage } from "@/lib/whatsapp";

const searchSchema = z.object({
  order_id: z.string().optional().catch(undefined),
  wa: z.string().optional().catch(undefined),
});

const TITLE = "Payment Successful | BeterLyfe";

export const Route = createFileRoute("/success")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: "Your FITPASS membership payment was received. Your voucher is being processed and will be sent on WhatsApp." },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: "Your FITPASS membership payment was received." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { order_id, wa } = Route.useSearch();
  const steps = deriveSteps("paid", "processing");

  return (
    <SiteLayout>
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="container-site relative mx-auto max-w-2xl">
          <div className="surface-card rounded-[2rem] p-7 text-center sm:p-12">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-primary animate-pop">
              <CheckCircle2 className="size-11" strokeWidth={2.2} />
            </span>
            <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Payment Successful ✓</h1>
            <p className="mt-3 text-muted-foreground">
              Thank you! Your payment has been received and your FITPASS membership voucher is now being processed.
            </p>

            {order_id ? (
              <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-2xl border bg-background/60 px-5 py-3">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Order ID</p>
                  <p className="font-mono text-lg font-bold">{order_id}</p>
                </div>
                <button
                  type="button"
                  aria-label="Copy order ID"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => {
                    navigator.clipboard?.writeText(order_id);
                    toast.success("Order ID copied");
                  }}
                >
                  <Copy className="size-4" />
                </button>
              </div>
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">
                We couldn’t read your Order ID from this link. Check your email or contact support.
              </p>
            )}

            <div className="mt-10 text-left">
              <StatusTimeline steps={steps} />
            </div>

            <div className="mt-10 rounded-2xl border bg-background/50 p-5 text-left text-sm">
              <p className="font-semibold">What happens next</p>
              <p className="mt-2 text-muted-foreground">
                Your voucher will be sent to the WhatsApp number provided during checkout once it is ready
                {wa ? (
                  <>
                    {" "}
                    (<span className="font-semibold text-foreground">{formatWhatsApp(wa)}</span>)
                  </>
                ) : null}
                . Vouchers are processed by our team and are {SITE.voucherEta}.
              </p>
              <p className="mt-2 text-muted-foreground">Save your Order ID — you can track progress anytime.</p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <Link to="/track" search={order_id ? { order_id } : {}}>Track Your Order</Link>
              </Button>
              <Button asChild variant="whatsapp" size="lg">
                <a href={supportWhatsAppUrl(buildSupportMessage(order_id))} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Need help? Contact Support
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">WhatsApp support: {SITE.whatsappDisplay}</p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
