import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/refund-policy")({
  head: () => legalHead("Refund & Cancellation Policy", "Refund and cancellation policy for FITPASS memberships purchased through BeterLyfe.", "/refund-policy"),
  component: () => (
    <LegalPage
      title="Refund & Cancellation Policy"
      updated="1 January 2026"
      intro="Membership vouchers are digital, non-transferable products procured specifically for your order."
      sections={[
        { heading: "1. Before the voucher is delivered", body: <p>If you wish to cancel before your voucher has been delivered, contact us on WhatsApp at {SITE.whatsappDisplay} with your Order ID. Where the voucher has not yet been procured, we will cancel the order and refund the full amount to the original payment method.</p> },
        { heading: "2. After the voucher is delivered", body: <p>Once a voucher code has been sent to your WhatsApp number, the order is considered fulfilled and cannot be cancelled or refunded, as the voucher can no longer be reused.</p> },
        { heading: "3. Failed or duplicate payments", body: <p>If a payment fails, no order is fulfilled and any amount debited is normally reversed automatically by your bank or Razorpay. Verified duplicate payments for the same order will be refunded in full.</p> },
        { heading: "4. Voucher issues", body: <p>If your voucher does not work as described, contact support with your Order ID. We will work with you to resolve the issue, which may include replacement or a refund at our discretion where the fault is on our side.</p> },
        { heading: "5. Refund timelines", body: <p>Approved refunds are initiated within 5–7 working days and typically reflect in your account within 5–10 working days depending on your bank.</p> },
        { heading: "6. Contact", body: <p>WhatsApp/Phone {SITE.whatsappDisplay} · Email {SITE.email}</p> },
      ]}
    />
  ),
});
