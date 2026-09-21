import * as React from "react";

export type AskSkyTheme = "light" | "dark";
export type AskSkyThemeOption = AskSkyTheme | "auto";

function parseRgb(color: string): { r: number; g: number; b: number; a: number } | null {
  const m = color.match(/rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[/,]\s*([\d.]+))?\s*\)/i);
  if (!m) {
    return null;
  }
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] == null || m[4] === "" ? 1 : Number(m[4]),
  };
}

function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function parseAskSkyThemeAttr(raw: string | null | undefined): AskSkyTheme | null {
  const v = raw?.trim().toLowerCase();
  if (v === "light" || v === "dark") {
    return v;
  }
  return null;
}

export function prefersAskSkyDark(target: { matchMedia?: typeof window.matchMedia } | null = typeof window === "undefined" ? null : window): boolean {
  try {
    return Boolean(target?.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
  } catch {
    return false;
  }
}

export function sampleHostAskSkyTheme(root: ParentNode | null = typeof document === "undefined" ? null : document): AskSkyTheme | null {
  if (!root || typeof getComputedStyle !== "function") {
    return null;
  }
  const doc = "documentElement" in root ? (root as Document) : null;
  const html = doc?.documentElement ?? (root as Element);
  const body = doc?.body ?? null;
  const candidates = [body, html].filter((el): el is Element => Boolean(el));
  for (const el of candidates) {
    const parsed = parseRgb(getComputedStyle(el).backgroundColor);
    if (!parsed || parsed.a < 0.12) {
      continue;
    }
    return luminance(parsed.r, parsed.g, parsed.b) < 0.45 ? "dark" : "light";
  }
  return null;
}

export function resolveAskSkyTheme(option: AskSkyThemeOption, host: Document | null = typeof document === "undefined" ? null : document): AskSkyTheme {
  if (option === "light" || option === "dark") {
    return option;
  }
  if (host?.documentElement.classList.contains("news-light-html")) {
    return "light";
  }
  if (host?.documentElement.classList.contains("dark")) {
    return "dark";
  }
  const sampled = sampleHostAskSkyTheme(host);
  if (sampled) {
    return sampled;
  }
  return prefersAskSkyDark() ? "dark" : "light";
}

export function useResolvedAskSkyTheme(option: AskSkyThemeOption = "auto"): AskSkyTheme {
  const [theme, setTheme] = React.useState<AskSkyTheme>(() =>
    typeof document === "undefined" ? (option === "dark" ? "dark" : "light") : resolveAskSkyTheme(option),
  );

  React.useEffect(() => {
    const apply = () => setTheme(resolveAskSkyTheme(option));
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    }
    return () => {
      mq.removeEventListener("change", apply);
      obs.disconnect();
    };
  }, [option]);

  return theme;
}
