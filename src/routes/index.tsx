import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Hero } from "@/components/home/Hero";
import {
  Benefits,
  Comparison,
  FinalCTA,
  HowItWorks,
  OutsidePanipat,
  PerfectFor,
  RealLife,
  TrainWhereLife,
  TravelsWithYou,
} from "@/components/home/Sections";
import { FAQ, FAQS } from "@/components/home/FAQ";
import { SITE } from "@/lib/site";

const TITLE = "FITPASS 8-Month Membership ₹8,000 | BeterLyfe — FITPASS Membership Reseller";
const DESC =
  "Buy a FITPASS 8-month membership online for ₹8,000 from BeterLyfe, an independent FITPASS membership reseller in India. One membership, multiple participating gyms. Secure Razorpay payment, digital WhatsApp voucher delivery.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "keywords", content: "FITPASS membership, FITPASS 8 month membership, FITPASS membership price, FITPASS membership ₹8000, FITPASS membership India, buy FITPASS membership, FITPASS voucher" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: SITE.product,
              description: "8-month FITPASS membership resold by BeterLyfe. Access participating gyms through the FITPASS platform, subject to applicable access rules.",
              brand: { "@type": "Brand", name: "FITPASS" },
              offers: {
                "@type": "Offer",
                price: "8000",
                priceCurrency: "INR",
                availability: "https://schema.org/InStock",
                seller: { "@type": "Organization", name: "BeterLyfe" },
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <Comparison />
      <TravelsWithYou />
      <RealLife />
      <Benefits />
      <TrainWhereLife />
      <PerfectFor />
      <HowItWorks />
      <OutsidePanipat />
      <FAQ />
      <FinalCTA />
    </SiteLayout>
  );
}
