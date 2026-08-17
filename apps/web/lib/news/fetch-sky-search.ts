import { ApiClientError } from "@/lib/api-client";

export type SkySearchMarket = {
  id: number;
  name: string;
  site: string | null;
};

export type SkySearchMycardPhone = {
  type: string;
  number: string;
  extension?: string | null;
};

export type SkySearchMycardLocation = {
  title?: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type SkySearchMycardSocial = {
  name: string;
  link: string;
};

export type SkySearchMycardHotlink = {
  label: string;
  link: string;
};

export type SkySearchMycard = {
  profileId: number;
  name: string;
  slug?: string;
  brief?: string;
  url?: string;
  photo?: string;
  rating?: number;
  isVerified?: boolean;
  osName?: string;
  email?: string | null;
  website?: string | null;
  calendarLink?: string | null;
  phones: SkySearchMycardPhone[];
  locations: SkySearchMycardLocation[];
  socialLinks: SkySearchMycardSocial[];
  hotlinks: SkySearchMycardHotlink[];
  source: "local";
};

export type SkySearchPostAuthor = {
  profileId: number | null;
  profileName: string;
  profileLink: string;
  profileIcon: string;
  /** Absolute profile URL on the market site. */
  profileUrl: string;
};

export type SkySearchPost = {
  type: "post" | "shared";
  id: number;
  title: string;
  excerpt: string;
  url: string;
  image: string | null;
  contentTypeId: number | null;
  createdOn: string;
  modifiedOn: string;
  author?: SkySearchPostAuthor | null;
};

export type SkySearchWebResult = {
  url: string;
  title?: string;
  snippet?: string;
};

export type SkySearchData = {
  mycards: SkySearchMycard[];
  posts: SkySearchPost[];
  webResults: SkySearchWebResult[];
};

export type SkySearchResponse = {
  conversationId: number;
  visitorToken: string | null;
  market: SkySearchMarket;
  reply: string;
  followUpQuestions: string[];
  data: SkySearchData;
};

export type SkySearchRequest = {
  query: string;
  domain?: string | null;
  zipCode?: string | null;
  conversationId?: number | null;
  visitorToken?: string | null;
};

/**
 * Client-side market AskSKY search via Next BFF (no JWT required).
 * Omit conversationId + visitorToken to start a thread; send both to continue.
 */
export async function fetchSkySearch(
  params: SkySearchRequest,
): Promise<SkySearchResponse> {
  const query = params.query.trim();
  if (!query) {
    throw new ApiClientError("Enter a search query.");
  }

  const body: Record<string, unknown> = { query };

  const zip = params.zipCode?.trim() ?? "";
  if (zip) body.zipCode = zip.slice(0, 10);

  const domain = params.domain?.trim() ?? "";
  if (domain) body.domain = domain.slice(0, 255);

  const conversationId =
    typeof params.conversationId === "number" && params.conversationId > 0
      ? params.conversationId
      : null;
  const visitorToken =
    typeof params.visitorToken === "string" && params.visitorToken.trim()
      ? params.visitorToken.trim().slice(0, 128)
      : null;

  if (conversationId != null) {
    body.conversationId = conversationId;
    if (visitorToken) body.visitorToken = visitorToken;
  }

  const res = await fetch("/api/news/sky/search", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as
    | SkySearchResponse
    | { message?: string };

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : "AskSKY search failed.";
    throw new ApiClientError(message, res.status);
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("conversationId" in data) ||
    !("reply" in data) ||
    !("data" in data)
  ) {
    throw new ApiClientError("Unexpected AskSKY search response.");
  }

  return data as SkySearchResponse;
}
