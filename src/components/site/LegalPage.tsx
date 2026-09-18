import type { ReactNode } from "react";
import { SiteLayout, PageHeader } from "./SiteLayout";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro?: string; sections: LegalSection[] }) {
  return (
    <SiteLayout>
      <PageHeader eyebrow={`Last updated ${updated}`} title={title} {...(intro ? { intro } : {})} />
      <section className="pb-24">
        <div className="container-site">
          <article className="prose-legal max-w-3xl">
            {sections.map((s) => (
              <section key={s.heading} className="reveal mb-10">
                <h2 className="text-xl font-extrabold sm:text-2xl">{s.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </section>
    </SiteLayout>
  );
}

export function legalHead(title: string, desc: string, path: string) {
  return {
    meta: [
      { title: `${title} | BeterLyfe` },
      { name: "description", content: desc },
      { property: "og:title", content: `${title} | BeterLyfe` },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { property: "og:url", content: path },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: path }],
  };
}
