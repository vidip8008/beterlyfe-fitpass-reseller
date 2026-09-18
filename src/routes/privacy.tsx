import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => legalHead("Privacy Policy", "How BeterLyfe collects, uses and protects your personal information when you order a FITPASS membership.", "/privacy"),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      updated="1 January 2026"
      intro="We collect only what we need to process and deliver your order."
      sections={[
        { heading: "1. Information we collect", body: <p>When you place an order we collect your full name, WhatsApp number, email address and city, together with payment references (Razorpay order and payment IDs) and the status of your order. We do not receive or store your card, UPI or bank details — these are handled by Razorpay.</p> },
        { heading: "2. How we use it", body: <ul className="list-disc space-y-1 pl-5"><li>To create and verify your order and payment.</li><li>To procure and deliver your membership voucher via WhatsApp.</li><li>To provide customer support and order tracking.</li><li>To comply with legal and accounting obligations.</li></ul> },
        { heading: "3. Sharing", body: <p>We share information only with Razorpay (payment processing), our hosting and database providers, and FITPASS to the extent needed to procure your membership. We do not sell your personal data.</p> },
        { heading: "4. Order tracking", body: <p>Order status can be viewed only by entering both the Order ID and the matching WhatsApp number. Internal order management is restricted to authenticated BeterLyfe staff.</p> },
        { heading: "5. Retention and security", body: <p>Order records are retained as required for accounting and support. Data is stored with access controls and encrypted in transit. Payment verification is performed server-side.</p> },
        { heading: "6. Your rights", body: <p>You may request access to, correction of, or deletion of your personal data (subject to legal retention requirements) by contacting {SITE.email}.</p> },
        { heading: "7. Contact", body: <p>WhatsApp/Phone {SITE.whatsappDisplay} · Email {SITE.email}</p> },
      ]}
    />
  ),
});
