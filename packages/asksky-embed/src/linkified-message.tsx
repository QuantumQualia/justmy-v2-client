import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

type LinkMatch = { start: number; end: number; href: string; label: string };

function safeHttpUrl(label: string): string | null {
  try {
    const u = new URL(label);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function safeWww(label: string): string | null {
  try {
    const u = new URL(`https://${label}`);
    if (!u.hostname.includes(".")) return null;
    return u.href;
  } catch {
    return null;
  }
}

function safeMailtoHref(label: string): string | null {
  try {
    const u = new URL(label);
    if (u.protocol !== "mailto:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function safeMailtoFromEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return `mailto:${email}`;
}

function safeTelHref(label: string): string | null {
  try {
    const u = new URL(label);
    if (u.protocol !== "tel:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function safeTelFromPhoneLabel(label: string): string | null {
  const digits = label.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return `tel:${digits}`;
}

function execAll(re: RegExp, text: string, map: (label: string) => string | null): LinkMatch[] {
  const out: LinkMatch[] = [];
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const r = new RegExp(re.source, flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) {
    const label = m[0];
    const href = map(label);
    if (href) out.push({ start: m.index, end: m.index + label.length, href, label });
  }
  return out;
}

function gatherMatches(text: string): LinkMatch[] {
  const all: LinkMatch[] = [
    ...execAll(/https?:\/\/[^\s<>'"[\]{}|\\^`]+/gi, text, safeHttpUrl),
    ...execAll(/www\.[^\s<>'"[\]{}|\\^`]+/gi, text, safeWww),
    ...execAll(/mailto:[^\s<>'"[\]{}|\\^`]+/gi, text, safeMailtoHref),
    ...execAll(/tel:[^\s<>'"[\]{}|\\^`]+/gi, text, safeTelHref),
    ...execAll(/\b[\w.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, text, safeMailtoFromEmail),
    ...execAll(/\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g, text, safeTelFromPhoneLabel),
    ...execAll(/\b\+[\d\s().-]{9,}\d\b/g, text, safeTelFromPhoneLabel),
  ];

  all.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });

  return pickNonOverlapping(all);
}

function pickNonOverlapping(sorted: LinkMatch[]): LinkMatch[] {
  const picked: LinkMatch[] = [];
  outer: for (const m of sorted) {
    while (picked.length > 0) {
      const last = picked[picked.length - 1];
      if (!last) break;
      if (m.start >= last.end) break;
      if (m.end - m.start > last.end - last.start) {
        picked.pop();
        continue;
      }
      continue outer;
    }
    picked.push(m);
  }
  return picked.sort((a, b) => a.start - b.start);
}

function buildNodes(text: string, matches: LinkMatch[], linkClassName: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const m of matches) {
    if (m.start > cursor) {
      nodes.push(<span key={`t-${key++}`}>{text.slice(cursor, m.start)}</span>);
    }
    const isHttp = m.href.startsWith("http");
    nodes.push(
      <a
        key={`a-${key++}`}
        href={m.href}
        target={isHttp ? "_blank" : undefined}
        rel={isHttp ? "noopener noreferrer" : undefined}
        className={linkClassName}
      >
        {m.label}
      </a>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) {
    nodes.push(<span key={`t-${key++}`}>{text.slice(cursor)}</span>);
  }
  return nodes;
}

export function LinkifiedMessage({
  text,
  className,
  linkClassName,
}: {
  text: string;
  className?: string;
  linkClassName?: string;
}) {
  const nodes = React.useMemo(() => {
    const matches = gatherMatches(text);
    return buildNodes(
      text,
      matches,
      linkClassName ??
        "font-medium text-blue-300 underline decoration-blue-400/60 underline-offset-2 hover:text-white",
    );
  }, [text, linkClassName]);

  return <p className={cn("text-sm whitespace-pre-wrap break-words", className)}>{nodes}</p>;
}
