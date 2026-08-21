"use client";

import {
  ChevronDown,
  CloudSun,
  Loader2,
  LogIn,
  Pause,
  Play,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { NewsAccountAvatar } from "@/components/news/asksky/news-account-avatar";
import { NewsAccountSidebar } from "@/components/news/asksky/news-account-sidebar";
import { marketDtoToContext } from "@/components/news/asksky/market-context";
import { NEWS_HOME_HREF } from "@/components/news/news-home-link";
import { ApiClientError } from "@/lib/api-client";
import {
  fetchDailyAudioBriefing,
  marketSiteToDomain,
  type SkyDailyAudioBriefing,
} from "@/lib/news/fetch-daily-audio-briefing";
import type { SkyMeConversationDetail } from "@/lib/news/fetch-sky-conversations";
import {
  fetchTodayWeather,
  type TodayWeather,
} from "@/lib/news/fetch-today-weather";
import { isValidUsZip } from "@/lib/news/market-routing";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import type { AuthResponse } from "@/lib/services/auth";
import { tokenStorage } from "@/lib/storage/token-storage";
import { useNewsAuthUiStore } from "@/lib/store/news-auth-ui-store";
import { useNewsFavoritesStore } from "@/lib/store/news-favorites-store";
import { useNewsRecentsStore } from "@/lib/store/news-recents-store";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { isEmailVerificationExemptPath } from "@/lib/auth/email-verification";
import { useProfileStore } from "@/lib/store/profile-store";
import type { NewsMarketContext } from "./types";

type NewsAccountUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
};

type NewsMarketNavProps = {
  market: NewsMarketContext;
  onNewChat?: () => void;
  onOpenConversation?: (detail: SkyMeConversationDetail) => void;
  activeConversationId?: number | null;
  onConversationDeleted?: (id: number) => void;
  onAuthSuccess?: (response: AuthResponse) => void;
  /** When false, the parent owns stickiness (Biz OS stacks this with its subnav). */
  sticky?: boolean;
};

export function NewsMarketNav({
  market,
  onNewChat,
  onOpenConversation,
  activeConversationId = null,
  onConversationDeleted,
  onAuthSuccess: onAuthSuccessFromPage,
  sticky = true,
}: NewsMarketNavProps) {
  const pathname = usePathname();
  const setMarket = useNewsZipStore((s) => s.setMarket);
  const setBriefingExtras = useNewsZipStore((s) => s.setBriefingExtras);
  const clearBriefingExtras = useNewsZipStore((s) => s.clearBriefingExtras);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [briefing, setBriefing] = useState<SkyDailyAudioBriefing | null>(null);
  const [weather, setWeather] = useState<TodayWeather | null>(null);
  const [zip, setZip] = useState(market.zipcode);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipEditing, setZipEditing] = useState(false);
  const [authUser, setAuthUser] = useState<NewsAccountUser | null>(null);
  const authOpen = useNewsAuthUiStore((s) => s.authOpen);
  const setAuthOpen = useNewsAuthUiStore((s) => s.setAuthOpen);
  const sidebarOpen = useNewsAuthUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useNewsAuthUiStore((s) => s.setSidebarOpen);
  const profilePhoto = useProfileStore((s) => s.data.photo);
  const profileVerified = useProfileStore((s) => s.data.isVerified);
  const profileName = useProfileStore((s) => s.data.name);

  const authButtonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        "--news-header-h",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      document.documentElement.style.removeProperty("--news-header-h");
    };
  }, []);

  const locationLabel = [market.zipcode, market.cityState]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setZip(market.zipcode);
    setZipError(null);
    setZipEditing(false);
  }, [market.zipcode]);

  useEffect(() => {
    let cancelled = false;
    tokenStorage
      .getUser<NewsAccountUser>()
      .then((user) => {
        if (!cancelled && user) setAuthUser(user);
      })
      .catch(() => {
        /* stay signed out */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authUser) return;
    if (isEmailVerificationExemptPath(pathname)) return;
    void useNewsFavoritesStore.getState().hydrate();
    void useNewsRecentsStore.getState().hydrate(market.marketId);
  }, [authUser, market.marketId, pathname]);

  // Load daily briefing on mount / market change (when enabled)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    audioRef.current = null;
    setPlaying(false);
    setBriefing(null);
    clearBriefingExtras();

    if (!market.dailyAudioBriefingEnabled) {
      setAudioLoading(false);
      return;
    }

    let cancelled = false;
    setAudioLoading(true);

    const domain = marketSiteToDomain(market.site);
    fetchDailyAudioBriefing({
      zipCode: market.zipcode,
      domain,
    })
      .then((next) => {
        if (cancelled) return;
        setBriefing(next);
        setBriefingExtras({
          sponsor: next.sponsor,
          suggestedQuestions: next.suggestedQuestions,
        });

        const el = new Audio(next.audioUrl);
        el.preload = "auto";
        el.addEventListener("ended", () => setPlaying(false));
        el.addEventListener("pause", () => {
          if (el.paused) setPlaying(false);
        });
        el.addEventListener("play", () => setPlaying(true));
        el.addEventListener("error", () => {
          toast.error("Unable to load the Sky briefing audio.");
          setPlaying(false);
        });
        audioRef.current = el;
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(
          err instanceof ApiClientError
            ? err.message
            : "Unable to load the Sky briefing.",
        );
      })
      .finally(() => {
        if (!cancelled) setAudioLoading(false);
      });

    return () => {
      cancelled = true;
      const current = audioRef.current;
      if (current) {
        current.pause();
        audioRef.current = null;
      }
    };
  }, [
    market.zipcode,
    market.site,
    market.marketSlug,
    market.dailyAudioBriefingEnabled,
    setBriefingExtras,
    clearBriefingExtras,
  ]);

  useEffect(() => {
    const zipKey = market.zipcode.trim().slice(0, 5);
    if (!isValidUsZip(zipKey)) {
      setWeather(null);
      return;
    }

    let cancelled = false;

    fetchTodayWeather(zipKey)
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });

    return () => {
      cancelled = true;
    };
  }, [market.zipcode]);

  async function toggleSkyFm() {
    if (audioLoading) return;

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio?.src) {
      toast.error("Sky briefing is not ready yet.");
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      toast.error("Unable to play the Sky briefing.");
      setPlaying(false);
    }
  }

  async function onZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    setZipError(null);

    const cleaned = zip.trim();
    if (!isValidUsZip(cleaned)) {
      setZipError("Enter a valid US ZIP code (e.g. 38103).");
      return;
    }

    if (cleaned.slice(0, 5) === market.zipcode.trim().slice(0, 5)) {
      setZipEditing(false);
      return;
    }

    setZipLoading(true);
    try {
      const primary = await resolveMarketForZip(cleaned);

      if (!primary) {
        toast.error("No market found");
        return;
      }

      setMarket(marketDtoToContext(primary, cleaned));
      setZipEditing(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Something went wrong looking up your market.";
      setZipError(message);
      toast.error(message);
    } finally {
      setZipLoading(false);
    }
  }

  function onAuthSuccess(response: AuthResponse) {
    setAuthUser(response.user);
    onAuthSuccessFromPage?.(response);
  }

  const authLabel = authUser
    ? firstNonEmpty(
        profileName,
        authUser.firstName,
        authUser.email?.split("@")[0],
        "Account",
      )
    : null;

  const sponsorName = firstNonEmpty(
    briefing?.sponsor?.companyName,
    briefing?.sponsor?.name,
  );
  
  const sponsorLink = firstNonEmpty(
    briefing?.sponsor?.targetUrl,
    briefing?.sponsor?.targetLink,
  );

  return (
    <>
      <header
        ref={headerRef}
        className={
          sticky
            ? "sticky top-0 z-40 border-b border-slate-200/80 bg-[#f3f4f6]/90 backdrop-blur-xl"
            : "border-b border-slate-200/80 bg-[#f3f4f6]/90 backdrop-blur-xl"
        }
      >
      <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              href={NEWS_HOME_HREF}
              className="flex shrink-0 items-center gap-2"
              aria-label="JustMy News home"
            >
              <Image
                src="/images/logo.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-contain shadow-sm shadow-violet-500/20"
                priority
              />
              <span className="hidden text-[15px] font-bold tracking-tight text-slate-900 lg:inline">
                JustMy
              </span>
            </Link>

            {zipEditing ? (
              <form
                onSubmit={onZipSubmit}
                className="relative min-w-0 shrink lg:shrink-0"
              >
                <label htmlFor="news-market-zip" className="sr-only">
                  Zip code
                </label>
                <input
                  id="news-market-zip"
                  name="zipcode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  autoFocus
                  placeholder="ZIP"
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value.replace(/[^\d-]/g, ""));
                    if (zipError) setZipError(null);
                  }}
                  onBlur={() => {
                    if (!zipLoading) setZipEditing(false);
                  }}
                  maxLength={10}
                  disabled={zipLoading}
                  title={zipError ?? "Change zip code"}
                  aria-invalid={Boolean(zipError)}
                  aria-describedby={
                    zipError ? "news-market-zip-error" : undefined
                  }
                  className={`h-9 w-[6.5rem] rounded-full border bg-white px-3 text-xs font-semibold tracking-wide text-slate-800 outline-none transition focus:ring-2 disabled:opacity-60 lg:w-44 ${
                    zipError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200/60"
                      : "border-slate-200 focus:border-violet-300 focus:ring-violet-200/60"
                  }`}
                />
                {zipLoading ? (
                  <Loader2
                    className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-violet-500"
                    aria-hidden
                  />
                ) : null}
                {zipError ? (
                  <p
                    id="news-market-zip-error"
                    role="alert"
                    className="sr-only"
                  >
                    {zipError}
                  </p>
                ) : null}
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setZipEditing(true)}
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:gap-1.5 lg:px-3"
                title="Change zip code"
                aria-label={`Market location ${locationLabel}. Click to change zip code.`}
              >
                <span className="lg:hidden">{market.zipcode}</span>
                <span className="hidden lg:inline">{locationLabel}</span>
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 text-slate-500"
                  aria-hidden
                />
              </button>
            )}

            {market.dailyAudioBriefingEnabled ? (
              <div className="hidden min-w-0 flex-1 lg:block">
                <SkyFmBriefing
                  playing={playing}
                  loading={audioLoading}
                  ready={Boolean(briefing?.audioUrl)}
                  sponsorName={sponsorName}
                  sponsorLink={sponsorLink}
                  onToggle={toggleSkyFm}
                />
              </div>
            ) : null}

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <TodayWeatherPill weather={weather} />

              {authUser ? (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:w-auto lg:gap-1.5 lg:px-2.5"
                  aria-label={`Account menu for ${authLabel}`}
                >
                  <NewsAccountAvatar
                    photoUrl={profilePhoto || authUser.avatarUrl}
                    label={authLabel ?? "Account"}
                  />
                  <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-800 lg:inline">
                    {authLabel}
                  </span>
                </button>
              ) : (
                <button
                  ref={authButtonRef}
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-md shadow-violet-500/20 transition hover:brightness-110 lg:w-auto lg:gap-1.5 lg:px-3"
                  aria-label="Login or register"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden text-xs font-semibold lg:inline">
                    Login / Register
                  </span>
                </button>
              )}
            </div>
          </div>

          {market.dailyAudioBriefingEnabled ? (
            <div className="lg:hidden">
              <SkyFmBriefing
                playing={playing}
                loading={audioLoading}
                ready={Boolean(briefing?.audioUrl)}
                sponsorName={sponsorName}
                sponsorLink={sponsorLink}
                onToggle={toggleSkyFm}
                fullWidth
              />
            </div>
          ) : null}
        </div>
      </div>
      </header>
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultMode="register"
        defaultZip={market.zipcode}
        profileKind="personal"
        onAuthSuccess={onAuthSuccess}
        anchorRef={authButtonRef}
      />
      {authUser ? (
        <NewsAccountSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          market={market}
          user={authUser}
          photoUrl={profilePhoto || authUser.avatarUrl}
          isVerified={Boolean(profileVerified)}
          onNewChat={() => onNewChat?.()}
          onOpenConversation={(detail) => onOpenConversation?.(detail)}
          activeConversationId={activeConversationId}
          onConversationDeleted={(id) => onConversationDeleted?.(id)}
          onSignedOut={() => setAuthUser(null)}
        />
      ) : null}
    </>
  );
}

function SkyFmBriefing({
  playing,
  loading,
  ready,
  sponsorName,
  sponsorLink,
  onToggle,
  fullWidth = false,
}: {
  playing: boolean;
  loading: boolean;
  ready: boolean;
  sponsorName: string | null;
  sponsorLink: string | null;
  onToggle: () => void;
  fullWidth?: boolean;
}) {
  const canPlay = ready && !loading;

  return (
    <div
      className={
        fullWidth
          ? "flex w-full items-center"
          : "flex min-w-0 flex-1 items-center justify-center"
      }
    >
      <div
        className={`inline-flex min-h-11 min-w-0 items-center gap-3 rounded-full border border-slate-200/90 bg-white py-1.5 pl-1.5 pr-4 shadow-sm ${
          fullWidth ? "w-full" : "max-w-full"
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={!canPlay && !playing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-500/35 transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-70"
          aria-label={
            loading
              ? "Loading Sky briefing"
              : playing
                ? "Pause today's 60-second Sky briefing"
                : "Play today's 60-second Sky briefing"
          }
          aria-pressed={playing}
          aria-busy={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : playing ? (
            <Pause className="h-3.5 w-3.5" fill="currentColor" />
          ) : (
            <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" />
          )}
        </button>

        <AudioSpectrum playing={playing && !loading} />

        <div className="min-w-0 flex-1 text-left">
          {loading ? (
            <p className="truncate text-sm font-semibold text-slate-900">
              Loading briefing…
            </p>
          ) : (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-slate-900">
                Today&apos;s 60-Second Sky Briefing
              </p>
              {sponsorName ? (
                <p className="mt-0.5 truncate text-xs leading-tight text-slate-500 sm:text-[12px]">
                  Presented by:{" "}
                  {sponsorLink ? (
                    <a
                      href={sponsorLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-violet-600 transition hover:text-violet-500 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sponsorName}
                    </a>
                  ) : (
                    <span className="font-semibold text-violet-600">
                      {sponsorName}
                    </span>
                  )}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Equalizer bars — animate while Sky FM is playing. */
function AudioSpectrum({ playing }: { playing: boolean }) {
  const bars = [
    { h: 6, delay: "0ms", duration: "720ms" },
    { h: 12, delay: "80ms", duration: "640ms" },
    { h: 8, delay: "160ms", duration: "780ms" },
    { h: 14, delay: "40ms", duration: "560ms" },
    { h: 9, delay: "120ms", duration: "700ms" },
    { h: 11, delay: "200ms", duration: "620ms" },
    { h: 7, delay: "100ms", duration: "760ms" },
  ];

  return (
    <>
      <style>{`
        @keyframes sky-fm-spectrum {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        .sky-fm-bar-active {
          animation-name: sky-fm-spectrum;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sky-fm-bar-active {
            animation: none;
            transform: scaleY(0.7);
          }
        }
      `}</style>
      <div
        className="flex h-4 w-[18px] shrink-0 items-end justify-between"
        aria-hidden
      >
        {bars.map((bar, i) => (
          <span
            key={i}
            className={`w-[2px] origin-bottom rounded-full bg-violet-400 ${
              playing ? "sky-fm-bar-active" : ""
            }`}
            style={{
              height: bar.h,
              animationDelay: playing ? bar.delay : undefined,
              animationDuration: playing ? bar.duration : undefined,
              opacity: playing ? 1 : 0.55,
              transform: playing ? undefined : "scaleY(0.55)",
            }}
          />
        ))}
      </div>
    </>
  );
}

function TodayWeatherPill({ weather }: { weather: TodayWeather | null }) {
  const tempLabel = weather ? `${Math.round(weather.tempF)}°F` : "—°F";
  const condition = weather?.condition?.trim() || null;
  const highHint =
    weather != null
      ? `High ${Math.round(weather.forecastHigh)}°`
      : undefined;

  return (
    <div
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm lg:px-3"
      title={highHint}
      aria-label={
        weather
          ? `Current weather ${Math.round(weather.tempF)} degrees Fahrenheit, ${weather.condition}. Today's high ${Math.round(weather.forecastHigh)} degrees.`
          : "Weather unavailable"
      }
    >
      <CloudSun className="h-4 w-4 shrink-0 text-cyan-500" aria-hidden />
      <span>
        {tempLabel}
        {condition ? (
          <span className="hidden lg:inline">{` ${condition}`}</span>
        ) : null}
      </span>
    </div>
  );
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
