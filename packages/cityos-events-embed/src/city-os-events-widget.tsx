import {
  DefaultWordRenderer,
  WordCloud,
  type Word,
  type WordRendererData,
} from "@isoterik/react-word-cloud";
import * as React from "react";
import type { CityOsEventDto } from "./types";

function cn(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface CityOsEventsTagCloudProps {
  marketName: string;
  marketCity?: string | null;
  marketSiteTitle?: string | null;
  events: CityOsEventDto[];
  variant?: "light" | "dark";
  className?: string;
}

type CityOsWord = Word & {
  isHeadline?: boolean;
  ticketUrl?: string;
  fillHex?: string;
};

const PALETTE_DARK = ["#f8fafc", "#67e8f9", "#fcd34d", "#34d399"] as const;
const HEADLINE_DARK = "#34d399";

const PALETTE_LIGHT = ["#0f172a", "#047857", "#0369a1", "#b45309"] as const;
const HEADLINE_LIGHT = "#047857";

const CLOUD_FONT =
  'Fonarto, ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function styleSeed(title: string, i: number): number {
  let h = i * 374761393;
  for (let c = 0; c < title.length; c++) {
    h = Math.imul(h ^ title.charCodeAt(c), 2654435761);
  }
  return h >>> 0;
}

const EVENT_SIZE_DOMAIN: [number, number] = [22, 99];
const EVENT_FONT_RANGE: [number, number] = [11, 36];

function eventFontSize(value: number): number {
  const [d0, d1] = EVENT_SIZE_DOMAIN;
  const [r0, r1] = EVENT_FONT_RANGE;
  const v = Math.min(d1, Math.max(d0, value));
  const t = Math.sqrt((v - d0) / (d1 - d0));
  return Math.round(r0 + t * (r1 - r0));
}

function sectionTitlePlace(
  marketCity: string | null | undefined,
  marketName: string,
  marketSiteTitle: string | null | undefined,
): string {
  const raw = (marketCity || marketName || marketSiteTitle || "your city").trim();
  return raw.length ? raw : "your city";
}

function headlineText(
  marketCity: string | null | undefined,
  marketName: string,
  marketSiteTitle: string | null | undefined,
): string {
  return `THIS WEEK IN ${sectionTitlePlace(marketCity, marketName, marketSiteTitle).toUpperCase()}`;
}

function headlineFontSize(containerWidth: number, text: string, minAboveEvents: number): number {
  const w = Math.max(220, containerWidth);
  const byLength = w / (text.length * 0.48);
  return Math.round(Math.min(56, Math.max(minAboveEvents, byLength)));
}

function buildWords(
  events: CityOsEventDto[],
  headline: string,
  containerWidth: number,
  variant: "light" | "dark",
): CityOsWord[] {
  const palette = variant === "light" ? PALETTE_LIGHT : PALETTE_DARK;
  const headlineFill = variant === "light" ? HEADLINE_LIGHT : HEADLINE_DARK;

  const headlineWord: CityOsWord = {
    text: headline,
    value: 100_000,
    isHeadline: true,
    ticketUrl: "",
    fillHex: headlineFill,
  };

  const eventWords: CityOsWord[] = events.map((ev, i) => {
    const seed = styleSeed(ev.title, i);
    const w = 22 + (seed % 78);
    return {
      text: ev.title,
      value: w,
      ticketUrl: typeof ev.ticketUrl === "string" ? ev.ticketUrl : "",
      fillHex: palette[seed % palette.length]!,
    };
  });

  return [headlineWord, ...eventWords];
}

function createCityRenderWord(variant: "light" | "dark") {
  return function cityRenderWord(data: WordRendererData, ref?: React.Ref<SVGTextElement>) {
    const w = data as WordRendererData & CityOsWord;
    const url = (w.ticketUrl ?? "").trim();
    const clickable = !w.isHeadline && url.length > 0;
    const headlineStroke =
      variant === "light" ? "rgba(226, 232, 240, 0.95)" : "rgba(10, 22, 40, 0.85)";
    return (
      <DefaultWordRenderer
        ref={ref}
        data={{
          ...data,
          onWordClick: clickable ? data.onWordClick : undefined,
          onWordMouseOver: clickable ? data.onWordMouseOver : undefined,
          onWordMouseOut: clickable ? data.onWordMouseOut : undefined,
        }}
        textStyle={
          w.isHeadline
            ? {
                paintOrder: "stroke fill",
                stroke: headlineStroke,
                strokeWidth: variant === "light" ? 1.75 : 2,
              }
            : undefined
        }
      />
    );
  };
}

export function CityOsEventsTagCloud({
  marketName,
  marketCity,
  marketSiteTitle,
  events,
  variant = "dark",
  className,
}: CityOsEventsTagCloudProps) {
  const headline = React.useMemo(
    () => headlineText(marketCity, marketName, marketSiteTitle),
    [marketCity, marketName, marketSiteTitle],
  );

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [dims, setDims] = React.useState({ w: 320, h: 280 });

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      setDims((d) => (d.w === w && d.h === h ? d : { w, h }));
    });
    ro.observe(el);
    const r0 = el.getBoundingClientRect();
    setDims({ w: Math.max(1, Math.floor(r0.width)), h: Math.max(1, Math.floor(r0.height)) });
    return () => ro.disconnect();
  }, []);

  const words = React.useMemo(
    () => buildWords(events, headline, dims.w, variant) as Word[],
    [dims.w, events, headline, variant],
  );

  const fontSize = React.useCallback(
    (word: Word) => {
      const w = word as CityOsWord;
      if (w.isHeadline) {
        return headlineFontSize(dims.w, w.text, EVENT_FONT_RANGE[1]! + 10);
      }
      return eventFontSize(w.value);
    },
    [dims.w],
  );

  const fontWeight = React.useCallback((word: Word) => ((word as CityOsWord).isHeadline ? 900 : 700), []);

  const padding = React.useCallback((word: Word) => ((word as CityOsWord).isHeadline ? 5 : 2), []);

  const paletteFallback = variant === "light" ? PALETTE_LIGHT[0]! : PALETTE_DARK[0]!;
  const fill = React.useCallback(
    (word: Word) => (word as CityOsWord).fillHex ?? paletteFallback,
    [paletteFallback],
  );

  const onWordClick = React.useCallback(
    (word: Word, _index: number, event: React.MouseEvent<SVGTextElement, MouseEvent>) => {
      event.preventDefault();
      const w = word as CityOsWord;
      if (w.isHeadline) return;
      const url = (w.ticketUrl ?? "").trim();
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    },
    [],
  );

  const renderWord = React.useMemo(() => createCityRenderWord(variant), [variant]);

  const cloud = (
    <WordCloud
      words={words}
      width={dims.w}
      height={dims.h}
      enableTooltip={false}
      font={CLOUD_FONT}
      fontStyle="normal"
      fontWeight={fontWeight}
      fontSize={fontSize}
      padding={padding}
      rotate={() => 0}
      spiral="rectangular"
      timeInterval={Number.POSITIVE_INFINITY}
      fill={fill}
      transition="none"
      renderWord={renderWord}
      onWordClick={onWordClick}
      svgProps={{
        className: "block max-h-full w-full",
        role: "img",
        "aria-label": events.length ? "Event titles" : "This week headline",
      }}
    />
  );

  const shell =
    variant === "light"
      ? "border border-slate-200 bg-white px-2 py-5 shadow-sm md:px-4 md:pt-10 md:pb-8"
      : // Single arbitrary gradient: composed bg-linear-to-br + from/via/to can lose stops in shadow CSS order.
        "bg-[linear-gradient(to_bottom_right,#020618,#0a1628,#0f172b)] px-2 py-5 shadow-inner md:px-4 md:pt-10 md:pb-8";

  const glow =
    variant === "light" ? (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.06),transparent_55%)]" />
    ) : (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_55%)]" />
    );

  const emptyNote = variant === "light" ? "text-slate-500" : "text-slate-400";

  if (!events.length) {
    return (
      <div className={cn(shell, "relative overflow-hidden", className)}>
        {glow}
        <div className="relative overflow-hidden">
          <div
            ref={wrapRef}
            className="relative mx-auto h-[min(28vh,220px)] w-full min-h-[160px]"
            aria-label="This week headline"
          >
            {cloud}
          </div>
          <p className={cn("px-2 pb-2 text-center text-sm", emptyNote)}>No upcoming events for this market.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(shell, "relative overflow-hidden", className)}>
      {glow}
      <div
        ref={wrapRef}
        className="relative mx-auto h-[min(44vh,420px)] w-full min-h-[280px] md:min-h-[320px]"
        aria-label="Event titles"
      >
        {cloud}
      </div>
    </div>
  );
}
