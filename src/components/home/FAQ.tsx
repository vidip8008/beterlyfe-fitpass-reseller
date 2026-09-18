import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE } from "@/lib/site";

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is FITPASS?",
    a: "FITPASS is a fitness membership platform where participating gyms are listed, allowing eligible members to access participating gyms through their membership rather than being restricted to a single gym.",
  },
  {
    q: "Can I use FITPASS at different gyms?",
    a: "Eligible members can access participating gyms available through FITPASS, subject to the applicable membership and gym access rules.",
  },
  {
    q: "Can I use FITPASS in another city?",
    a: "Eligible FITPASS memberships can provide access to participating gyms in other cities, subject to the applicable FITPASS access rules.",
  },
  {
    q: "Do I have to visit BeterLyfe to purchase?",
    a: "No. Customers can purchase online from anywhere in India.",
  },
  {
    q: "How will I receive my membership?",
    a: "The membership voucher is processed after payment and sent to the WhatsApp number provided during checkout.",
  },
  {
    q: "How long does voucher delivery take?",
    a: `Vouchers are processed manually by our team after payment confirmation and are ${SITE.voucherEta}. Delivery is not instant. You can check progress anytime on the Track Your Order page.`,
  },
  {
    q: "Is payment secure?",
    a: "Payments are processed through Razorpay. BeterLyfe never sees or stores your card, UPI or banking details.",
  },
  {
    q: "What if I don’t receive my voucher?",
    a: `Contact BeterLyfe Support on WhatsApp at ${SITE.whatsappDisplay} and provide your Order ID.`,
  },
  {
    q: "Is this the official FITPASS website?",
    a: "No. BeterLyfe is an independent reseller of FITPASS memberships and is not the official FITPASS website or FITPASS itself.",
  },
  {
    q: "Are all gyms available with my membership?",
    a: "Gym availability and access conditions may vary depending on the applicable membership and FITPASS rules. Customers should check the FITPASS platform for participating gyms and current access conditions.",
  },
];

export function FAQ() {
  return (
    <section id="faqs" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="reveal">
          <p className="eyebrow">FAQs</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">Questions, answered.</h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know before purchasing your 8-month FITPASS membership through BeterLyfe.
          </p>
        </div>
        <Accordion type="single" collapsible className="reveal grid gap-3 [transition-delay:120ms]">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`faq-${i}`}
              className="rounded-2xl border bg-surface/50 px-5 data-[state=open]:bg-surface"
            >
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
