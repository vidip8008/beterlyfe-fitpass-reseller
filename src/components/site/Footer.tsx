import { Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { SITE, supportWhatsAppUrl } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t bg-surface/60">
      <div className="container-site grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground">
            One membership. Multiple participating gyms. More freedom. Purchase your 8-month
            FITPASS membership online and receive it digitally on WhatsApp.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Explore</h3>
          <ul className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="/#why-fitpass">Why FITPASS</a></li>
            <li><a className="hover:text-foreground" href="/#how-it-works">How It Works</a></li>
            <li><a className="hover:text-foreground" href="/#benefits">Benefits</a></li>
            <li><a className="hover:text-foreground" href="/#faqs">FAQs</a></li>
            <li><Link className="hover:text-foreground" to="/track">Track Your Order</Link></li>
            <li><Link className="hover:text-foreground" to="/contact">Contact</Link></li>
            <li><Link className="hover:text-foreground" to="/terms">Terms &amp; Conditions</Link></li>
            <li><Link className="hover:text-foreground" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-foreground" to="/refund-policy">Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Contact</h3>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <li>
              <a
                className="flex items-center gap-2.5 hover:text-foreground"
                href={supportWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-4 text-whatsapp" /> WhatsApp {SITE.whatsappDisplay}
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2.5 hover:text-foreground" href={SITE.phoneHref}>
                <Phone className="size-4 text-primary" /> Phone {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2.5 hover:text-foreground" href={`mailto:${SITE.email}`}>
                <Mail className="size-4 text-primary" /> {SITE.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container-site flex flex-col gap-4 py-6 text-xs text-muted-foreground md:flex-row md:items-start md:justify-between">
          <p className="max-w-3xl leading-relaxed">{SITE.disclaimer}</p>
          <p className="shrink-0">© {new Date().getFullYear()} BeterLyfe · {SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
