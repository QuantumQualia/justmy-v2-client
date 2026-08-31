"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { bizOsService } from "@/lib/services/biz-os";
import { profilesService } from "@/lib/services/profiles";
import { useProfileStore, type ProfileData, type SocialType } from "@/lib/store";
import {
  addressesMatch,
  extractAddressFields,
  formatPostalAddress,
  normalizePostalAddress,
  parsePostalAddress,
} from "@/lib/utils/address-utils";
import {
  conciergeStageFromPath,
  useAskSkyConciergeStore,
  type AddressDraft,
  type CardDrafts,
  type ConciergeAction,
  type HotlinkDraft,
  type PhoneDraft,
  type SocialDraft,
} from "@/lib/store/asksky-concierge-store";
import { bumpBizOsPageData, useBizOsProfile, useInvalidateBizOsHome, BIZ_OS_CONNECT_GOOGLE_EVENT } from "./use-biz-os-profile";
import { subscriptionService } from "@/lib/services/subscription";
import { OS_NAME } from "@/lib/os-types";

const SUPPORT_RE =
  /\b(fun\s*crew|flag\s+(the\s+)?team|talk to (a )?human|need (human )?support|support ticket|i('m| am) stuck|upgrade|command\s*os)\b/i;
const MAX_HOTLINKS = 3;

function toAddressDraft(raw: AddressDraft): AddressDraft | null {
  const cleaned = normalizePostalAddress(raw.address);
  if (!cleaned) return null;
  const parsed = parsePostalAddress(cleaned);
  if (!parsed) return null;
  return {
    title: raw.title?.trim() || "Office",
    address: parsed.formatted,
    line1: parsed.line1,
    line2: parsed.line2,
    city: parsed.city,
    state: parsed.state,
    zip: parsed.zip,
  };
}

function recombineAddressDraft(draft: AddressDraft): AddressDraft {
  const line1 = (draft.line1 || extractAddressFields(draft.address).address || draft.address).trim();
  const formatted = formatPostalAddress({
    line1,
    line2: draft.line2?.trim() || undefined,
    city: draft.city?.trim() || undefined,
    state: draft.state?.trim() || undefined,
    zip: draft.zip?.trim() || undefined,
  });
  return { ...draft, line1, address: formatted || line1 };
}

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
  stage,
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
  const pathname = usePathname();
  const surface = stage || conciergeStageFromPath(pathname || "");
  const { profileId } = useBizOsProfile();
  const invalidateHome = useInvalidateBizOsHome();
  const setData = useProfileStore((s) => s.setData);
  const website = useProfileStore((s) => s.data.website);
  const hasWebsite = Boolean(website?.trim());
  const turns = useAskSkyConciergeStore((s) => s.turns);
  const setTurns = useAskSkyConciergeStore((s) => s.setTurns);
  const cardDrafts = useAskSkyConciergeStore((s) => s.cardDrafts);
  const setCardDrafts = useAskSkyConciergeStore((s) => s.setCardDrafts);
  const input = useAskSkyConciergeStore((s) => s.input);
  const setInput = useAskSkyConciergeStore((s) => s.setInput);
  const awaitingWebsite = useAskSkyConciergeStore((s) => s.awaitingWebsite);
  const setAwaitingWebsite = useAskSkyConciergeStore((s) => s.setAwaitingWebsite);
  const beginPageHello = useAskSkyConciergeStore((s) => s.beginPageHello);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ summary: string; planId?: number } | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const applyingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pageSession = useRef(0);

  useEffect(() => {
    if (!profileId) return;
    const key = `${profileId}:${pathname}:${surface}`;
    if (!beginPageHello(key)) return;
    const seq = ++pageSession.current;
    void send("hello", surface, true, seq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, pathname, surface]);

  async function send(message: string, nextStage = surface, silent = false, session = pageSession.current) {
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
      if (session !== pageSession.current) return;
      setTurns((t) => {
        if (silent) return t.length ? t : [{ role: "asksky", text: res.reply }];
        if (t.some((turn) => turn.role === "asksky" && turn.text === res.reply)) {
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
          const incoming = (action.phones as PhoneDraft[])
            .filter(
              (p) => p?.number && !existing.some((saved) => phoneDigits(saved.number) === phoneDigits(p.number)),
            )
            .map((p) => ({ number: p.number, type: p.type?.trim() || "main" }));
          if (incoming.length) {
            setCardDrafts((d) => {
              const currentDrafts = d.phones || [];
              const phones = [...currentDrafts];
              for (const phone of incoming) {
                if (phones.some((saved) => phoneDigits(saved.number) === phoneDigits(phone.number))) continue;
                phones.push(phone);
              }
              return { ...d, phones: phones.slice(0, 4) };
            });
          }
        }
        if (action.type === "draft_addresses" && Array.isArray(action.addresses)) {
          const existing = useProfileStore.getState().data.addresses || [];
          const incoming = (action.addresses as AddressDraft[])
            .filter((a) => a?.address)
            .map(toAddressDraft)
            .filter((a): a is AddressDraft => Boolean(a))
            .filter((a) => !existing.some((saved) => addressesMatch(saved.address, a.address)));
          if (incoming.length) {
            setCardDrafts((d) => {
              const currentDrafts = d.addresses || [];
              const addresses = [...currentDrafts];
              for (const address of incoming) {
                if (addresses.some((saved) => addressesMatch(saved.address, address.address))) continue;
                addresses.push(address);
              }
              return { ...d, addresses: addresses.slice(0, 3) };
            });
          }
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
          if (!onStage) router.push("/biz-os/skyscan");
          if (action.ran) {
            await invalidateHome();
            bumpBizOsPageData();
          }
        }
        if (action.type === "open_battle_plan") {
          onStage?.("battle_plan");
          const planId = Number(action.planId);
          const href = Number.isFinite(planId) && planId > 0 ? `/biz-os/battle-plans/${planId}` : "/biz-os/battle-plans";
          if (!onStage) router.push(href);
          if (action.created || (Number.isFinite(planId) && planId > 0)) {
            await invalidateHome();
            bumpBizOsPageData();
          }
        }
        if (action.type === "open_reputation") {
          onStage?.("reputation");
          const alreadyThere = (pathname || "").includes("/biz-os/reputation");
          const href = action.connect ? "/biz-os/reputation?connect=1" : "/biz-os/reputation";
          if (!onStage && !alreadyThere) router.push(href);
          if (action.connect && alreadyThere && typeof window !== "undefined") {
            window.dispatchEvent(new Event(BIZ_OS_CONNECT_GOOGLE_EVENT));
          }
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
        appendContacts?: boolean;
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
        const existing = [...(current.phones || [])];
        const added: { id: string; number: string; type: string }[] = [];
        for (const phone of cardDrafts.phones) {
          if (!phone.number?.trim()) continue;
          if (
            existing.some((saved) => phoneDigits(saved.number) === phoneDigits(phone.number)) ||
            added.some((saved) => phoneDigits(saved.number) === phoneDigits(phone.number))
          ) {
            continue;
          }
          added.push({
            id: crypto.randomUUID(),
            number: phone.number,
            type: phone.type?.trim() || "main",
          });
        }
        if (added.length) {
          storePatch.phones = [...existing, ...added];
          patch.appendContacts = true;
          patch.phones = added.map((phone) => ({
            type: phone.type,
            number: phone.number,
          }));
        }
      }
      if (cardDrafts.addresses?.length) {
        const existing = [...(current.addresses || [])];
        const added: { id: string; title: string; address: string }[] = [];
        for (const address of cardDrafts.addresses) {
          const next = recombineAddressDraft(address);
          if (!next.address.trim()) continue;
          if (
            existing.some((saved) => addressesMatch(saved.address, next.address)) ||
            added.some((saved) => addressesMatch(saved.address, next.address))
          ) {
            continue;
          }
          added.push({
            id: crypto.randomUUID(),
            title: next.title?.trim() || "Office",
            address: next.address,
          });
        }
        if (added.length) {
          storePatch.addresses = [...existing, ...added];
          patch.appendContacts = true;
          patch.locations = added.map((addr) => ({
            title: addr.title,
            address: addr.address,
          }));
        }
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

  async function runTurnAction(action: ConciergeAction) {
    if (!profileId || loading) return;
    setLoading(true);
    try {
      if (action.kind === "diy") {
        const plan = await bizOsService.createPlan(profileId, "skyscan-diy");
        setTurns((t) => [
          ...t,
          { role: "asksky", text: `DIY BattlePlan is on your dashboard: ${plan.title}. Tasks you already finished were skipped; the rest have a short how-to.` },
        ]);
        router.push(`/biz-os/battle-plans/${plan.id}`);
        await invalidateHome();
        return;
      }
      if (action.kind === "upgrade") {
        const plans = await subscriptionService.listPlans();
        const command = plans.find((p) => p.osName === OS_NAME.COMMAND);
        const monthly = command?.prices.find((p) => p.interval === "month") || command?.prices[0];
        if (!monthly) {
          router.push("/biz-os/pricing");
          return;
        }
        const url = await subscriptionService.createCheckoutSession(monthly.priceId);
        setTurns((t) => [
          ...t,
          {
            role: "asksky",
            text: "Command OS checkout is opening. After you subscribe I’ll lock GEO schema and set up SmartHandoff on this account.",
          },
        ]);
        window.location.href = url;
        return;
      }
      if (action.kind === "command_plan") {
        const plan = await bizOsService.createPlan(profileId, "skyscan-command");
        setTurns((t) => [
          ...t,
          { role: "asksky", text: `Custom Command BattlePlan attached: ${plan.title}. Finished tasks were skipped; each remaining step has a short how-to.` },
        ]);
        router.push(`/biz-os/battle-plans/${plan.id}`);
        await invalidateHome();
        return;
      }
      if (action.kind === "funcrew" || action.kind === "funcrew_ent" || action.kind === "funcrew_manual") {
        const res = await bizOsService.funCrew(profileId);
        setTurns((t) => [
          ...t,
          {
            role: "asksky",
            text:
              action.kind === "funcrew_ent"
                ? "#FunCREW Squad has your competitive targets. Zero extra credits on this handoff."
                : "#FunCREW has received your task! We are on it.",
          },
        ]);
        await invalidateHome();
        if (res.planId) router.push(`/biz-os/battle-plans/${res.planId}`);
        return;
      }
      if (action.kind === "attach_campaign" || action.kind === "new_campaign") {
        const latest = await bizOsService.listSkyscans(profileId);
        const audit = latest[0]?.auditData as {
          extractedTargets?: Array<{ label?: string }>;
        } | undefined;
        const keywords = (audit?.extractedTargets || []).map((t) => t.label).filter(Boolean) as string[];
        const campaigns = await bizOsService.listCampaigns(profileId);
        const active = campaigns.find((c) => c.status === "active");
        const res = await bizOsService.attachScanToCampaign(profileId, {
          campaignId: action.kind === "attach_campaign" ? active?.id : undefined,
          newCampaignName:
            action.kind === "new_campaign" ? "New SkySCAN campaign" : active?.name,
          keywords,
          extractedTargets: audit?.extractedTargets,
        });
        setTurns((t) => [
          ...t,
          { role: "asksky", text: `Mapped keyword gaps into ${res.plan?.title || "your BattlePlan"}.` },
        ]);
        if (res.plan?.id) router.push(`/biz-os/battle-plans/${res.plan.id}`);
        await invalidateHome();
        return;
      }
      if (action.kind === "polish") {
        void send("Polish this SkySCAN strategy with the latest gaps");
        return;
      }
      if (action.kind === "voice_recap") {
        const recap = await bizOsService.createVoiceRecap(profileId);
        setTurns((t) => [
          ...t,
          {
            role: "asksky",
            text: `Voice recap is ready. Play it on SkySCAN or open this audio link:\n${recap.audioUrl}`,
          },
        ]);
        bumpBizOsPageData();
        return;
      }
      if (action.kind === "broadcast") {
        const syn = await bizOsService.runSyndication(profileId, false);
        const lines = (syn.receipt || [])
          .map((r) => `${r.status === "published" || r.status === "assets_ready" ? "🟢" : "🔴"} ${r.label}`)
          .join("\n");
        setTurns((t) => [
          ...t,
          {
            role: "asksky",
            text: `${syn.message}\n${lines}${syn.bundleUrl ? `\nDownload pack: ${syn.bundleUrl}` : ""}${syn.bundleNote ? `\n${syn.bundleNote}` : ""}`,
            actions: syn.bundleNote
              ? [{ id: "funcrew_manual", label: "Send to #FunCREW for Manual Posting", kind: "funcrew_manual" }]
              : undefined,
          },
        ]);
        bumpBizOsPageData();
      }
    } finally {
      setLoading(false);
    }
  }

  function submitMessage(raw: string, nextStage = surface) {
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
  const draftInputClass =
    "mt-1 w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-sm text-slate-800";
  const tipClass =
    "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-800";
  const tipPrimaryClass =
    "rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 transition hover:border-violet-400 hover:bg-violet-100";

  const chips =
    surface === "skyscan"
      ? [
          { label: "Run SkySCAN", onClick: () => void send("Run SkySCAN", "skyscan"), primary: true },
          { label: "Explain my score", onClick: () => void send("Explain my SkySCAN score") },
          { label: "Flag team", onClick: () => { setDraft({ summary: "Owner asked AskSKY for FunCrew help." }); setDraftOpen(true); } },
        ]
      : surface === "battle_plan"
        ? [
            { label: "Start a plan", onClick: () => void send("Start a Battle Plan", "battle_plan"), primary: true },
            { label: "Next task", onClick: () => void send("What's my next Battle Plan task?") },
            { label: "Flag team", onClick: () => { setDraft({ summary: "Owner asked AskSKY for FunCrew help." }); setDraftOpen(true); } },
          ]
        : surface === "reputation"
          ? [
              { label: "Connect Google", onClick: () => void send("Help me connect my Google listing") , primary: true },
              { label: "Draft a review ask", onClick: () => void send("Draft a short text asking a customer for a Google review") },
              { label: "Add contact", onClick: () => void send("Collect phone, address, and email for myCARD") },
            ]
          : surface === "home" || surface === "apps"
            ? [
                { label: "Polish myCARD", onClick: () => router.push("/biz-os/onboard"), primary: true },
                { label: "Run SkySCAN", onClick: () => void send("Run SkySCAN", "skyscan") },
                { label: "Start a plan", onClick: () => void send("Start a Battle Plan", "battle_plan") },
              ]
            : surface === "pricing"
              ? [
                  { label: "See Command OS", onClick: () => router.push("/biz-os/pricing"), primary: true },
                  { label: "Start a plan", onClick: () => void send("Start a Battle Plan", "battle_plan") },
                  { label: "Flag team", onClick: () => { setDraft({ summary: "Owner asked AskSKY for FunCrew help." }); setDraftOpen(true); } },
                ]
              : surface === "settings"
                ? [
                    { label: "Polish myCARD", onClick: () => router.push("/biz-os/onboard"), primary: true },
                    { label: "Run SkySCAN", onClick: () => void send("Run SkySCAN", "skyscan") },
                    { label: "Flag team", onClick: () => { setDraft({ summary: "Owner asked AskSKY for FunCrew help." }); setDraftOpen(true); } },
                  ]
            : [
                {
                  label: hasWebsite ? "Refresh from website" : "Scan my website",
                  onClick: () => scanWebsite(),
                  primary: true,
                },
                { label: "Add socials", onClick: () => void send("Collect my Instagram, Facebook, and other socials for myCARD") },
                { label: "Add contact", onClick: () => void send("Collect phone, address, and email for myCARD") },
                { label: "Draft tagline", onClick: () => void send("Write a short tagline for myCARD") },
                { label: "Draft About", onClick: () => void send("Draft an About statement") },
                { label: applying ? "Applying…" : "Apply drafts", onClick: () => void applyCardDrafts(), disabled: !pending || applying },
                { label: "SkySCAN", onClick: () => void send("Run SkySCAN", "skyscan") },
                { label: "Flag team", onClick: () => { setDraft({ summary: "Owner asked AskSKY for FunCrew help." }); setDraftOpen(true); } },
              ];

  return (
    <div
      className={cn(
        compact
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : "flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)]",
        !compact &&
          (fillViewport
            ? "h-full min-h-0"
            : "h-[min(70vh,36rem)]"),
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-violet-50 bg-linear-to-r from-violet-50/80 to-cyan-50/40 px-4 py-3",
          compact && "pr-12",
        )}
      >
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
            {turn.role === "asksky" && turn.actions?.length ? (
              <div className="mt-2 flex flex-col gap-1.5">
                {turn.actions.map((action) => (
                  <Button
                    key={action.id}
                    size="sm"
                    variant={action.id.endsWith("b") || action.kind === "upgrade" ? "outline" : "default"}
                    className="h-auto whitespace-normal py-1.5 text-left text-xs"
                    disabled={loading}
                    onClick={() => void runTurnAction(action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" /> thinking…
          </p>
        ) : null}
        {pending ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
              Drafts — edit, then apply
            </p>
            {cardDrafts.website != null && cardDrafts.website !== "" ? (
              <label className="mt-2 block text-xs font-medium text-slate-600">
                Website
                <Input
                  className={draftInputClass}
                  value={cardDrafts.website}
                  onChange={(e) => setCardDrafts((d) => ({ ...d, website: e.target.value }))}
                />
              </label>
            ) : null}
            {cardDrafts.email != null && cardDrafts.email !== "" ? (
              <label className="mt-2 block text-xs font-medium text-slate-600">
                Email
                <Input
                  className={draftInputClass}
                  value={cardDrafts.email}
                  onChange={(e) => setCardDrafts((d) => ({ ...d, email: e.target.value }))}
                />
              </label>
            ) : null}
            {cardDrafts.calendarLink != null && cardDrafts.calendarLink !== "" ? (
              <label className="mt-2 block text-xs font-medium text-slate-600">
                Calendar
                <Input
                  className={draftInputClass}
                  value={cardDrafts.calendarLink}
                  onChange={(e) => setCardDrafts((d) => ({ ...d, calendarLink: e.target.value }))}
                />
              </label>
            ) : null}
            {cardDrafts.phones?.length ? (
              <div className="mt-2">
                <p className="text-xs font-medium text-slate-600">Phone</p>
                <div className="mt-1 space-y-1.5">
                  {cardDrafts.phones.map((phone, index) => (
                    <div key={`phone-${index}`} className="grid gap-1.5">
                      <Input
                        className={draftInputClass}
                        placeholder="Label (e.g. main, mobile)"
                        value={phone.type || ""}
                        onChange={(e) =>
                          setCardDrafts((d) => ({
                            ...d,
                            phones: (d.phones || []).map((item, i) =>
                              i === index ? { ...item, type: e.target.value } : item,
                            ),
                          }))
                        }
                      />
                      <Input
                        className={draftInputClass}
                        placeholder="Phone number"
                        value={phone.number}
                        onChange={(e) =>
                          setCardDrafts((d) => ({
                            ...d,
                            phones: (d.phones || []).map((item, i) =>
                              i === index ? { ...item, number: e.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {cardDrafts.addresses?.length ? (
              <div className="mt-2">
                <p className="text-xs font-medium text-slate-600">Locations</p>
                <div className="mt-1 space-y-1.5">
                  {cardDrafts.addresses.map((address, index) => (
                    <div key={`addr-${index}`} className="space-y-1.5 rounded-lg border border-violet-200 bg-white/70 p-2">
                <Input
                  className={draftInputClass}
                  placeholder="Title (e.g. Office, Home)"
                  value={address.title || ""}
                  onChange={(e) =>
                    setCardDrafts((d) => ({
                      ...d,
                      addresses: (d.addresses || []).map((item, i) =>
                        i === index ? { ...item, title: e.target.value } : item,
                      ),
                    }))
                  }
                />
                <Input
                  className={draftInputClass}
                  placeholder="Street"
                  value={address.line1 || extractAddressFields(address.address).address}
                  onChange={(e) =>
                    setCardDrafts((d) => ({
                      ...d,
                      addresses: (d.addresses || []).map((item, i) =>
                        i === index ? recombineAddressDraft({ ...item, line1: e.target.value }) : item,
                      ),
                    }))
                  }
                />
                <Input
                  className={draftInputClass}
                  placeholder="Apt / suite"
                  value={address.line2 || ""}
                  onChange={(e) =>
                    setCardDrafts((d) => ({
                      ...d,
                      addresses: (d.addresses || []).map((item, i) =>
                        i === index ? recombineAddressDraft({ ...item, line2: e.target.value }) : item,
                      ),
                    }))
                  }
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <Input
                    className={draftInputClass}
                    placeholder="City"
                    value={address.city || ""}
                    onChange={(e) =>
                      setCardDrafts((d) => ({
                        ...d,
                        addresses: (d.addresses || []).map((item, i) =>
                          i === index ? recombineAddressDraft({ ...item, city: e.target.value }) : item,
                        ),
                      }))
                    }
                  />
                  <Input
                    className={draftInputClass}
                    placeholder="State"
                    value={address.state || ""}
                    onChange={(e) =>
                      setCardDrafts((d) => ({
                        ...d,
                        addresses: (d.addresses || []).map((item, i) =>
                          i === index ? recombineAddressDraft({ ...item, state: e.target.value }) : item,
                        ),
                      }))
                    }
                  />
                  <Input
                    className={draftInputClass}
                    placeholder="ZIP"
                    value={address.zip || ""}
                    onChange={(e) =>
                      setCardDrafts((d) => ({
                        ...d,
                        addresses: (d.addresses || []).map((item, i) =>
                          i === index ? recombineAddressDraft({ ...item, zip: e.target.value }) : item,
                        ),
                      }))
                    }
                  />
                </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {cardDrafts.socials?.map((social, index) => (
              <label key={`social-${index}`} className="mt-2 block text-xs font-medium text-slate-600">
                <span className="capitalize">{social.name}</span>
                <Input
                  className={draftInputClass}
                  value={social.url}
                  onChange={(e) =>
                    setCardDrafts((d) => ({
                      ...d,
                      socials: (d.socials || []).map((item, i) =>
                        i === index ? { ...item, url: e.target.value } : item,
                      ),
                    }))
                  }
                />
              </label>
            ))}
            {cardDrafts.tagline != null && cardDrafts.tagline !== "" ? (
              <label className="mt-2 block text-xs font-medium text-slate-600">
                Tagline
                <Input
                  className={draftInputClass}
                  value={cardDrafts.tagline}
                  onChange={(e) => setCardDrafts((d) => ({ ...d, tagline: e.target.value }))}
                />
              </label>
            ) : null}
            {cardDrafts.about != null && cardDrafts.about !== "" ? (
              <label className="mt-2 block text-xs font-medium text-slate-600">
                About
                <textarea
                  className={`${draftInputClass} min-h-[4.5rem] resize-y`}
                  value={cardDrafts.about}
                  onChange={(e) => setCardDrafts((d) => ({ ...d, about: e.target.value }))}
                />
              </label>
            ) : null}
            {cardDrafts.hotlinks?.length ? (
              <div className="mt-2">
                <p className="text-xs font-medium text-slate-600">Hotlinks</p>
                <div className="mt-1 space-y-1.5">
                  {cardDrafts.hotlinks.map((link, index) => (
                    <div key={`hot-${index}`} className="grid gap-1.5">
                      <Input
                        className={draftInputClass}
                        placeholder="Hotlink label"
                        value={link.label}
                        onChange={(e) =>
                          setCardDrafts((d) => ({
                            ...d,
                            hotlinks: (d.hotlinks || []).map((item, i) =>
                              i === index ? { ...item, label: e.target.value } : item,
                            ),
                          }))
                        }
                      />
                      <Input
                        className={draftInputClass}
                        placeholder="https://"
                        value={link.url}
                        onChange={(e) =>
                          setCardDrafts((d) => ({
                            ...d,
                            hotlinks: (d.hotlinks || []).map((item, i) =>
                              i === index ? { ...item, url: e.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
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
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={`${chip.primary ? tipPrimaryClass : tipClass} ${chip.disabled ? "disabled:opacity-40" : ""}`}
              disabled={loading || chip.disabled}
              onClick={chip.onClick}
            >
              {chip.label}
            </button>
          ))}
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
