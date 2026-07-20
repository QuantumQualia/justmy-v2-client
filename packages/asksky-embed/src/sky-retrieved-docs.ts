import type { SkyRetrievedDoc } from "./sky-types";

const LIVE_SEARCH_CITATION_CAP = 8;

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asSourceKind(value: unknown): SkyRetrievedDoc["sourceKind"] {
  if (value === "website" || value === "document" || value === "unknown" || value === "live") {
    return value;
  }
  return "unknown";
}

/** Normalize API / SSE `retrievedDocs` into a typed list. */
export function parseSkyRetrievedDocs(raw: unknown): SkyRetrievedDoc[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const out: SkyRetrievedDoc[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") {
      continue;
    }
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" && rec.url.trim() ? rec.url.trim() : null;
    const title = typeof rec.title === "string" && rec.title.trim() ? rec.title.trim() : null;
    const snippet = typeof rec.snippet === "string" ? rec.snippet : "";
    out.push({
      index: typeof rec.index === "number" && Number.isFinite(rec.index) ? rec.index : i,
      agentId: asNullableNumber(rec.agentId),
      knowledgeSourceId: asNullableNumber(rec.knowledgeSourceId),
      pageId: asNullableNumber(rec.pageId),
      pageNumber: asNullableNumber(rec.pageNumber),
      sourceKind: asSourceKind(rec.sourceKind),
      title,
      url,
      snippet,
      score: typeof rec.score === "number" && Number.isFinite(rec.score) ? rec.score : 0,
      chunkIndex: typeof rec.chunkIndex === "number" && Number.isFinite(rec.chunkIndex) ? rec.chunkIndex : 0,
    });
  }
  return out;
}

export type SkyCitationLink = {
  url: string;
  label: string;
  live: boolean;
};

function hostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "") || url;
  } catch {
    return url;
  }
}

/**
 * Clickable citation rows for the answer bubble. Prefers `sourceKind === 'live'`,
 * but also includes other docs that have a usable URL (e.g. KB website sources).
 */
export function citationLinksFromRetrievedDocs(
  docs: SkyRetrievedDoc[] | null | undefined,
  max = LIVE_SEARCH_CITATION_CAP,
): SkyCitationLink[] {
  if (!docs?.length) {
    return [];
  }

  const withUrl = docs.filter((d) => typeof d.url === "string" && d.url.trim().length > 0);
  if (withUrl.length === 0) {
    return [];
  }

  const live = withUrl.filter((d) => d.sourceKind === "live");
  const preferred = live.length > 0 ? live : withUrl;
  const seen = new Set<string>();
  const links: SkyCitationLink[] = [];

  for (const doc of preferred) {
    const url = doc.url!.trim();
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    links.push({
      url,
      label: doc.title?.trim() || hostnameLabel(url),
      live: doc.sourceKind === "live",
    });
    if (links.length >= max) {
      break;
    }
  }

  return links;
}
