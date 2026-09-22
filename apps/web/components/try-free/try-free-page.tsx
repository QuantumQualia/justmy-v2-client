"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  CategoryPills,
  SkyBubble,
  SkyTyping,
  TryFreeHero,
  TryFreeInputBar,
  UserBubble,
  tryFreeCategoryLabel,
} from "@/components/try-free/greeting-shell";
import { AskSkyTypedText } from "@workspace/ui/components/asksky-typed-text";
import { TryFreeSignupTrigger } from "@/components/try-free/signup-trigger";
import {
  fallbackMarketFromZip,
} from "@/components/news/asksky/market-context";
import { NewsMarketNav } from "@/components/news/asksky/news-market-nav";
import type { NewsMarketContext } from "@/components/news/asksky/types";
import { fetchLocalProof, fetchOrgProof, fetchTryFreeChat } from "@/lib/try-free/api";
import { isValidUsZip } from "@/lib/news/market-routing";
import { useNewsHost } from "@/lib/news/news-host-context";
import { resolveMarketForZip } from "@/lib/news/resolve-market-zip";
import { isBusinessOs } from "@/lib/os-types";
import { tokenStorage } from "@/lib/storage/token-storage";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { useTryFreeStore } from "@/lib/store/try-free-store";
import type {
  ResolvedTryFreePlace,
  TryFreeCategory,
  TryFreeChatLocation,
  TryFreeTurn,
} from "@/lib/try-free/types";
import { TRY_FREE_CATEGORIES } from "@/lib/try-free/types";

const GREETING =
  "Hey, I'm Sky — ask me anything. Toss in your city or ZIP when you want it local, and I'll keep you posted nearby, answer what's on your mind, and toss you a freebie from local spots now and then.";

function greetingForPlace(displayName: string) {
  return `Hey, I'm Sky — ask me anything. I've got ${displayName} on the map. I'll keep you posted nearby, answer what's on your mind, and toss you a freebie from local spots now and then.`;
}

function placeFromNews(
  market: NewsMarketContext | null,
  zipcode: string | null,
): TryFreeChatLocation | null {
  const zip = (market?.zipcode || zipcode || "").trim().slice(0, 5);
  if (!isValidUsZip(zip)) return null;
  const city = market?.city?.trim() || null;
  const state = market?.state?.trim() || null;
  const displayName =
    market?.cityState?.trim() ||
    [city, state].filter(Boolean).join(", ") ||
    zip;
  return { zip, city, state, displayName };
}

function newTurn(role: TryFreeTurn["role"], text: string): TryFreeTurn {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text };
}

export function TryFreePageClient() {
  const router = useRouter();
  const category = useTryFreeStore((s) => s.category);
  const tier = useTryFreeStore((s) => s.tier);
  const location = useTryFreeStore((s) => s.location);
  const orgName = useTryFreeStore((s) => s.orgName);
  const orgWebsite = useTryFreeStore((s) => s.orgWebsite);
  const orgProof = useTryFreeStore((s) => s.orgProof);
  const setCategory = useTryFreeStore((s) => s.setCategory);
  const setTier = useTryFreeStore((s) => s.setTier);
  const setLocation = useTryFreeStore((s) => s.setLocation);
  const setOrg = useTryFreeStore((s) => s.setOrg);
  const newsZip = useNewsZipStore((s) => s.zipcode);
  const newsMarket = useNewsZipStore((s) => s.market);
  const newsHydrated = useNewsZipStore((s) => s.hasHydrated);
  const suggestedQuestions = useNewsZipStore((s) => s.suggestedQuestions);
  const searchParams = useSearchParams();
  const newsHost = useNewsHost();
  const navMarket = newsMarket || fallbackMarketFromZip(newsZip || "");

  const [guestReady, setGuestReady] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [offerSignup, setOfferSignup] = useState(false);
  const [turns, setTurns] = useState<TryFreeTurn[]>([
    { id: "sky-greeting", role: "sky", text: GREETING },
  ]);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const placeFromChat = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void tokenStorage
      .getUser<{ osName?: string; profileType?: string }>()
      .then((user) => {
        if (cancelled) return;
        if (user) {
          router.replace(isBusinessOs(user.osName || user.profileType) ? "/biz-os" : "/personal-os");
          return;
        }
        setGuestReady(true);
      })
      .catch(() => {
        if (!cancelled) setGuestReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const raw = (searchParams.get("for") || "").trim().toLowerCase();
    const next = TRY_FREE_CATEGORIES.find((item) => item === raw);
    if (next) setCategory(next);
  }, [searchParams, setCategory]);

  const placeholder =
    category === "business"
      ? orgName
        ? "Ask Sky anything…"
        : "Tell Sky about the business…"
      : category === "nonprofit"
        ? orgName
          ? "Ask Sky anything…"
          : "Tell Sky about the organization…"
        : category === "personal" || location
          ? "Ask Sky anything…"
          : "Ask Sky anything — city or ZIP optional";

  function scrollThread(smooth = false) {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  useEffect(() => {
    scrollThread(true);
  }, [turns.length, busy]);

  useEffect(() => {
    const mark = () => useNewsZipStore.getState().setHasHydrated(true);
    if (useNewsZipStore.persist.hasHydrated()) {
      mark();
      return;
    }
    return useNewsZipStore.persist.onFinishHydration(mark);
  }, []);

  useEffect(() => {
    if (signupOpen) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [busy, signupOpen, turns.length]);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    window.scrollTo(0, 0);
    html.scrollTop = 0;
    body.scrollTop = 0;

    const apply = () => {
      window.scrollTo(0, 0);
      const main = document.getElementById("site-main");
      const chromeEl = document.querySelector("[data-site-chrome]");
      let offset = Math.max(0, Math.round(main?.getBoundingClientRect().top ?? 0));
      if (chromeEl && main?.contains(chromeEl)) {
        offset = Math.round(chromeEl.getBoundingClientRect().height);
      }
      html.style.setProperty("--try-free-chrome", `${offset}px`);
    };

    apply();
    html.classList.add("overflow-hidden");
    body.classList.add("overflow-hidden");
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      html.classList.remove("overflow-hidden");
      body.classList.remove("overflow-hidden");
      html.style.removeProperty("--try-free-chrome");
    };
  }, [guestReady, newsHost]);

  useEffect(() => {
    if (!newsHydrated || placeFromChat.current) return;
    const fromNews = placeFromNews(newsMarket, newsZip);
    if (!fromNews) return;
    const existing = useTryFreeStore.getState().location;
    if (existing?.zip === fromNews.zip) {
      setTurns((prev) => {
        if (prev.length !== 1 || prev[0]?.id !== "sky-greeting") return prev;
        return [{ ...prev[0], text: greetingForPlace(existing.displayName || fromNews.displayName) }];
      });
      return;
    }
    let cancelled = false;
    void rememberPlace(fromNews, "news").then((place) => {
      if (cancelled) return;
      setTurns((prev) => {
        if (prev.length !== 1 || prev[0]?.id !== "sky-greeting") return prev;
        return [{ ...prev[0], text: greetingForPlace(place.displayName) }];
      });
    });
    return () => {
      cancelled = true;
    };
  }, [newsHydrated, newsMarket?.zipcode, newsMarket?.city, newsMarket?.state, newsZip]);

  function pushSky(text: string) {
    setTurns((prev) => [...prev, newTurn("sky", text)]);
  }

  async function rememberPlace(
    loc: TryFreeChatLocation,
    source: "news" | "chat" = "chat",
  ): Promise<ResolvedTryFreePlace> {
    let next: ResolvedTryFreePlace = {
      query: loc.displayName,
      zip: loc.zip,
      city: loc.city,
      state: loc.state,
      displayName: loc.displayName,
      tier: "unseeded",
    };
    try {
      const market = await resolveMarketForZip(loc.zip);
      if (market) {
        next = {
          ...next,
          tier: "seeded",
          city: loc.city || market.city?.trim() || null,
          state: loc.state || market.state?.trim() || null,
          displayName:
            [loc.city || market.city || market.name, loc.state || market.state]
              .filter(Boolean)
              .join(", ") || loc.displayName,
        };
      }
    } catch {
      /* unseeded is fine */
    }
    if (source === "chat") placeFromChat.current = true;
    setLocation(next);
    if (category === "personal") setTier(next.tier);
    return next;
  }

  function offerPersonalSignup() {
    setOfferSignup(true);
  }

  async function runPersonalProof(place: ResolvedTryFreePlace) {
    setCategory("personal");
    setTier(place.tier);
    const proof = await fetchLocalProof({
      zip: place.zip,
      city: place.city,
      state: place.state,
      tier: place.tier,
    });
    pushSky(proof.reply);
    offerPersonalSignup();
    setSignupOpen(true);
  }

  async function runOrgProof(message: string) {
    if (category !== "business" && category !== "nonprofit") return;
    const proof = await fetchOrgProof({
      name: message,
      zip: location?.zip,
      city: location?.city,
      category,
    });
    pushSky(proof.reply);
    const businessName = proof.businessName?.trim();
    if (!businessName) return;
    setOrg({
      name: businessName,
      website: proof.website || "",
      proof,
    });
    setOfferSignup(true);
    setSignupOpen(true);
  }

  async function runChat(message: string, place = location) {
    const thread = turns
      .slice(-8)
      .map((t) => `${t.role === "user" ? "Visitor" : "Sky"}: ${t.text}`)
      .join("\n");
    const chat = await fetchTryFreeChat({
      message,
      zip: place?.zip,
      city: place?.city,
      state: place?.state,
      category,
      thread,
    });
    let nextPlace: ResolvedTryFreePlace | null = place
      ? { ...place, tier: tier || "unseeded" }
      : null;
    if (chat.location?.zip) {
      nextPlace = await rememberPlace(chat.location, "chat");
    }
    if (nextPlace && chat.placeOnly && category === "personal") {
      await runPersonalProof(nextPlace);
      return nextPlace;
    }
    pushSky(chat.reply);
    if (nextPlace && category === "personal") offerPersonalSignup();
    return nextPlace;
  }

  async function onSubmit() {
    const value = input.trim();
    if (!value || busy) return;
    setInput("");
    setTurns((prev) => [...prev, newTurn("user", value)]);
    inputRef.current?.focus();
    setBusy(true);
    try {
      if (category === "business" || category === "nonprofit") {
        const looksLikeQuestion =
          /[?]/.test(value) || /\b(what|how|where|why|can you|help)\b/i.test(value);
        if (!orgName && !looksLikeQuestion) {
          await runOrgProof(value);
          return;
        }
        await runChat(value);
        return;
      }

      await runChat(value);
    } catch {
      pushSky("I couldn't get that just now. Ask me another way — or drop a city / ZIP if you want it local.");
    } finally {
      setBusy(false);
      if (!signupOpen) inputRef.current?.focus();
    }
  }

  async function onPill(next: TryFreeCategory) {
    if (busy) return;
    setCategory(next);
    setTurns((prev) => [...prev, newTurn("user", tryFreeCategoryLabel(next))]);
    if (next === "personal") {
      if (location?.zip) {
        setBusy(true);
        try {
          await runPersonalProof({
            ...location,
            tier: tier || "unseeded",
          });
        } catch {
          pushSky(`Got ${location.displayName}. What do you want to know?`);
        } finally {
          setBusy(false);
        }
        return;
      }
      pushSky("Cool — looking around. What do you want to know? A city or ZIP makes it local.");
      return;
    }
    setTier(null);
    pushSky(
      next === "nonprofit"
        ? "Got it. Tell me about the organization — I'll look up what's public."
        : "Got it. Tell me about the business — I'll look up what's public.",
    );
  }

  const pageNav =
    newsHost ? null : (
      <NewsMarketNav
        market={navMarket}
        onNewChat={() => router.push("/news")}
      />
    );

  if (!guestReady) {
    return (
      <>
        {pageNav}
        <div className="min-h-dvh bg-white" />
      </>
    );
  }

  return (
    <>
      {pageNav}
      <div className="try-free-page flex h-[calc(100dvh-var(--try-free-chrome,0px))] max-h-[calc(100dvh-var(--try-free-chrome,0px))] flex-col items-center overflow-hidden bg-white px-4 py-6 sm:px-6">
      <style>{`
        .try-free-rotator-line {
          animation: tryFreeRotateIn 0.35s ease-out;
        }
        @keyframes tryFreeRotateIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .try-free-rotator-line { animation: none; }
        }
      `}</style>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden">
        <div
          className="flex min-h-0 w-full max-w-[46rem] max-h-full flex-col overflow-hidden bg-white"
          data-asksky-theme="light"
        >
          <TryFreeHero
            city={newsHydrated ? location?.city || newsMarket?.city : null}
            questions={newsHydrated ? suggestedQuestions : []}
          />
          <div
            ref={threadRef}
            className="flex w-full min-h-[min(16rem,28dvh)] max-h-[min(42dvh,24rem)] flex-col gap-4 overflow-y-auto py-3 pr-1 [scrollbar-width:thin]"
          >
            {turns.map((turn) =>
              turn.role === "user" ? (
                <UserBubble key={turn.id}>{turn.text}</UserBubble>
              ) : (
                <SkyBubble key={turn.id}>
                  <AskSkyTypedText text={turn.text} onTick={scrollThread} />
                </SkyBubble>
              ),
            )}
            {busy ? <SkyTyping /> : null}
          </div>
          <div className="mt-4 flex w-full shrink-0 flex-col items-center gap-3">
            <TryFreeInputBar
              value={input}
              onChange={setInput}
              onSubmit={() => void onSubmit()}
              placeholder={placeholder}
              disabled={busy}
              inputRef={inputRef}
              autoFocus
            />
            {!category ? <CategoryPills onSelect={(id) => void onPill(id)} disabled={busy} /> : null}
            {offerSignup && category ? (
              <button
                type="button"
                onClick={() => setSignupOpen(true)}
                className="rounded-full bg-[linear-gradient(135deg,#7c6cf6,#5fa8ef)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(124,108,246,0.18)]"
              >
                Continue with Sky
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {category ? (
        <TryFreeSignupTrigger
          open={signupOpen}
          onOpenChange={setSignupOpen}
          category={category}
          zip={location?.zip}
          businessName={orgProof?.businessName || orgName}
          website={orgWebsite}
        />
      ) : null}
      {tier ? <span className="sr-only">Personal tier {tier}</span> : null}
    </div>
    </>
  );
}
