import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => legalHead("Terms & Conditions", "Terms and conditions for purchasing a FITPASS membership through BeterLyfe, an independent FITPASS membership reseller.", "/terms"),
  component: () => (
    <LegalPage
      title="Terms & Conditions"
      updated="1 January 2026"
      intro="Please read these terms before purchasing. By placing an order on this website you agree to them."
      sections={[
        { heading: "1. Who we are", body: <p>BeterLyfe (“we”, “us”) is an independent reseller of FITPASS memberships based in {SITE.location}. BeterLyfe is not FITPASS, is not the official FITPASS website and is not operated by FITPASS. FITPASS is a trademark of its respective owner.</p> },
        { heading: "2. The product", body: <><p>We sell the {SITE.product} for a one-time payment of {SITE.priceLabel}. The membership is provided by FITPASS and is governed by the applicable FITPASS membership terms and access rules, which you should review on the FITPASS platform.</p><p>Participating gyms, cities, access conditions and any limits are determined by FITPASS and may change. We make no guarantee that any specific gym, city or facility is available with your membership.</p></> },
        { heading: "3. Orders and payment", body: <><p>All payments are processed by Razorpay. The order amount is fixed by us and cannot be modified by the customer. An order is confirmed only once payment is verified by our systems.</p><p>You must provide accurate details (name, WhatsApp number, email, city). We are not responsible for delivery failures caused by incorrect information.</p></> },
        { heading: "4. Voucher processing and delivery", body: <><p>After payment confirmation, our team manually procures and processes your membership voucher. Delivery is digital, via WhatsApp to the number provided at checkout, and is {SITE.voucherEta}. Delivery is not instant.</p><p>Activation of the voucher on the FITPASS platform is your responsibility and subject to FITPASS’s activation process.</p></> },
        { heading: "5. Refunds and cancellations", body: <p>Please see our Refund & Cancellation Policy. Once a voucher has been delivered it generally cannot be cancelled or refunded.</p> },
        { heading: "6. Limitation of liability", body: <p>To the extent permitted by law, BeterLyfe is not liable for the availability, quality or conduct of any gym, for changes made by FITPASS to its platform or access rules, or for any indirect or consequential loss. Our total liability in connection with an order is limited to the amount paid for that order.</p> },
        { heading: "7. Contact", body: <p>WhatsApp/Phone {SITE.whatsappDisplay} · Email {SITE.email}</p> },
      ]}
    />
  ),
});
