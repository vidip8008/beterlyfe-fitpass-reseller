import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { z } from "zod";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE, supportWhatsAppUrl } from "@/lib/site";

const TITLE = "Contact BeterLyfe — FITPASS Membership Reseller";
const DESC = "Talk to BeterLyfe on WhatsApp, phone or email about the FITPASS 8-month membership, orders and voucher delivery.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  contact: z.string().trim().min(5, "Enter your WhatsApp number or email").max(120),
  message: z.string().trim().min(5, "Tell us a little more").max(1000),
});

function ContactPage() {
  const [v, setV] = useState({ name: "", contact: "", message: "" });
  const [err, setErr] = useState<Partial<typeof v>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(v);
    if (!p.success) {
      const n: Partial<typeof v> = {};
      for (const i of p.error.issues) n[i.path[0] as keyof typeof v] ??= i.message;
      setErr(n);
      return;
    }
    setErr({});
    const text = `Hi BeterLyfe 👋\n\nName: ${p.data.name}\nContact: ${p.data.contact}\n\n${p.data.message}`;
    window.open(supportWhatsAppUrl(text), "_blank", "noopener,noreferrer");
  }

  const methods = [
    { icon: MessageCircle, label: "WhatsApp", value: SITE.whatsappDisplay, href: supportWhatsAppUrl() },
    { icon: Phone, label: "Phone", value: SITE.phoneDisplay, href: SITE.phoneHref },
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  ];

  return (
    <SiteLayout>
      <PageHeader eyebrow="Contact" title="Let’s Talk" intro="Questions about the FITPASS 8-month membership, your order or voucher delivery? Reach us any way you like." />
      <section className="pb-24">
        <div className="container-site grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3 self-start">
            {methods.map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="surface-card group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                  <p className="truncate font-semibold group-hover:text-primary">{value}</p>
                </div>
              </a>
            ))}
            <p className="mt-2 text-xs text-muted-foreground">Based in {SITE.location}. Customers anywhere in India can order online.</p>
          </div>

          <form onSubmit={submit} noValidate className="surface-card grid gap-5 rounded-3xl p-6 sm:p-8">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-semibold">Name</Label>
              <Input id="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Your name" />
              {err.name && <p className="text-xs text-destructive">{err.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact" className="font-semibold">WhatsApp number or email</Label>
              <Input id="contact" value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} placeholder="How should we reply?" />
              {err.contact && <p className="text-xs text-destructive">{err.contact}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message" className="font-semibold">Message</Label>
              <Textarea id="message" rows={5} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} placeholder="Tell us how we can help" />
              {err.message && <p className="text-xs text-destructive">{err.message}</p>}
            </div>
            <Button type="submit" variant="hero" size="lg">
              <Send /> Send via WhatsApp
            </Button>
            <p className="text-xs text-muted-foreground">Your message opens in WhatsApp so you can review it before sending.</p>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
