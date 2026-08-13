import type { SkySearchMycard, SkySearchResponse } from "@/lib/news/fetch-sky-search";

import type {
  AskSkyAnswer,
  AskSkyBusinessCard,
  AskSkyPostCard,
  AskSkyResultCard,
  AskSkyWebCard,
} from "./types";

/** Coerce API number | string coords (Prisma Decimal sometimes serializes as string). */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Locations that can appear on MAP (coords and/or address for geocoding). */
function countMapLocations(card: AskSkyBusinessCard): number {
  return card.locations.filter((loc) => {
    const lat = toFiniteNumber(loc.latitude);
    const lng = toFiniteNumber(loc.longitude);
    if (lat != null && lng != null) return true;
    return Boolean(loc.address?.trim());
  }).length;
}

function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function mapMycards(
  mycards: SkySearchMycard[],
): AskSkyBusinessCard[] {
  return mycards.map((card) => {
    const phones = dedupeByKey(
      (Array.isArray(card.phones) ? card.phones : []).filter((p) =>
        p.number?.trim(),
      ),
      (p) => p.number.replace(/\D/g, "") || p.number.toLowerCase(),
    );
    const locations = dedupeByKey(
      Array.isArray(card.locations) ? card.locations : [],
      (loc) =>
        [
          loc.latitude ?? "",
          loc.longitude ?? "",
          (loc.address || "").toLowerCase(),
          (loc.title || "").toLowerCase(),
        ].join("|"),
    );
    const socialLinks = dedupeByKey(
      (Array.isArray(card.socialLinks) ? card.socialLinks : [])
        .filter((s) => s.link?.trim())
        .map((s) => ({
          name: s.name?.trim() || "social",
          link: s.link.trim(),
        })),
      (s) => s.link.toLowerCase(),
    );
    // Unique by label — duplicate CTA rows often differ only by URL variant.
    const hotlinks = dedupeByKey(
      (Array.isArray(card.hotlinks) ? card.hotlinks : [])
        .filter((h) => h.link?.trim())
        .map((h) => ({
          label: h.label?.trim() || "Link",
          link: h.link.trim(),
        })),
      (h) => h.label.toLowerCase(),
    );
    const address =
      locations.find((l) => l.address?.trim())?.address?.trim() || undefined;
    const primaryPhone = phones[0]?.number?.trim();
    const email = card.email?.trim() || null;
    const emails = email ? [email] : [];

    return {
      id: `mycard-${card.profileId}`,
      type: "business" as const,
      profileId: card.profileId,
      name: card.name,
      verified: Boolean(card.isVerified),
      brief: card.brief?.trim() || undefined,
      photo: card.photo?.trim() || undefined,
      url: card.url?.trim() || undefined,
      website: card.website?.trim() || null,
      email,
      emails,
      calendarLink: card.calendarLink?.trim() || null,
      phone: primaryPhone,
      phones,
      locations: locations.map((loc) => ({
        title: loc.title,
        address: loc.address,
        latitude: toFiniteNumber(loc.latitude),
        longitude: toFiniteNumber(loc.longitude),
      })),
      location: address,
      socialLinks,
      hotlinks,
      rating: typeof card.rating === "number" ? card.rating : undefined,
    };
  });
}

function mapPostAuthor(
  author: SkySearchResponse["data"]["posts"][number]["author"],
): AskSkyPostCard["author"] {
  if (!author || typeof author !== "object") return undefined;
  const profileName = author.profileName?.trim() ?? "";
  if (!profileName) return undefined;
  return {
    profileId:
      typeof author.profileId === "number" ? author.profileId : null,
    profileName,
    profileLink: author.profileLink?.trim() ?? "",
    profileIcon: author.profileIcon?.trim() ?? "",
    profileUrl: author.profileUrl?.trim() ?? "",
  };
}

function mapPosts(
  posts: SkySearchResponse["data"]["posts"],
): AskSkyPostCard[] {
  return posts.map((post) => ({
    id: `post-${post.id}`,
    type: "post",
    title: post.title,
    excerpt: post.excerpt,
    url: post.url?.trim() || undefined,
    image: post.image?.trim() || undefined,
    badge: post.type === "shared" ? "Shared" : undefined,
    author: mapPostAuthor(post.author),
  }));
}

function mapWebResults(
  webResults: SkySearchResponse["data"]["webResults"],
): AskSkyWebCard[] {
  return webResults.map((result, index) => {
    const url = result.url?.trim() || "";
    return {
      id: `web-${index}-${url || "result"}`,
      type: "web",
      title: result.title?.trim() || url || "Web result",
      excerpt: result.snippet?.trim() || "",
      url,
    };
  });
}

/** Map POST /sky/search response into AskSKY conversation answer shape. */
export function mapSkySearchToAnswer(response: SkySearchResponse): AskSkyAnswer {
  const mycards = Array.isArray(response.data?.mycards)
    ? response.data.mycards
    : [];
  const posts = Array.isArray(response.data?.posts) ? response.data.posts : [];
  const webResults = Array.isArray(response.data?.webResults)
    ? response.data.webResults
    : [];

  const businessCards = mapMycards(mycards);
  const postCards = mapPosts(posts);
  const webCards = mapWebResults(webResults);

  const cards: AskSkyResultCard[] = [
    ...businessCards,
    ...postCards,
    ...webCards,
  ];

  const followUps = Array.isArray(response.followUpQuestions)
    ? response.followUpQuestions
        .map((q) => (typeof q === "string" ? q.trim() : ""))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const mapLocationCount = businessCards.reduce(
    (sum, card) => sum + countMapLocations(card),
    0,
  );

  return {
    answer: typeof response.reply === "string" ? response.reply : "",
    counts: {
      all: cards.length,
      map: mapLocationCount,
      events: 0,
      posts: posts.length,
      mycards: businessCards.length,
    },
    cards,
    followUps,
  };
}
