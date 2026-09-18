import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, MapPin, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-gym.jpg";
import { SITE } from "@/lib/site";

const TRUST = ["Secure Razorpay Payment", "Digital WhatsApp Delivery", "Online Purchase from Anywhere"];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 lg:pb-24">
      {/* Background photo + gradients */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Young Indian woman walking through a modern premium gym at dusk"
          width={1536}
          height={1024}
          fetchPriority="high"
          className="h-full w-full object-cover object-[65%_center] opacity-50 lg:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60" />
        <div className="grid-fade absolute inset-0 opacity-60" />
      </div>

      <div className="container-site relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-2xl">
          <p className="eyebrow animate-fade-up">8-Month FITPASS Membership</p>
          <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl animate-fade-up [animation-delay:80ms]">
            One Membership.
            <br />
            <span className="text-gradient-lime">Multiple Gyms.</span>
            <br />
            More Freedom.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up [animation-delay:160ms]">
            Why limit yourself to one gym? With FITPASS, eligible members can access participating
            gyms available through the FITPASS platform in their city and, subject to applicable
            access rules, use their membership while travelling to other cities too.
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-1 animate-fade-up [animation-delay:240ms]">
            <span className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              {SITE.priceLabel}
            </span>
            <span className="pb-2 text-sm font-medium text-muted-foreground">
              8-month membership • One-time payment
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-fade-up [animation-delay:320ms]">
            <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
              <Link to="/checkout">
                Get My FITPASS <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
              <Link to="/contact">Talk to Us</Link>
            </Button>
          </div>

          <ul className="mt-7 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-4 animate-fade-up [animation-delay:400ms]">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-primary" strokeWidth={3} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto hidden w-full max-w-md lg:block [perspective:1400px] animate-fade-in [animation-delay:300ms]">
      {/* Membership card */}
      <div className="surface-card relative z-10 rounded-3xl p-6 animate-card-tilt [transform-style:preserve-3d]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Membership
            </p>
            <p className="mt-1 text-lg font-extrabold">FITPASS · 8 Months</p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground">
            ACTIVE
          </span>
        </div>

        <div className="my-8 grid place-items-center">
          <p className="text-center text-3xl font-extrabold leading-tight tracking-tight">
            TRAIN
            <br />
            WHERE
            <br />
            <span className="text-primary">YOU ARE</span>
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Dumbbell className="size-4 text-primary" />
            <span className="font-semibold">Participating gyms</span>
          </div>
          <span className="text-xs text-muted-foreground">via FITPASS app</span>
        </div>
      </div>

      {/* Location pins */}
      <LocationCard className="-left-10 top-6 animate-pin-float" city="YOUR CITY" />
      <LocationCard className="-right-8 bottom-10 animate-pin-float [animation-delay:1.4s]" city="ANOTHER CITY" />

      {/* Glow */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/15 blur-3xl" />
    </div>
  );
}

function LocationCard({ city, className }: { city: string; className?: string }) {
  return (
    <div className={`glass absolute z-20 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-elevated ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
        <MapPin className="relative size-4" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{city}</p>
        <p className="text-sm font-bold">Gym Access</p>
      </div>
    </div>
  );
}
