import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { supportWhatsAppUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Why FITPASS", href: "/#why-fitpass" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Benefits", href: "/#benefits" },
  { label: "FAQs", href: "/#faqs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || open ? "glass border-b" : "border-b border-transparent",
      )}
    >
      <div className="container-site flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
          <Link
            to="/track"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Track Your Order
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost">
            <a href={supportWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-4 text-whatsapp" />
              Support
            </a>
          </Button>
          <Button asChild variant="default">
            <Link to="/checkout">
              Get FITPASS <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <a
            href={supportWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with BeterLyfe on WhatsApp"
            className="grid h-10 w-10 place-items-center rounded-full text-whatsapp transition-colors hover:bg-secondary"
          >
            <WhatsAppIcon />
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass border-t lg:hidden">
          <nav className="container-site flex flex-col gap-1 py-4" aria-label="Mobile">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {n.label}
              </a>
            ))}
            <Link
              to="/track"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Track Order
            </Link>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Contact
            </Link>
            <div className="mt-3 grid gap-2">
              <Button asChild size="lg">
                <Link to="/checkout" onClick={() => setOpen(false)}>
                  Get FITPASS <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={supportWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="size-4 text-whatsapp" /> WhatsApp Support
                </a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
