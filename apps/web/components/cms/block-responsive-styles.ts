/**
 * Builds real mobile / tablet / desktop styles for CMS blocks.
 * Inline React styles cannot use media queries, so responsive values are emitted as CSS text.
 *
 * Breakpoints align with common tablet/desktop splits (not identical to every Tailwind token).
 */
import type { CSSProperties } from "react";
import type { BlockStyles, ContainerLayout, ResponsiveValue } from "@/lib/services/cms";

/** Tablet and up */
export const CMS_STYLE_TABLET_MIN_PX = 768;
/** Desktop and up */
export const CMS_STYLE_DESKTOP_MIN_PX = 1024;

export function isResponsiveObject(value: unknown): value is ResponsiveValue<unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  return "mobile" in value || "tablet" in value || "desktop" in value;
}

/** React / DOM camelCase → CSS kebab-case */
export function camelToKebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

/** Reduce accidental `}` injection from CMS values */
function sanitizeCssToken(value: string): string {
  return value.replace(/[\n\r{}]/g, "").trim();
}

/**
 * Mobile-first: optional base (mobile), then overrides at tablet / desktop when those keys are set.
 * Uses `!= null` so 0 and "" are preserved when explicitly set.
 */
export function buildResponsivePropertyCSS(
  selector: string,
  cssPropertyKebab: string,
  value: ResponsiveValue<string | number> | string | number | undefined
): string {
  if (value === undefined || value === null) return "";

  if (!isResponsiveObject(value)) {
    const raw = typeof value === "number" ? String(value) : value;
    const safe = sanitizeCssToken(String(raw));
    if (!safe) return "";
    return `${selector}{${cssPropertyKebab}:${safe};}`;
  }

  const o = value as ResponsiveValue<string | number>;
  const m = o.mobile != null ? sanitizeCssToken(String(o.mobile)) : "";
  const t = o.tablet != null ? sanitizeCssToken(String(o.tablet)) : "";
  const d = o.desktop != null ? sanitizeCssToken(String(o.desktop)) : "";

  let out = "";
  if (m) out += `${selector}{${cssPropertyKebab}:${m};}`;
  if (t) out += `@media (min-width:${CMS_STYLE_TABLET_MIN_PX}px){${selector}{${cssPropertyKebab}:${t};}}`;
  if (d) out += `@media (min-width:${CMS_STYLE_DESKTOP_MIN_PX}px){${selector}{${cssPropertyKebab}:${d};}}`;
  return out;
}

type StyleField = keyof Pick<
  BlockStyles,
  | "padding"
  | "margin"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "width"
  | "maxWidth"
  | "minHeight"
  | "display"
  | "flexDirection"
  | "alignItems"
  | "justifyContent"
  | "gap"
>;

const BLOCK_STYLE_FIELDS: StyleField[] = [
  "padding",
  "margin",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "width",
  "maxWidth",
  "minHeight",
  "display",
  "flexDirection",
  "alignItems",
  "justifyContent",
  "gap",
];

function appendField(
  chunks: string[],
  inline: CSSProperties,
  selector: string,
  reactKey: StyleField,
  raw: unknown
) {
  if (raw === undefined || raw === null) return;

  const kebab = camelToKebab(reactKey);

  if (!isResponsiveObject(raw)) {
    (inline as Record<string, unknown>)[reactKey] = raw as string | number;
    return;
  }

  const css = buildResponsivePropertyCSS(selector, kebab, raw as ResponsiveValue<string>);
  if (css) chunks.push(css);
}

/**
 * Scalar block styles → inline; responsive fields → concatenated CSS for `selector`.
 */
export function compileBlockStyles(
  styles: BlockStyles | undefined,
  selector: string
): { inline: CSSProperties; responsiveCss: string } {
  if (!styles) return { inline: {}, responsiveCss: "" };

  const inline: CSSProperties = {};
  const chunks: string[] = [];

  if (styles.backgroundColor) inline.backgroundColor = styles.backgroundColor;
  if (styles.textColor) inline.color = styles.textColor;
  if (styles.borderRadius) inline.borderRadius = styles.borderRadius;
  if (styles.border) inline.border = styles.border;

  for (const key of BLOCK_STYLE_FIELDS) {
    const v = styles[key as keyof BlockStyles];
    appendField(chunks, inline, selector, key, v);
  }

  return { inline, responsiveCss: chunks.join("") };
}

export interface ContainerWrapperParts {
  containerClasses: string;
  inline: CSSProperties;
  responsiveCss: string;
}

/**
 * Outer layout wrapper: same responsive rules as before, but maxWidth / horizontal padding respect breakpoints.
 */
export function compileContainerWrapper(
  layout: ContainerLayout | undefined,
  selector: string
): ContainerWrapperParts {
  const layoutType = layout?.type || "container";
  const containerClasses: string[] = [];
  const inline: CSSProperties = {};
  const chunks: string[] = [];

  if (layoutType === "full-width") {
    containerClasses.push("w-full");
  } else if (layoutType === "boxed") {
    containerClasses.push("w-full", "mx-auto");
    const maxW = layout?.maxWidth;
    if (maxW !== undefined && maxW !== null) {
      appendField(chunks, inline, selector, "maxWidth", maxW);
    } else {
      inline.maxWidth = "1200px";
    }
    const pad = layout?.padding;
    if (pad !== undefined && pad !== null) {
      appendField(chunks, inline, selector, "paddingLeft", pad);
      appendField(chunks, inline, selector, "paddingRight", pad);
    } else {
      inline.paddingLeft = "1rem";
      inline.paddingRight = "1rem";
    }
  } else {
    containerClasses.push("w-full", "mx-auto", "px-4", "sm:px-6", "lg:px-8");
    const maxW = layout?.maxWidth;
    if (maxW !== undefined && maxW !== null) {
      appendField(chunks, inline, selector, "maxWidth", maxW);
    } else {
      inline.maxWidth = "1280px";
    }
  }

  return {
    containerClasses: containerClasses.join(" "),
    inline,
    responsiveCss: chunks.join(""),
  };
}
