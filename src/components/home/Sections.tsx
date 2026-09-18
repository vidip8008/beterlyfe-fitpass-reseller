import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Check,
  Dumbbell,
  GraduationCap,
  Home,
  MapPin,
  MessageCircle,
  Plane,
  Send,
  ShieldCheck,
  Smartphone,
  X,
  CreditCard,
  Ticket,
  Building2,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import travelImg from "@/assets/travel-city.jpg";
import cardCity from "@/assets/card-your-city.jpg";
import cardLocation from "@/assets/card-different-location.jpg";
import cardAnother from "@/assets/card-another-city.jpg";

/* ---------- Shared ---------- */

function SectionHead({
  eyebrow,
  title,
  intro,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`reveal max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-base text-muted-foreground sm:text-lg">{intro}</p>}
    </div>
  );
}

/* ---------- 10. USP comparison ---------- */

export function Comparison() {
  const left = ["One gym", "One location", "Less flexibility", "Difficult when travelling"];
  const right = ["Multiple participating gyms", "More flexibility", "Useful across locations", "One membership"];
  return (
    <section id="why-fitpass" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-site">
        <SectionHead eyebrow="Why FITPASS" title="Why Be Tied to One Gym?" />
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="reveal rounded-3xl border bg-surface/50 p-7 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Traditional Gym Membership
            </p>
            <ul className="mt-6 grid gap-4">
              {left.map((i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary">
                    <X className="size-3.5" />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal surface-card relative overflow-hidden rounded-3xl p-7 sm:p-8 [transition-delay:120ms]">
            <div className="bg-glow pointer-events-none absolute inset-0" />
            <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-primary">FITPASS</p>
            <ul className="relative mt-6 grid gap-4">
              {right.map((i) => (
                <li key={i} className="flex items-center gap-3 font-medium text-foreground">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 11. Travels with you ---------- */

export function TravelsWithYou() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="container-site grid items-center gap-12 lg:grid-cols-2">
        <div className="reveal">
          <p className="eyebrow">Flexibility</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            Your Membership Travels With You
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">Your routine doesn’t always stay in one place.</p>
          <ul className="mt-6 grid gap-3">
            {[
              { icon: Home, t: "Maybe you’re at home today." },
              { icon: Briefcase, t: "At work tomorrow." },
              { icon: Plane, t: "Travelling next week." },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-3 text-foreground">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="font-semibold">{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-muted-foreground">
            With an eligible FITPASS membership, you can discover and access participating gyms
            through the FITPASS platform instead of being restricted to one gym.
          </p>
          <p className="mt-4 text-muted-foreground">
            When travelling, eligible members may also access participating FITPASS gyms in other
            cities, subject to applicable membership and access rules.
          </p>
        </div>

        <div className="reveal relative mx-auto w-full max-w-md [transition-delay:150ms]">
          <div className="relative overflow-hidden rounded-3xl border shadow-elevated">
            <img
              src={travelImg}
              alt="Young professional with a gym bag stepping out of a metro station in a modern Indian city"
              width={1280}
              height={1600}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="glass absolute left-4 top-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold animate-pin-float">
              <MapPin className="size-3.5 text-primary" /> YOUR CITY
            </div>
            <div className="glass absolute right-4 top-1/3 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold animate-pin-float [animation-delay:1s]">
              <MapPin className="size-3.5 text-primary" /> ANOTHER CITY
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-surface/80 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">One membership</p>
              <p className="mt-1 text-lg font-extrabold">Find participating gyms wherever your week takes you.</p>
            </div>
          </div>
          <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
        </div>
      </div>
    </section>
  );
}

/* ---------- 12. Built around real life ---------- */

export function RealLife() {
  const stats = [
    { big: "8 Months", small: "of membership" },
    { big: "₹8,000", small: "one-time payment" },
    { big: "Multiple", small: "participating gyms" },
    { big: "Digital", small: "WhatsApp delivery" },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="container-site">
        <SectionHead
          eyebrow="Designed for how you live"
          title="Built Around Real Life"
          intro="Fitness should fit around your life — not require you to stay tied to one location. One 8-month membership that keeps up with your schedule, your city and your travel."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.big}
              className="reveal surface-card rounded-3xl p-6 text-center sm:p-8"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{s.big}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.small}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 13. Benefits ---------- */

export function Benefits() {
  const items = [
    { icon: Dumbbell, t: "Multiple Gyms", d: "Choose from participating gyms available through the FITPASS platform rather than being restricted to one gym." },
    { icon: MapPin, t: "Flexible Locations", d: "Useful when your routine takes you to different parts of a city." },
    { icon: Plane, t: "Travel-Friendly", d: "When travelling, eligible members can use participating FITPASS gyms in other cities, subject to applicable access rules." },
    { icon: Smartphone, t: "Digital Delivery", d: "Purchase online and receive your membership voucher digitally through WhatsApp." },
  ];
  return (
    <section id="benefits" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-site">
        <SectionHead eyebrow="Benefits" title="One Membership. More Ways to Train." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, t, d }, i) => (
            <div
              key={t}
              className="reveal surface-card group rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-foreground">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 14. Train where life takes you ---------- */

export function TrainWhereLife() {
  const cards = [
    { img: cardCity, alt: "Man performing a barbell squat in a modern Indian gym", t: "Your City", d: "Find participating gyms available through FITPASS near you.", icon: Building2 },
    { img: cardLocation, alt: "Woman running on a treadmill in a gym overlooking a city at night", t: "Different Location", d: "Maintain flexibility when your daily routine changes.", icon: MapPin },
    { img: cardAnother, alt: "Traveller with a duffel bag arriving at a gym in another city", t: "Another City", d: "Use your eligible FITPASS membership at participating gyms while travelling, subject to applicable access rules.", icon: Globe2 },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="container-site">
        <SectionHead eyebrow="Wherever you are" title="Train Where Life Takes You" />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cards.map(({ img, alt, t, d, icon: Icon }, i) => (
            <article
              key={t}
              className="reveal group relative overflow-hidden rounded-3xl border"
              style={{ transitionDelay: `${i * 110}ms` }}
            >
              <img
                src={img}
                alt={alt}
                width={1024}
                height={1280}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="glass inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                  <Icon className="size-3.5 text-primary" /> {t}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{d}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 15. Perfect for ---------- */

export function PerfectFor() {
  const items = [
    { icon: Plane, t: "Frequent Travellers", d: "Keep your fitness routine going when travelling." },
    { icon: GraduationCap, t: "Students", d: "More flexibility when moving between home, college and other locations." },
    { icon: Briefcase, t: "Working Professionals", d: "Useful when work takes you between locations." },
    { icon: Dumbbell, t: "Fitness Enthusiasts", d: "Explore participating gyms instead of committing to just one gym." },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="container-site">
        <SectionHead eyebrow="Perfect for" title="Built for People Who Don’t Stay in One Place" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, t, d }, i) => (
            <div
              key={t}
              className="reveal rounded-3xl border bg-surface/40 p-6 transition-colors hover:bg-surface"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <Icon className="size-6 text-primary" />
              <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.18em]">{t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 16. How it works ---------- */

export function HowItWorks() {
  const steps = [
    { n: "01", icon: Ticket, t: "Get Your Membership", d: "Purchase the 8-month FITPASS membership for ₹8,000." },
    { n: "02", icon: CreditCard, t: "Pay Securely", d: "Complete your payment through Razorpay." },
    { n: "03", icon: ShieldCheck, t: "Voucher Processing", d: "After payment confirmation, your membership voucher is processed." },
    { n: "04", icon: Send, t: "WhatsApp Delivery", d: "Your voucher code and activation instructions are sent to your WhatsApp number." },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-site">
        <SectionHead eyebrow="How it works" title="Fitness Without the Single-Gym Commitment" />
        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, icon: Icon, t, d }, i) => (
            <li
              key={n}
              className="reveal surface-card relative rounded-3xl p-6"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-extrabold text-primary/80">{n}</span>
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.18em]">{t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <p className="reveal mt-6 text-center text-xs text-muted-foreground">
          Gym availability and access are subject to the applicable FITPASS membership terms and access rules.
        </p>
      </div>
    </section>
  );
}

/* ---------- 17. Outside Panipat ---------- */

export function OutsidePanipat() {
  const flow = ["Order Online", "Secure Payment", "Voucher Processing", "WhatsApp Delivery"];
  const trust = [
    { icon: ShieldCheck, t: "Secure Razorpay Checkout" },
    { icon: Ticket, t: "Digital Voucher Delivery" },
    { icon: MessageCircle, t: "WhatsApp Support" },
    { icon: Globe2, t: "Online Ordering" },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="container-site">
        <div className="reveal surface-card relative overflow-hidden rounded-[2rem] p-8 sm:p-12">
          <div className="bg-glow pointer-events-none absolute inset-0" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow">Ordering online</p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">Buying From Outside Panipat?</h2>
              <p className="mt-3 text-xl font-semibold text-foreground">You don’t need to visit us.</p>
              <p className="mt-4 text-muted-foreground">Place your order online from anywhere in India.</p>
              <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold">
                {flow.map((f, i) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="rounded-full border bg-background/60 px-3 py-1.5">{f}</span>
                    {i < flow.length - 1 && <ArrowRight className="size-4 text-primary" />}
                  </li>
                ))}
              </ol>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {trust.map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-3 rounded-2xl border bg-background/50 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold">
                    <Check className="mr-1 inline size-3.5 text-primary" strokeWidth={3} />
                    {t}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 33. Final CTA ---------- */

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-site">
        <div className="reveal relative overflow-hidden rounded-[2rem] border bg-surface px-6 py-16 text-center sm:px-12 sm:py-24">
          <div className="grid-fade absolute inset-0" />
          <div className="absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl">Stop Paying for Just One Gym.</h2>
            <p className="mt-5 text-base text-muted-foreground sm:text-lg">
              Get the flexibility of an 8-month FITPASS membership and access participating gyms
              available through the platform, including eligible locations when you travel.
            </p>
            <p className="mt-8 text-5xl font-extrabold tracking-tight sm:text-6xl">{SITE.priceLabel}</p>
            <p className="mt-2 text-sm text-muted-foreground">8-month membership • One-time payment</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="hero" size="xl">
                <Link to="/checkout">
                  Get My FITPASS <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/contact">Talk to Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
