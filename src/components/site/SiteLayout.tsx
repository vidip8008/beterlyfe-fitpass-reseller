import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { useReveal } from "@/hooks/use-reveal";

export function SiteLayout({ children }: { children: ReactNode }) {
  useReveal();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40 sm:pb-16">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="container-site relative">
        {eyebrow && <p className="eyebrow animate-fade-up">{eyebrow}</p>}
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl lg:text-6xl animate-fade-up [animation-delay:80ms]">
          {title}
        </h1>
        {intro && (
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg animate-fade-up [animation-delay:160ms]">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
