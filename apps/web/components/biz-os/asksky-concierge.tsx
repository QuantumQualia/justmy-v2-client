"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { bizOsService } from "@/lib/services/biz-os";
import { profilesService } from "@/lib/services/profiles";
import { useProfileStore, type ProfileData, type SocialType } from "@/lib/store";
import { useBizOsProfile, useInvalidateBizOsHome } from "./use-biz-os-profile";

const SUPPORT_RE = /support|help|fun\s*crew|team|stuck|upgrade|command\s*os|human/i;
const MAX_HOTLINKS = 3;

/** Survives React Strict Mode remounts so the opening hello is sent once. */
const helloStarted = new Set<string>();

type Turn = { role: "user" | "asksky"; text: string };
type HotlinkDraft = { label: string; url: string };
type PhoneDraft = { number: string; type?: string };
type AddressDraft = { title?: string; address: string };
type SocialDraft = { name: string; url: string };
type CardDrafts = {
  about?: string | null;
  tagline?: string | null;
  website?: string | null;
  email?: string | null;
  calendarLink?: string | null;
  hotlinks?: HotlinkDraft[];
  phones?: PhoneDraft[];
  addresses?: AddressDraft[];
  socials?: SocialDraft[];
};

const SOCIAL_TYPES = new Set<SocialType>([
  "facebook",
  "instagram",
  "x",
  "linkedin",
  "youtube",
  "vimeo",
  "yelp",
  "behance",
  "deviantart",
  "digg",
  "dribbble",
  "discord",
  "etsy",
  "fiverr",
  "flickr",
  "github",
  "imdb",
  "lastfm",
  "mix",
  "myspace",
  "paypal",
  "pinterest",
  "quora",
  "reddit",
  "snapchat",
  "soundcloud",
  "tiktok",
  "threads",
  "tumblr",
  "twitch",
  "vk",
  "whatsapp",
  "xing",
]);

function toSocialType(name: string): SocialType | null {
  const lower = name.toLowerCase();
  if (lower === "twitter") return "x";
  return SOCIAL_TYPES.has(lower as SocialType) ? (lower as SocialType) : null;
}

function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function sameCopy(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const left = norm(a);
  const right = norm(b);
  return Boolean(left && right && left === right);
}

function firstWebsiteUrl(text: string): string | null {
  const raw = text.trim();
  if (!raw) return null;
  const http = raw.match(/https?:\/\/[^\s<>"']+/i);
  if (http) return http[0].replace(/[),.;]+$/, "");
  const domain = raw.match(/\b(?:www\.)?[a-z0-9][a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i);
  if (!domain) return null;
  const host = domain[0].replace(/^https?:\/\//i, "");
  return `https://${host}`;
}

function hasCardDrafts(d: CardDrafts): boolean {
  return Boolean(
    d.about ||
      d.tagline ||
      d.website ||
      d.email ||
      d.calendarLink ||
      (d.hotlinks && d.hotlinks.length) ||
      (d.phones && d.phones.length) ||
      (d.addresses && d.addresses.length) ||
      (d.socials && d.socials.length),
  );
}

export function AskSkyConcierge({
  stage = "card",
  onStage,
  compact = false,
  fillViewport = false,
}: {
  stage?: string;
  onStage?: (stage: string) => void;
  compact?: boolean;
  fillViewport?: boolean;
}) {
  const router = useRouter();
  const { profileId } = useBizOsProfile();
  const invalidateHome = useInvalidateBizOsHome();
  const setData = useProfileStore((s) => s.setData);
  const website = useProfileStore((s) => s.data.website);
  const hasWebsite = Boolean(website?.trim());
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ summary: string; planId?: number } | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [cardDrafts, setCardDrafts] = useState<CardDrafts>({});
  const [awaitingWebsite, setAwaitingWebsite] = useState(false);
  const [applying, setApplying] = useState(false);
  const applyingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!profileId) return;
    const key = `${profileId}:${compact ? "dock" : "onboard"}`;
    if (helloStarted.has(key)) return;
    helloStarted.add(key);
    void send("hello", stage, true);
    return () => {
      window.setTimeout(() => helloStarted.delete(key), 250);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, compact]);

  async function send(message: string, nextStage = stage, silent = false) {
    if (!profileId || !message.trim()) return;
    if (!silent) {
      setTurns((t) => [...t, { role: "user", text: message }]);
    }
    setLoading(true);
    try {
      if (!silent && SUPPORT_RE.test(message)) {
        setDraft({ summary: message });
        setDraftOpen(true);
      }
      const res = await bizOsService.onboardingMessage(profileId, nextStage, message);
      setTurns((t) => {
        if (silent && t.some((turn) => turn.role === "asksky" && turn.text === res.reply)) {
          return t;
        }
        return [...t, { role: "asksky", text: res.reply }];
      });
      for (const action of res.actions || []) {
        if (action.type === "draft_about" && typeof action.about === "string") {
          const saved = useProfileStore.getState().data.about;
          if (!sameCopy(action.about, saved)) {
            setCardDrafts((d) => ({ ...d, about: action.about as string }));
          }
        }
        if (action.type === "draft_tagline" && typeof action.tagline === "string") {
          const saved = useProfileStore.getState().data.tagline;
          if (!sameCopy(action.tagline, saved)) {
            setCardDrafts((d) => ({ ...d, tagline: action.tagline as string }));
          }
        }
        if (action.type === "draft_website" && typeof action.website === "string") {
          const saved = useProfileStore.getState().data.website;
          if (!sameCopy(action.website, saved)) {
            setCardDrafts((d) => ({ ...d, website: action.website as string }));
          }
        }
        if (action.type === "draft_hotlinks" && Array.isArray(action.hotlinks)) {
          const existing = useProfileStore.getState().data.hotlinks;
          const slots = Math.max(0, MAX_HOTLINKS - existing.length);
          const hotlinks = (action.hotlinks as HotlinkDraft[])
            .filter((h) => h?.label && h?.url && !existing.some((saved) => saved.url === h.url))
            .slice(0, slots);
          if (hotlinks.length) setCardDrafts((d) => ({ ...d, hotlinks }));
        }
        if (action.type === "draft_email" && typeof action.email === "string") {
          const saved = useProfileStore.getState().data.email;
          if (!sameCopy(action.email, saved)) {
            setCardDrafts((d) => ({ ...d, email: action.email as string }));
          }
        }
        if (action.type === "draft_calendar" && typeof action.calendarLink === "string") {
          const saved = useProfileStore.getState().data.calendarLink;
          if (!sameCopy(action.calendarLink, saved)) {
            setCardDrafts((d) => ({ ...d, calendarLink: action.calendarLink as string }));
          }
        }
        if (action.type === "draft_phones" && Array.isArray(action.phones)) {
          const existing = useProfileStore.getState().data.phones || [];
          const phones = (action.phones as PhoneDraft[])
            .filter(
              (p) => p?.number && !existing.some((saved) => phoneDigits(saved.number) === phoneDigits(p.number)),
            )
            .slice(0, 4);
          if (phones.length) setCardDrafts((d) => ({ ...d, phones }));
        }
        if (action.type === "draft_addresses" && Array.isArray(action.addresses)) {
          const existing = useProfileStore.getState().data.addresses || [];
          const addresses = (action.addresses as AddressDraft[])
            .filter(
              (a) => a?.address && !existing.some((saved) => sameCopy(saved.address, a.address)),
            )
            .slice(0, 3);
          if (addresses.length) setCardDrafts((d) => ({ ...d, addresses }));
        }
        if (action.type === "draft_socials" && Array.isArray(action.socials)) {
          const existing = useProfileStore.getState().data.socialLinks;
          const socials = (action.socials as SocialDraft[])
            .filter((s) => s?.name && s?.url && toSocialType(s.name))
            .filter(
              (s) =>
                !existing.some(
                  (saved) => saved.type === toSocialType(s.name) || sameCopy(saved.url, s.url),
                ),
            )
            .slice(0, 8);
          if (socials.length) setCardDrafts((d) => ({ ...d, socials }));
        }
        if (action.type === "open_skyscan") {
          onStage?.("skyscan");
        }
        if (action.type === "open_battle_plan") {
          onStage?.("battle_plan");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function applyCardDrafts() {
    if (!profileId || !hasCardDrafts(cardDrafts) || applyingRef.current) return;
    applyingRef.current = true;
    setApplying(true);
    try {
      const current = useProfileStore.getState().data;
      const storePatch: Partial<ProfileData> = {};
      const patch: {
        about?: string;
        tagline?: string;
        website?: string;
        email?: string;
        calendarLink?: string;
        hotlinks?: { label: string; link: string }[];
        phones?: { type: string; number: string }[];
        locations?: { title: string; address?: string }[];
        socialLinks?: { name: string; link: string }[];
      } = {};
      if (cardDrafts.about) {
        patch.about = cardDrafts.about;
        storePatch.about = cardDrafts.about;
      }
      if (cardDrafts.tagline) {
        patch.tagline = cardDrafts.tagline;
        storePatch.tagline = cardDrafts.tagline;
      }
      if (cardDrafts.website) {
        patch.website = cardDrafts.website;
        storePatch.website = cardDrafts.website;
      }
      if (cardDrafts.email) {
        patch.email = cardDrafts.email;
        storePatch.email = cardDrafts.email;
      }
      if (cardDrafts.calendarLink) {
        patch.calendarLink = cardDrafts.calendarLink;
        storePatch.calendarLink = cardDrafts.calendarLink;
      }
      if (cardDrafts.hotlinks?.length) {
        const merged = [...current.hotlinks];
        for (const link of cardDrafts.hotlinks) {
          if (merged.length >= MAX_HOTLINKS) break;
          if (merged.some((h) => h.url === link.url)) continue;
          merged.push({
            id: crypto.randomUUID(),
            title: link.label,
            url: link.url,
          });
        }
        const capped = merged.slice(0, MAX_HOTLINKS);
        storePatch.hotlinks = capped;
        patch.hotlinks = capped
          .filter((h) => h.url?.trim())
          .map((h) => ({ label: h.title, link: h.url }));
      }
      if (cardDrafts.phones?.length) {
        const merged = [...(current.phones || [])];
        for (const phone of cardDrafts.phones) {
          if (merged.some((saved) => phoneDigits(saved.number) === phoneDigits(phone.number))) continue;
          merged.push({
            id: crypto.randomUUID(),
            number: phone.number,
            type: phone.type || "main",
          });
        }
        storePatch.phones = merged;
        patch.phones = merged.map((phone) => ({
          type: phone.type || "main",
          number: phone.number,
        }));
      }
      if (cardDrafts.addresses?.length) {
        const merged = [...(current.addresses || [])];
        for (const address of cardDrafts.addresses) {
          if (merged.some((saved) => sameCopy(saved.address, address.address))) continue;
          merged.push({
            id: crypto.randomUUID(),
            title: address.title || "Office",
            address: address.address,
          });
        }
        storePatch.addresses = merged;
        patch.locations = merged
          .filter((addr) => addr.address?.trim())
          .map((addr) => ({ title: addr.title || "Office", address: addr.address }));
      }
      if (cardDrafts.socials?.length) {
        const merged = [...current.socialLinks];
        for (const social of cardDrafts.socials) {
          const type = toSocialType(social.name);
          if (!type || !social.url?.trim()) continue;
          if (merged.some((saved) => saved.type === type || sameCopy(saved.url, social.url))) continue;
          merged.push({
            id: crypto.randomUUID(),
            type,
            url: social.url,
            label: social.name,
          });
        }
        storePatch.socialLinks = merged;
        patch.socialLinks = merged
          .filter((link) => link.url?.trim())
          .map((link) => ({ name: link.type, link: link.url }));
      }
      await profilesService.updateProfile(profileId, patch);
      setData(storePatch);
      setCardDrafts({});
      setTurns((t) => [...t, { role: "asksky", text: "Applied those drafts to your myCARD." }]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "asksky", text: "I couldn’t apply those drafts. Try Apply to myCARD again." },
      ]);
    } finally {
      applyingRef.current = false;
      setApplying(false);
    }
  }

  async function submitDraft() {
    if (!profileId || !draft) return;
    setLoading(true);
    try {
      let planId = draft.planId;
      if (!planId) {
        const flagged = await bizOsService.funCrew(profileId);
        planId = flagged.planId;
        setDraft({ ...draft, planId, summary: flagged.supportDraft?.summary || draft.summary });
        await invalidateHome();
      } else {
        await bizOsService.requestSupport(profileId, planId, draft.summary);
      }
      setDraftOpen(false);
      setTurns((t) => [
        ...t,
        {
          role: "asksky",
          text: "Flagged for the FunCrew. They’ll pick this up on your Battle Plan — no extra ticket queue.",
        },
      ]);
      if (planId) router.push(`/biz-os/battle-plans/${planId}`);
    } finally {
      setLoading(false);
    }
  }

  function submitMessage(raw: string, nextStage = stage) {
    const typed = raw.trim();
    if (!typed) return;
    const url = firstWebsiteUrl(typed);
    const message =
      awaitingWebsite && url ? `Scan ${url} and draft myCARD from the homepage` : typed;
    setAwaitingWebsite(false);
    setInput("");
    void send(message, nextStage);
  }

  function scanWebsite() {
    const fromInput = firstWebsiteUrl(input);
    const fromCard = website?.trim() || "";
    const url = fromInput || fromCard;
    if (url) {
      setAwaitingWebsite(false);
      setInput("");
      void send(`Scan ${url} and draft myCARD from the homepage`);
      return;
    }
    setAwaitingWebsite(true);
    setTurns((t) => {
      const prompt = "Paste your website URL below and I’ll scan it.";
      if (t.some((turn) => turn.role === "asksky" && turn.text === prompt)) return t;
      return [...t, { role: "asksky", text: prompt }];
    });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  const pending = hasCardDrafts(cardDrafts);
  const tipClass =
    "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-800";
  const tipPrimaryClass =
    "rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 transition hover:border-violet-400 hover:bg-violet-100";

  return (
    <div
      className={cn(
        compact
          ? "flex h-full flex-col"
          : "flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)]",
        !compact &&
          (fillViewport
            ? "h-full min-h-0"
            : "h-[min(70vh,36rem)]"),
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-violet-50 bg-linear-to-r from-violet-50/80 to-cyan-50/40 px-4 py-3">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-semibold">AskSKY! Concierge</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 text-sm">
        {turns.map((turn, i) => (
          <div
            key={`${turn.role}-${i}`}
            className={
              turn.role === "user"
                ? "ml-8 rounded-2xl bg-violet-600 px-3 py-2 text-white"
                : "mr-4 rounded-2xl bg-slate-50 px-3 py-2 text-slate-800 whitespace-pre-wrap"
            }
          >
            {turn.text}
          </div>
        ))}
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" /> thinking…
          </p>
        ) : null}
        {pending ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Drafts — not on myCARD yet</p>
            {cardDrafts.website ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">Website:</span> {cardDrafts.website}
              </p>
            ) : null}
            {cardDrafts.email ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">Email:</span> {cardDrafts.email}
              </p>
            ) : null}
            {cardDrafts.calendarLink ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">Calendar:</span> {cardDrafts.calendarLink}
              </p>
            ) : null}
            {cardDrafts.phones?.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {cardDrafts.phones.map((p) => (
                  <li key={p.number}>
                    <span className="font-medium">Phone:</span> {p.number}
                  </li>
                ))}
              </ul>
            ) : null}
            {cardDrafts.addresses?.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {cardDrafts.addresses.map((a) => (
                  <li key={a.address}>
                    <span className="font-medium">{a.title || "Address"}:</span> {a.address}
                  </li>
                ))}
              </ul>
            ) : null}
            {cardDrafts.socials?.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {cardDrafts.socials.map((s) => (
                  <li key={`${s.name}-${s.url}`}>
                    <span className="font-medium capitalize">{s.name}:</span> {s.url}
                  </li>
                ))}
              </ul>
            ) : null}
            {cardDrafts.tagline ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">Tagline:</span> {cardDrafts.tagline}
              </p>
            ) : null}
            {cardDrafts.about ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">About:</span> {cardDrafts.about}
              </p>
            ) : null}
            {cardDrafts.hotlinks?.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {cardDrafts.hotlinks.map((h) => (
                  <li key={`${h.label}-${h.url}`}>
                    <span className="font-medium">{h.label}:</span> {h.url}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={applying}
                onClick={() => setCardDrafts({})}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                className="inline-flex items-center gap-1.5"
                disabled={applying}
                onClick={() => void applyCardDrafts()}
              >
                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                {applying ? "Applying…" : "Apply to myCARD"}
              </Button>
            </div>
          </div>
        ) : null}
        {draftOpen && draft ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Support draft</p>
            <textarea
              className="mt-2 w-full rounded-lg border border-amber-200 bg-white p-2 text-sm"
              rows={1}
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDraftOpen(false)}>
                Edit later
              </Button>
              <Button size="sm" onClick={() => void submitDraft()}>
                Submit to FunCrew
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          <button
            type="button"
            className={tipPrimaryClass}
            onClick={() => scanWebsite()}
          >
            {hasWebsite ? "Refresh from website" : "Scan my website"}
          </button>
          <button
            type="button"
            className={tipClass}
            onClick={() => void send("Collect my Instagram, Facebook, and other socials for myCARD")}
          >
            Add socials
          </button>
          <button
            type="button"
            className={tipClass}
            onClick={() => void send("Collect phone, address, and email for myCARD")}
          >
            Add contact
          </button>
          <button
            type="button"
            className={tipClass}
            onClick={() => void send("Write a short tagline for myCARD")}
          >
            Draft tagline
          </button>
          <button
            type="button"
            className={tipClass}
            onClick={() => void send("Draft an About statement")}
          >
            Draft About
          </button>
          <button
            type="button"
            className={`${tipClass} disabled:opacity-40`}
            disabled={!pending || applying}
            onClick={() => void applyCardDrafts()}
          >
            {applying ? "Applying…" : "Apply drafts"}
          </button>
          <button
            type="button"
            className={tipClass}
            onClick={() => void send("Run SKYSCAN", "skyscan")}
          >
            SKYSCAN
          </button>
          <button
            type="button"
            className={tipClass}
            onClick={() => {
              setDraft({ summary: "Owner asked AskSKY for FunCrew help." });
              setDraftOpen(true);
            }}
          >
            Flag team
          </button>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || loading) return;
            submitMessage(input);
          }}
        >
          <textarea
            ref={inputRef}
            className={cn(
              "max-h-36 min-h-11 flex-1 resize-y rounded-2xl border px-3 py-2 text-sm",
              awaitingWebsite
                ? "border-violet-300 ring-2 ring-violet-200/70"
                : "border-slate-200",
            )}
            rows={2}
            placeholder={
              awaitingWebsite
                ? "https://your-site.com"
                : "Paste a website, phone, address, or Instagram…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!input.trim() || loading) return;
                submitMessage(input);
              }
            }}
          />
          <Button type="submit" size="icon" className="mb-0.5" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
