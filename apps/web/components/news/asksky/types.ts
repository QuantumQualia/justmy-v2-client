export type NewsMarketContext = {
  marketId?: number;
  marketSlug: string;
  marketName: string;
  zipcode: string;
  city: string | null;
  state: string | null;
  site: string | null;
  cityState: string;
  metroLabel: string;
  dailyAudioBriefingEnabled: boolean;
};

export type AskSkyResultTab = "all" | "map" | "events" | "posts" | "mycards";

export type AskSkyBusinessPhone = {
  type: string;
  number: string;
  extension?: string | null;
};

export type AskSkyBusinessLocation = {
  title?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type AskSkyBusinessSocial = {
  name: string;
  link: string;
};

export type AskSkyBusinessHotlink = {
  label: string;
  link: string;
};

export type AskSkyBusinessCard = {
  id: string;
  type: "business";
  profileId: number;
  name: string;
  verified: boolean;
  /** Profile handle used to open myCARD on the main app origin. */
  slug?: string;
  brief?: string;
  photo?: string;
  url?: string;
  website?: string | null;
  /** @deprecated Prefer `emails`. */
  email?: string | null;
  /** Profile contact emails (schema currently has one; kept as array for UI). */
  emails: string[];
  calendarLink?: string | null;
  /** @deprecated Prefer `phones`. */
  phone?: string;
  phones: AskSkyBusinessPhone[];
  locations: AskSkyBusinessLocation[];
  /** Display address (first location with address). */
  location?: string;
  socialLinks: AskSkyBusinessSocial[];
  hotlinks: AskSkyBusinessHotlink[];
  rating?: number;
  perkLabel?: string;
};

export type AskSkyPostAuthor = {
  profileId: number | null;
  profileName: string;
  profileLink: string;
  profileIcon: string;
  profileUrl: string;
};

export type AskSkyPostCard = {
  id: string;
  type: "post";
  title: string;
  excerpt: string;
  url?: string;
  image?: string;
  badge?: string;
  author?: AskSkyPostAuthor;
};

export type AskSkyWebCard = {
  id: string;
  type: "web";
  title: string;
  excerpt: string;
  url: string;
};

export type AskSkyResultCard =
  | AskSkyBusinessCard
  | AskSkyPostCard
  | AskSkyWebCard;

export type AskSkyAnswer = {
  answer: string;
  counts: Record<AskSkyResultTab, number>;
  cards: AskSkyResultCard[];
  followUps: string[];
};

/** One user question + AskSKY response in the conversation thread. */
export type AskSkyTurn = {
  id: string;
  query: string;
  status: "loading" | "ready" | "error";
  answer?: AskSkyAnswer;
  errorMessage?: string;
};
