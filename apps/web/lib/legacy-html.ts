import { safeVideoEmbedSrc } from "@/lib/utils/video";

const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|form|noscript|textarea|select|button|input)\b[^>]*>[\s\S]*?<\/\1>/gi;

const ALLOWED = new Set([
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "blockquote",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

/** Turn stored legacy markup into real tags, including values saved as `&lt;p&gt;`. */
export function unwrapLegacyMarkup(value: string) {
  let current = value.trim();
  for (let i = 0; i < 3; i += 1) {
    if (!/&(?:lt|gt|amp|quot|nbsp|#39|apos);/i.test(current)) break;
    const decoded = decodeEntities(current);
    if (decoded === current) break;
    current = decoded;
  }
  return current;
}

export function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function attribute(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function isSafeUrl(value: string, allowDataImage: boolean) {
  const url = value.trim();
  if (!url || url.startsWith("#")) return url.startsWith("#");
  if (allowDataImage && /^data:image\//i.test(url)) return true;
  if (/^(javascript|data|vbscript):/i.test(url)) return false;
  return /^(https?:|mailto:|tel:|\/|\.\/|\.\.\/)/i.test(url) || !/^[a-z]+:/i.test(url);
}

/**
 * Keep readable structure from legacy HTML and drop Bootstrap layout, scripts, and inline styles.
 * The result is styled by the current site instead of the old grid classes.
 */
export function sanitizeLegacyHtml(value: string) {
  let html = unwrapLegacyMarkup(value).replace(DROP_WITH_CONTENT, "").replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<\/?([a-z0-9:-]+)([^>]*)>/gi, (full, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    const closing = full.startsWith("</");
    if (!ALLOWED.has(tag)) return "";
    if (closing) return tag === "br" || tag === "hr" || tag === "img" ? "" : `</${tag}>`;
    if (tag === "br" || tag === "hr") return `<${tag}>`;
    if (tag === "img") {
      const src = attribute(attrs, "src");
      if (!src || !isSafeUrl(src, true)) return "";
      const alt = attribute(attrs, "alt");
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`;
    }
    if (tag === "a") {
      const href = attribute(attrs, "href");
      if (!href || !isSafeUrl(href, false)) return "<a>";
      return `<a href="${escapeAttr(href)}" rel="noopener noreferrer">`;
    }
    return `<${tag}>`;
  });
  html = html.replace(/<p>(?:\s|<br>|&nbsp;)*<\/p>/gi, "");
  return html.trim();
}

const RAW_DROP =
  /<(iframe|object|embed|form|noscript|textarea|select|button|input|link|meta)\b[^>]*>[\s\S]*?<\/\1>/gi;
const RAW_DROP_VOID =
  /<(iframe|object|embed|form|noscript|link|meta|button|input|textarea|select)\b[^>]*\/?>/gi;

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>|<script\b([^>]*)\/>/gi;
const IFRAME_TAG = /<iframe\b([^>]*)>([\s\S]*?)<\/iframe>|<iframe\b([^>]*)\/?>/gi;

/** https://justmy.com, https://*.justmy.com, or a path on the page's own site. */
export function isFirstPartyScriptSrc(value: string) {
  const src = value.trim();
  if (!src || /[\s\\]/.test(src) || src.includes("\0")) return false;
  if (src.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) && !/^https:/i.test(src)) return false;
  if (src.startsWith("/") || src.startsWith("./") || src.startsWith("../")) return true;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  return host === "justmy.com" || host.endsWith(".justmy.com");
}

export interface FirstPartyScript {
  src: string;
  data: Record<string, string>;
}

function scriptDataAttributes(attrs: string) {
  const data: Record<string, string> = {};
  const pattern = /\s(data-[a-z0-9-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(attrs))) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!name || !value || value.length > 500 || /(?:javascript|data|vbscript):/i.test(value)) continue;
    data[name.toLowerCase()] = value;
  }
  return data;
}

/**
 * Legacy sections store CSS inside the HTML. Pull every `<style>` block out
 * so the raw block can render the rules without a hand split.
 */
export function splitStyleTags(source: string) {
  const css: string[] = [];
  const html = unwrapLegacyMarkup(source).replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_full, inner: string) => {
      const rules = String(inner ?? "")
        .replace(/<\/style/gi, "")
        .trim();
      if (rules) css.push(rules);
      return "";
    },
  );
  return { html: html.trim(), css: css.join("\n\n") };
}

/**
 * Pull first-party script URLs out of authored HTML. Inline scripts and other hosts are dropped.
 * A hidden marker is left where each allowed script sat so the page can mount it there.
 * `<style>` blocks are returned separately so mixed legacy markup still renders.
 */
export function prepareRawHtml(value: string) {
  const scripts: FirstPartyScript[] = [];
  const split = splitStyleTags(value);
  const withoutScripts = split.html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(SCRIPT_TAG, (_full, attrsA: string, body: string, attrsB: string) => {
      const attrs = attrsA || attrsB || "";
      const src = attribute(attrs, "src").trim();
      if (!src || (body ?? "").trim() || !isFirstPartyScriptSrc(src)) return "";
      const marker = scripts.length;
      scripts.push({ src, data: scriptDataAttributes(attrs) });
      return `<span data-raw-script="${marker}" hidden></span>`;
    });
  return { html: sanitizeRawHtml(withoutScripts), scripts, css: split.css };
}

function safeContentIframe(attrs: string) {
  const rawSrc = attribute(attrs, "src").trim();
  const videoSrc = safeVideoEmbedSrc(rawSrc);
  const src = videoSrc || (isFirstPartyScriptSrc(rawSrc) ? rawSrc : "");
  if (!src) return "";
  const parts = [`src="${escapeAttr(src)}"`, `style="border:0"`];
  const width = attribute(attrs, "width").trim();
  const height = attribute(attrs, "height").trim();
  if (/^\d{1,4}(%|px)?$/.test(width)) parts.push(`width="${width}"`);
  if (/^\d{1,4}(%|px)?$/.test(height)) parts.push(`height="${height}"`);
  const title = attribute(attrs, "title").trim();
  if (title && title.length <= 200) parts.push(`title="${escapeAttr(title)}"`);
  const loading = attribute(attrs, "loading").trim().toLowerCase();
  if (loading === "lazy" || loading === "eager") parts.push(`loading="${loading}"`);
  if (videoSrc) {
    parts.push(
      `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`,
    );
    parts.push(`referrerpolicy="strict-origin-when-cross-origin"`);
  }
  return `<iframe ${parts.join(" ")}></iframe>`;
}

/**
 * Keep authored structure for the raw HTML block, including class and layout tags.
 * Inline scripts, foreign embeds, and event handlers are removed.
 * Iframes stay for justmy.com and for video hosts such as YouTube and Vimeo.
 */
export function sanitizeRawHtml(value: string) {
  const iframes: string[] = [];
  let html = unwrapLegacyMarkup(value)
    .replace(SCRIPT_TAG, "")
    .replace(IFRAME_TAG, (_full, attrsA: string, _body: string, attrsB: string) => {
      const safe = safeContentIframe(attrsA || attrsB || "");
      if (!safe) return "";
      const marker = iframes.length;
      iframes.push(safe);
      return `<span data-raw-iframe="${marker}" hidden></span>`;
    })
    .replace(DROP_WITH_CONTENT, "")
    .replace(RAW_DROP, "")
    .replace(RAW_DROP_VOID, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(
    /\s(href|src|action)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (_full, name: string, dq: string, sq: string, bare: string) => {
      const url = dq ?? sq ?? bare ?? "";
      if (!isSafeUrl(url, name === "src")) return "";
      return ` ${name}="${escapeAttr(url)}"`;
    },
  );
  html = html.replace(/<span data-raw-iframe="(\d+)" hidden><\/span>/g, (_full, index: string) => {
    return iframes[Number(index)] ?? "";
  });
  return html.trim();
}

/** Plain text for excerpts, taglines, and share text. Tags are not shown. */
export function legacyPlainText(value?: string | null) {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  const normalized = unwrapLegacyMarkup(raw);
  if (!looksLikeHtml(normalized)) return normalized;
  return sanitizeLegacyHtml(normalized)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
