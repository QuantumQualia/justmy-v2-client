"use client";

import {
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  IdCard,
  Link2,
  Mail,
  Map,
  MapPin,
  Phone,
  Share2,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FaLinkedin } from "react-icons/fa6";
import {
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiX,
  SiYelp,
  SiYoutube,
} from "react-icons/si";

import { openShare } from "@/components/common/share/share-store";
import { tokenStorage } from "@/lib/storage/token-storage";
import { useNewsAuthUiStore } from "@/lib/store/news-auth-ui-store";
import { useNewsFavoritesStore } from "@/lib/store/news-favorites-store";

import type { AskSkyBusinessMapProps } from "./asksky-business-map";
import type {
  AskSkyBusinessCard,
  AskSkyPostCard,
  AskSkyResultTab,
  AskSkyTurn,
  AskSkyWebCard,
  NewsMarketContext,
} from "./types";

const AskSkyBusinessMap = dynamic<AskSkyBusinessMapProps>(
  () =>
    import("./asksky-business-map").then((m) => ({
      default: m.AskSkyBusinessMap,
    })),
  { ssr: false },
);

type AskSkyConversationProps = {
  market: NewsMarketContext;
  turns: AskSkyTurn[];
  onAsk: (query: string) => void;
  disabled?: boolean;
};

/** Tabs backed by real search data (Events omitted until API provides them). */
const TABS: {
  id: AskSkyResultTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "all", label: "ALL", icon: Sparkles },
  { id: "map", label: "MAP", icon: Map },
  { id: "posts", label: "POSTS", icon: FileText },
  { id: "mycards", label: "myCARDS", icon: IdCard },
];

/** Scrollable conversation body for the AskSKY widget (not page-level). */
export function AskSkyConversation({
  market,
  turns,
  onAsk,
  disabled = false,
}: AskSkyConversationProps) {
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<AskSkyResultTab>("all");
  const favorites = useNewsFavoritesStore((s) => s.byId);
  const hydrateFavorites = useNewsFavoritesStore((s) => s.hydrate);
  const toggleFavorite = useNewsFavoritesStore((s) => s.toggle);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const latestTurn = turns[turns.length - 1] ?? null;
  const latestReady =
    latestTurn?.status === "ready" && latestTurn.answer
      ? latestTurn
      : null;

  useEffect(() => {
    setTab("all");
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length, latestTurn?.status]);

  useEffect(() => {
    let cancelled = false;
    tokenStorage
      .getAccessToken()
      .then((token) => {
        if (!token || cancelled) return;
        return hydrateFavorites();
      })
      .catch(() => {
        /* stay empty when signed out or request fails */
      });
    return () => {
      cancelled = true;
    };
  }, [turns.length, hydrateFavorites]);

  const visibleTabs = useMemo(() => {
    if (!latestReady?.answer) return TABS.filter((t) => t.id === "all");
    return TABS.filter((t) => {
      if (t.id === "all") return true;
      return (latestReady.answer?.counts[t.id] ?? 0) > 0;
    });
  }, [latestReady]);

  const cards = useMemo(() => {
    if (!latestReady?.answer) return [];
    if (tab === "map") {
      return latestReady.answer.cards.filter((c) => c.type === "business");
    }
    if (tab === "mycards") {
      return latestReady.answer.cards.filter((c) => c.type === "business");
    }
    if (tab === "posts") {
      return latestReady.answer.cards.filter((c) => c.type === "post");
    }
    return latestReady.answer.cards;
  }, [latestReady, tab]);

  const mapBusinesses = useMemo(
    () => cards.filter((c): c is AskSkyBusinessCard => c.type === "business"),
    [cards],
  );
  const openAuth = useNewsAuthUiStore((s) => s.openAuth);

  async function handleFavoriteToggle(
    profileId: number,
    field: "liked" | "bookmarked",
    preview?: { name: string; slug?: string; photo?: string | null },
  ) {
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      openAuth();
      return;
    }
    try {
      await toggleFavorite(profileId, field, preview);
    } catch {
      /* store reverts optimistic flags */
    }
  }

  function submit(value: string) {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    setDraft("");
    onAsk(trimmed);
  }

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col border-t border-slate-100">
      <div
        ref={scrollRef}
        className="min-h-0 min-w-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3 sm:space-y-6 sm:px-6 sm:py-4 lg:px-8 [scrollbar-width:thin] [scrollbar-color:rgb(196_181_253)_rgb(248_250_252)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200 [&::-webkit-scrollbar-thumb]:hover:bg-violet-300"
      >
        {turns.map((turn, index) => {
          const isLatest = index === turns.length - 1;
          return (
            <ConversationTurn
              key={turn.id}
              turn={turn}
              market={market}
              isLatest={isLatest}
              tab={tab}
              visibleTabs={visibleTabs}
              cards={
                isLatest && turn.status === "ready"
                  ? cards
                  : (turn.answer?.cards ?? [])
              }
              mapBusinesses={
                isLatest && turn.status === "ready" ? mapBusinesses : []
              }
              favorites={favorites}
              onToggleFavorite={handleFavoriteToggle}
              onTabChange={setTab}
              onFollowUp={submit}
              followUpsDisabled={disabled}
            />
          );
        })}
      </div>

      <form
        className="shrink-0 min-w-0 border-t border-slate-100 bg-white px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <label htmlFor="asksky-followup" className="sr-only">
          Continue asking AskSKY
        </label>
        <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1 shadow-sm transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-200/60 sm:gap-2 sm:py-1.5 sm:pl-4 sm:pr-1.5">
          <input
            id="asksky-followup"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={disabled ? "SKY is typing…" : "Ask a follow-up…"}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          />
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-400 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <span className="sm:hidden">Ask →</span>
            <span className="hidden sm:inline">Ask SKY →</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function ConversationTurn({
  turn,
  market,
  isLatest,
  tab,
  visibleTabs,
  cards,
  mapBusinesses,
  favorites,
  onToggleFavorite,
  onTabChange,
  onFollowUp,
  followUpsDisabled,
}: {
  turn: AskSkyTurn;
  market: NewsMarketContext;
  isLatest: boolean;
  tab: AskSkyResultTab;
  visibleTabs: typeof TABS;
  cards: NonNullable<AskSkyTurn["answer"]>["cards"];
  mapBusinesses: AskSkyBusinessCard[];
  favorites: Record<number, { liked: boolean; bookmarked: boolean }>;
  onToggleFavorite: (
    profileId: number,
    field: "liked" | "bookmarked",
    preview?: { name: string; slug?: string; photo?: string | null },
  ) => void;
  onTabChange: (tab: AskSkyResultTab) => void;
  onFollowUp: (query: string) => void;
  followUpsDisabled: boolean;
}) {
  const answerText = turn.answer?.answer ?? "";
  const displayAnswer = answerText.replace(/\b\d{5}\b/, market.zipcode);
  const answerWithZipHighlight = highlightZipInAnswer(
    displayAnswer,
    market.zipcode,
  );

  return (
    <div className="min-w-0 space-y-3.5 sm:space-y-4">
      <div className="flex min-w-0 justify-end">
        <div className="min-w-0 max-w-[min(92%,100%)] break-words rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 sm:max-w-[70%] sm:px-4">
          {turn.query}
        </div>
      </div>

      {turn.status === "loading" ? (
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 shadow-md shadow-violet-500/25 sm:h-9 sm:w-9">
            <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm sm:bg-white"
            role="status"
            aria-live="polite"
            aria-label="SKY is typing"
          >
            <span
              className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "1.2s" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: "160ms", animationDuration: "1.2s" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: "320ms", animationDuration: "1.2s" }}
            />
          </div>
        </div>
      ) : null}

      {turn.status === "error" ? (
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-rose-500 to-violet-600 shadow-md sm:h-9 sm:w-9">
            <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 rounded-[1.25rem] border border-rose-200 bg-rose-50/80 p-3.5 sm:p-5">
            <p className="text-sm leading-relaxed text-rose-800 sm:text-[15px]">
              {turn.errorMessage?.trim() ||
                "Something went wrong. Try asking again."}
            </p>
          </div>
        </div>
      ) : null}

      {turn.status === "ready" && turn.answer ? (
        <>
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 shadow-md shadow-violet-500/25 sm:h-9 sm:w-9">
              <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-3.5 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.2)] sm:bg-white sm:p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 sm:text-[15px]">
                {answerWithZipHighlight}
              </p>
            </div>
          </div>

          {isLatest ? (
            <div className="space-y-3.5 pl-0 sm:space-y-4 sm:pl-12">
              {visibleTabs.length > 1 ? (
                <div className="-mx-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex min-w-max gap-2 sm:gap-2.5">
                    {visibleTabs.map(({ id, label, icon: Icon }) => {
                      const active = tab === id;
                      const count = turn.answer?.counts[id] ?? 0;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onTabChange(id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold tracking-wide transition sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                            active
                              ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                          {label}
                          <span
                            className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              active
                                ? "bg-violet-500 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {tab === "map" ? (
                <AskSkyBusinessMap businesses={mapBusinesses} />
              ) : cards.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {cards.map((card) =>
                    card.type === "business" ? (
                      <BusinessCard
                        key={card.id}
                        card={card}
                        liked={Boolean(favorites[card.profileId]?.liked)}
                        bookmarked={Boolean(favorites[card.profileId]?.bookmarked)}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ) : card.type === "post" ? (
                      <PostCard key={card.id} card={card} />
                    ) : (
                      <WebCard key={card.id} card={card} />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {turn.answer.followUps.length > 0 ? (
            <div className="flex flex-wrap gap-2 pl-0 sm:pl-12">
              {turn.answer.followUps.map((followUp) => (
                <button
                  key={followUp}
                  type="button"
                  disabled={followUpsDisabled}
                  onClick={() => onFollowUp(followUp)}
                  className="inline-flex max-w-full items-center rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1.5 text-left text-xs font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5 sm:py-2 sm:text-sm"
                >
                  <span className="line-clamp-2 sm:truncate">{followUp}</span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function highlightZipInAnswer(answer: string, zipcode: string) {
  if (!zipcode) return answer;
  const parts = answer.split(zipcode);
  if (parts.length === 1) return answer;
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 ? (
        <span className="font-semibold text-violet-600">{zipcode}</span>
      ) : null}
    </span>
  ));
}

const CONTACT_ICON_BTN =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700";

type ContactMenuItem = {
  key: string;
  label: string;
  href: string;
  external?: boolean;
};

function mapsHref(loc: AskSkyBusinessCard["locations"][number]): string | null {
  if (
    typeof loc.latitude === "number" &&
    Number.isFinite(loc.latitude) &&
    typeof loc.longitude === "number" &&
    Number.isFinite(loc.longitude)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  const address = loc.address?.trim();
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return null;
}

function normalizeSocialKey(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === "twitter" || n === "x.com") return "x";
  if (n === "fb") return "facebook";
  if (n === "ig" || n === "insta") return "instagram";
  if (n === "yt") return "youtube";
  return n.replace(/[^a-z0-9]/g, "");
}

function socialIcon(name: string): ReactNode {
  const key = normalizeSocialKey(name);
  const className = "h-3.5 w-3.5";
  switch (key) {
    case "facebook":
      return <SiFacebook className={className} aria-hidden />;
    case "instagram":
      return <SiInstagram className={className} aria-hidden />;
    case "x":
      return <SiX className={className} aria-hidden />;
    case "linkedin":
      return <FaLinkedin className={className} aria-hidden />;
    case "youtube":
      return <SiYoutube className={className} aria-hidden />;
    case "tiktok":
      return <SiTiktok className={className} aria-hidden />;
    case "yelp":
      return <SiYelp className={className} aria-hidden />;
    default:
      return <Link2 className={className} aria-hidden />;
  }
}

/** One contact icon; direct link when single, dropdown when multiple. */
function ContactIconControl({
  icon,
  label,
  items,
  menuId,
  openMenu,
  onOpenMenu,
}: {
  icon: ReactNode;
  label: string;
  items: ContactMenuItem[];
  menuId: string;
  openMenu: string | null;
  onOpenMenu: (id: string | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const open = openMenu === menuId;

  const onDocPointerDown = useEffectEvent((event: MouseEvent) => {
    if (!rootRef.current?.contains(event.target as Node)) {
      onOpenMenu(null);
    }
  });

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [open, onDocPointerDown]);

  if (items.length === 0) return null;

  const single = items.length === 1 ? items[0] : undefined;
  if (single) {
    return (
      <a
        href={single.href}
        target={single.external ? "_blank" : undefined}
        rel={single.external ? "noopener noreferrer" : undefined}
        className={CONTACT_ICON_BTN}
        aria-label={single.label}
        title={single.label}
      >
        {icon}
      </a>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => onOpenMenu(open ? null : menuId)}
        className={CONTACT_ICON_BTN}
        aria-label={`${label} (${items.length})`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`${label} (${items.length})`}
      >
        {icon}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-20 mt-1.5 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
        >
          {items.map((item) => (
            <a
              key={item.key}
              role="menuitem"
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              onClick={() => onOpenMenu(null)}
              className="block truncate px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
            >
              {item.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BusinessCard({
  card,
  liked,
  bookmarked,
  onToggleFavorite,
}: {
  card: AskSkyBusinessCard;
  liked: boolean;
  bookmarked: boolean;
  onToggleFavorite: (
    profileId: number,
    field: "liked" | "bookmarked",
    preview?: { name: string; slug?: string; photo?: string | null },
  ) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const initials = card.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const shareUrl = card.url?.trim() || card.website?.trim() || "";
  const emails =
    card.emails?.length > 0
      ? card.emails
      : card.email?.trim()
        ? [card.email.trim()]
        : [];
  const phones = card.phones.filter((p) => p.number?.trim());
  const locationLinks = card.locations
    .map((loc, index) => {
      const href = mapsHref(loc);
      if (!href) return null;
      const label =
        loc.title?.trim() ||
        loc.address?.trim() ||
        (card.locations.length > 1 ? `Location ${index + 1}` : "Location");
      return { href, label, key: `loc-${index}`, external: true as const };
    })
    .filter(
      (
        item,
      ): item is {
        href: string;
        label: string;
        key: string;
        external: true;
      } => Boolean(item),
    );

  const phoneItems: ContactMenuItem[] = phones.map((phone, index) => ({
    key: `phone-${index}-${phone.number}`,
    label: phone.type
      ? `${phone.type}: ${phone.number}`
      : phone.number,
    href: `tel:${phone.number.replace(/[^\d+]/g, "")}`,
  }));

  const emailItems: ContactMenuItem[] = emails.map((emailAddr) => ({
    key: `email-${emailAddr}`,
    label: emailAddr,
    href: `mailto:${emailAddr}`,
  }));

  const locationItems: ContactMenuItem[] = locationLinks.map((loc) => ({
    key: loc.key,
    label: loc.label,
    href: loc.href,
    external: true,
  }));

  function handleShare() {
    if (!shareUrl) return;
    void openShare({
      title: card.name,
      description: card.brief || card.location || undefined,
      url: shareUrl,
      imageUrl: card.photo,
      entityLabel: card.name,
    });
  }

  const hasContactBar =
    phoneItems.length > 0 ||
    emailItems.length > 0 ||
    locationItems.length > 0 ||
    Boolean(card.website?.trim()) ||
    Boolean(card.calendarLink?.trim()) ||
    card.socialLinks.length > 0;

  const favoritePreview = {
    name: card.name,
    slug: card.slug,
    photo: card.photo ?? null,
  };

  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-violet-200 bg-violet-50 text-sm font-bold text-violet-700">
        {card.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.photo}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initials || <Building2 className="h-6 w-6" aria-hidden />
        )}
      </div>

      <h3 className="mt-4 text-center text-base font-bold text-slate-900">
        {card.url ? (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-violet-700"
          >
            {card.name}
          </a>
        ) : (
          card.name
        )}
      </h3>

      {card.verified ? (
        <p className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-violet-600">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Verified
        </p>
      ) : null}

      {card.brief ? (
        <p className="mt-2 line-clamp-2 text-center text-xs text-slate-500">
          {card.brief}
        </p>
      ) : null}

      {card.perkLabel ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700">
          <Sparkles className="h-3 w-3" aria-hidden />
          {card.perkLabel}
        </p>
      ) : null}

      {hasContactBar ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <ContactIconControl
            icon={<Phone className="h-3.5 w-3.5" aria-hidden />}
            label="Phone"
            items={phoneItems}
            menuId={`${card.id}-phone`}
            openMenu={openMenu}
            onOpenMenu={setOpenMenu}
          />

          <ContactIconControl
            icon={<Mail className="h-3.5 w-3.5" aria-hidden />}
            label="Email"
            items={emailItems}
            menuId={`${card.id}-email`}
            openMenu={openMenu}
            onOpenMenu={setOpenMenu}
          />

          <ContactIconControl
            icon={<MapPin className="h-3.5 w-3.5" aria-hidden />}
            label="Location"
            items={locationItems}
            menuId={`${card.id}-location`}
            openMenu={openMenu}
            onOpenMenu={setOpenMenu}
          />

          {card.website?.trim() ? (
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              className={CONTACT_ICON_BTN}
              aria-label="Website"
              title="Website"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}

          {card.calendarLink?.trim() ? (
            <a
              href={card.calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className={CONTACT_ICON_BTN}
              aria-label="Calendar"
              title="Calendar"
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}

          {card.socialLinks.map((social) => (
            <a
              key={`${social.name}-${social.link}`}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              className={CONTACT_ICON_BTN}
              aria-label={social.name}
              title={social.name}
            >
              {socialIcon(social.name)}
            </a>
          ))}
        </div>
      ) : null}

      {card.hotlinks.length > 0 ? (
        <div className="mt-4 space-y-2">
          {card.hotlinks.map((hot) => (
            <a
              key={hot.label.toLowerCase()}
              href={hot.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              {hot.label}
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-center gap-2 pt-4">
        <button
          type="button"
          onClick={() =>
            onToggleFavorite(card.profileId, "liked", favoritePreview)
          }
          className={CONTACT_ICON_BTN}
          aria-label={liked ? `Unlike ${card.name}` : `Like ${card.name}`}
          aria-pressed={liked}
          title="Like"
        >
          <Heart
            className={`h-3.5 w-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={() =>
            onToggleFavorite(card.profileId, "bookmarked", favoritePreview)
          }
          className={CONTACT_ICON_BTN}
          aria-label={
            bookmarked
              ? `Remove bookmark for ${card.name}`
              : `Bookmark ${card.name}`
          }
          aria-pressed={bookmarked}
          title="Bookmark"
        >
          <Bookmark
            className={`h-3.5 w-3.5 ${bookmarked ? "fill-violet-500 text-violet-500" : ""}`}
            aria-hidden
          />
        </button>
        {shareUrl ? (
          <button
            type="button"
            onClick={handleShare}
            className={CONTACT_ICON_BTN}
            aria-label={`Share ${card.name}`}
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function PostCard({ card }: { card: AskSkyPostCard }) {
  const author = card.author;
  const authorHref =
    author?.profileUrl?.trim() || author?.profileLink?.trim() || "";
  const authorInitial = author?.profileName?.trim()?.charAt(0)?.toUpperCase() ?? "";

  function handleShare() {
    if (!card.url?.trim()) return;
    void openShare({
      title: card.title,
      description: card.excerpt || undefined,
      url: card.url,
      imageUrl: card.image,
      entityLabel: author?.profileName || "Post",
    });
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`relative flex h-36 items-start justify-between p-4 ${
          card.image
            ? "bg-slate-800 bg-cover bg-center"
            : "bg-linear-to-br from-slate-700 to-slate-900"
        }`}
        style={card.image ? { backgroundImage: `url(${card.image})` } : undefined}
      >
        {card.badge ? (
          <span className="ml-auto rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-semibold text-white">
            {card.badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {author ? (
          <div className="mb-3 flex items-center gap-2.5">
            {authorHref ? (
              <a
                href={authorHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
              >
                <AuthorAvatar
                  icon={author.profileIcon}
                  initial={authorInitial}
                />
                <span className="truncate text-sm font-semibold text-slate-800">
                  {author.profileName}
                </span>
              </a>
            ) : (
              <div className="flex min-w-0 items-center gap-2.5">
                <AuthorAvatar
                  icon={author.profileIcon}
                  initial={authorInitial}
                />
                <span className="truncate text-sm font-semibold text-slate-800">
                  {author.profileName}
                </span>
              </div>
            )}
          </div>
        ) : null}

        <h3 className="font-serif text-lg font-bold leading-snug text-slate-900">
          {card.url ? (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-violet-700"
            >
              {card.title}
            </a>
          ) : (
            card.title
          )}
        </h3>
        {card.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
            {card.excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
          {card.url ? (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-violet-600 transition hover:text-violet-500"
            >
              Read more &gt;
            </a>
          ) : (
            <span />
          )}
          {card.url ? (
            <button
              type="button"
              onClick={handleShare}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              aria-label={`Share ${card.title}`}
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Share
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AuthorAvatar({
  icon,
  initial,
}: {
  icon?: string;
  initial: string;
}) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-violet-200 bg-violet-50 text-xs font-bold text-violet-700">
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="h-full w-full object-cover" />
      ) : (
        initial || "?"
      )}
    </span>
  );
}

function WebCard({ card }: { card: AskSkyWebCard }) {
  let hostname = "";
  try {
    hostname = card.url ? new URL(card.url).hostname.replace(/^www\./, "") : "";
  } catch {
    hostname = "";
  }

  if (!card.url) return null;

  function handleShare() {
    void openShare({
      title: card.title,
      description: card.excerpt || undefined,
      url: card.url,
      entityLabel: hostname || "Web",
    });
  }

  return (
    <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300">
      <div className="flex items-center gap-2 text-xs font-medium text-violet-600">
        <Globe className="h-3.5 w-3.5" aria-hidden />
        {hostname || "Web"}
      </div>
      <h3 className="mt-3 font-serif text-lg font-bold leading-snug text-slate-900">
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-violet-700"
        >
          {card.title}
        </a>
      </h3>
      {card.excerpt ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
          {card.excerpt}
        </p>
      ) : null}
      <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-500"
        >
          Open link
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <button
          type="button"
          onClick={handleShare}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          aria-label={`Share ${card.title}`}
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Share
        </button>
      </div>
    </article>
  );
}
