import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import { DraftBadge, Eyebrow } from "./marketing-ui";

export type LegalJumpLink = { id: string; label: string };

export function LegalPage({
  eyebrow = "LEGAL",
  title,
  updated,
  draft,
  intro,
  jump,
  children,
}: {
  eyebrow?: string;
  title: string;
  updated: ReactNode;
  draft?: ReactNode;
  intro?: ReactNode;
  jump: LegalJumpLink[];
  children: ReactNode;
}) {
  return (
    <main className="bg-background text-foreground">
      <header className="mx-auto max-w-3xl px-4 pb-9 pt-14 sm:px-6 sm:pt-16">
        <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{updated}</p>
        {draft ? <DraftBadge className="mt-5">{draft}</DraftBadge> : null}
        {intro ? <div className="mt-6 text-[15px] leading-7 text-muted-foreground [&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline">{intro}</div> : null}
      </header>

      <nav aria-label={`${title} sections`} className="mx-auto flex max-w-3xl flex-wrap gap-2 px-4 pb-10 sm:px-6">
        {jump.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="rounded-full bg-secondary px-3.5 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:bg-accent"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">{children}</div>
    </main>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 border-t border-border py-8 first:border-t-0",
        "[&_p]:mb-3.5 [&_p]:text-[15px] [&_p]:leading-7 [&_p]:text-muted-foreground [&_p:last-child]:mb-0",
        "[&_ul]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:mb-2 [&_li]:text-[15px] [&_li]:leading-7 [&_li]:text-muted-foreground",
        "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[15px] [&_h3]:font-extrabold [&_h3]:text-foreground",
        "[&_b]:text-foreground [&_strong]:text-foreground",
        "[&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline",
      )}
    >
      <h2 className="mb-3.5 font-serif text-2xl">{title}</h2>
      {children}
    </section>
  );
}

/** A second heading inside one section (e.g. "Attribution" under Advertisements). */
export function LegalSubheading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-3.5 mt-7 scroll-mt-24 font-serif text-2xl">
      {children}
    </h2>
  );
}

export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 justmy-corners bg-accent px-4 py-3.5 text-sm leading-relaxed text-accent-foreground [&_b]:text-foreground">
      {children}
    </div>
  );
}

export function LegalTable({ head, rows }: { head: [string, string]; rows: Array<[ReactNode, ReactNode]> }) {
  return (
    <div className="mb-3.5 overflow-hidden justmy-corners-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary text-secondary-foreground">
          <tr>
            <th className="px-4 py-3 font-bold">{head[0]}</th>
            <th className="px-4 py-3 font-bold">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([who, why], index) => (
            <tr key={index} className="border-t border-border align-top">
              <td className="w-1/3 px-4 py-3 font-semibold text-foreground">{who}</td>
              <td className="px-4 py-3 leading-relaxed text-muted-foreground">{why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href}>{children}</Link>;
}
