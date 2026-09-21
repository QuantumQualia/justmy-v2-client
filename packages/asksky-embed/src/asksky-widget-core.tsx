import * as React from "react";
import { ArrowRight, Loader2, RefreshCw, Vote } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { SkyAvatar, SkyPoweredBy } from "@workspace/ui/components/sky-avatar";
import type {
  AskSkySkyTransport,
  SkyConversationMessage,
  SkyResolveContactForm,
  SkyResolveResponse,
  SkyRetrievedDoc,
  SkySseDonePayload,
} from "./sky-types";
import { formatAskSkyUserFacingError } from "./sky-user-errors";
import { citationLinksFromRetrievedDocs, parseSkyRetrievedDocs } from "./sky-retrieved-docs";
import { LinkifiedMessage } from "./linkified-message";
import { useIsMobile } from "./use-is-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { AskSkyEmbedPublicForm } from "./asksky-embed-public-form";
import { AskSkyShareTrayPanel } from "./asksky-share-tray";
import { toSkyLeadCaptureFields, type AskSkyPersistLeadCaptureArgs } from "./format-lead-answers-summary";
import {
  ASK_SKY_DEFAULT_CLOSING_MESSAGE,
  buildShareTrayLinks,
  isShareTrayActive,
} from "./share-tray-links";
import { useResolvedAskSkyTheme, type AskSkyThemeOption } from "./asksky-theme";
import "./asksky-glass.css";

export type AskSkyVariant = "inline" | "voice" | "chatbot";

type VisitorBubble = { photo?: string | null; name?: string | null } | null;

type AskSkyRuntimeValue = {
  sky: AskSkySkyTransport;
  visitorUserBubble: VisitorBubble;
};

const AskSkyRuntimeContext = React.createContext<AskSkyRuntimeValue | null>(null);

function useAskSkyRuntime(): AskSkyRuntimeValue {
  const v = React.useContext(AskSkyRuntimeContext);
  if (!v) {
    throw new Error("AskSkyRuntimeContext is missing — wrap with AskSkyWidgetCore.");
  }
  return v;
}

function UserAvatarThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200">
      <img src={src} alt={alt} width={32} height={32} className="h-full w-full object-cover" />
    </div>
  );
}

const STORAGE_PREFIX = "asksky:v1:";

/** Advance string index by one “word” (non-whitespace run, or a run of whitespace). */
function nextRevealEnd(full: string, visibleEnd: number): number {
  if (visibleEnd >= full.length) {
    return full.length;
  }
  let i = visibleEnd;
  if (/\s/.test(full[i]!)) {
    while (i < full.length && /\s/.test(full[i]!)) {
      i += 1;
    }
    return i;
  }
  while (i < full.length && !/\s/.test(full[i]!)) {
    i += 1;
  }
  return i;
}

const STREAM_WORD_MS = 58;

function storageKey(embedKey: string) {
  return `${STORAGE_PREFIX}${embedKey}`;
}

function loadPersisted(embedKey: string): { conversationId: number; visitorToken: string } | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const primaryKey = storageKey(embedKey);
    let raw = sessionStorage.getItem(primaryKey);
    if (!raw) {
      const legacyKey = storageKey(`${embedKey}:chatbot`);
      raw = sessionStorage.getItem(legacyKey);
      if (raw) {
        try {
          sessionStorage.setItem(primaryKey, raw);
          sessionStorage.removeItem(legacyKey);
        } catch {
          /* ignore */
        }
      }
    }
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { conversationId?: number; visitorToken?: string };
    if (typeof parsed.conversationId === "number" && typeof parsed.visitorToken === "string") {
      return { conversationId: parsed.conversationId, visitorToken: parsed.visitorToken };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistConversation(embedKey: string, conversationId: number, visitorToken: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(
      storageKey(embedKey),
      JSON.stringify({ conversationId, visitorToken }),
    );
  } catch {
    /* ignore */
  }
}

type AskSkyChatMessage = Pick<SkyConversationMessage, "role" | "content"> & {
  refusal?: boolean;
  /** After SSE `requestingContactDetails`, show linked contact form inline (below this assistant message). */
  showContactForm?: boolean;
  model?: string | null;
  retrievedDocs?: SkyRetrievedDoc[];
  at?: number;
};

function mapHistoryMessage(m: SkyConversationMessage): AskSkyChatMessage {
  const docs = parseSkyRetrievedDocs(m.retrievedDocs);
  const model = m.model != null && m.model !== "" ? m.model : null;
  return {
    role: m.role,
    content: m.content,
    ...(model ? { model } : {}),
    ...(docs.length > 0 ? { retrievedDocs: docs } : {}),
    ...(model === "no-match" ? { refusal: true } : {}),
  };
}

function AskSkyMessageCitations({
  docs,
}: {
  docs: SkyRetrievedDoc[] | undefined;
  isEmbedInline?: boolean;
  isGlassChrome?: boolean;
}) {
  const links = citationLinksFromRetrievedDocs(docs);
  if (links.length === 0) {
    return null;
  }
  const preferLiveLabel = links.some((l) => l.live);
  return (
    <div className="mt-2.5 border-t border-white/30 pt-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85">
        {preferLiveLabel ? "Sources" : "References"}
      </p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.url} className="min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-xs font-medium text-white underline decoration-white/70 underline-offset-2 hover:text-cyan-50"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AskSkyLiveSearchBadge({
  model,
}: {
  model?: string | null;
  isEmbedInline?: boolean;
  isGlassChrome?: boolean;
}) {
  if (model !== "openai-live-search") {
    return null;
  }
  return (
    <span
      className="mt-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        background: "rgba(255,255,255,0.18)",
        color: "var(--asksky-bubble-assistant-fg)",
      }}
    >
      From recent sources
    </span>
  );
}

/** Optional slot for myFORM lead capture (implemented in the host app, e.g. Next.js `DynamicForm`). */
export type AskSkyRenderContactLeadCapture = (ctx: {
  contactForm: SkyResolveContactForm;
  profileSlug: string;
  agentToken: string;
  visualVariant: "embed-inline" | "glass" | "default";
  /**
   * After myFORM submit succeeds, persist answers on the server (`POST .../lead-capture`) and refresh
   * the transcript. Omitted when there is no conversation yet.
   */
  persistLeadInConversation?: (args: AskSkyPersistLeadCaptureArgs) => Promise<void>;
}) => React.ReactNode;

function initialGreetingMessages(resolve: SkyResolveResponse): AskSkyChatMessage[] {
  const text = resolve.greetingMessage?.trim();
  if (!text) {
    return [];
  }
  return [{ role: "assistant", content: text }];
}

/** Always show the agent greeting first; strip a duplicate opening line from persisted history. */
function mergeGreetingFirst(resolve: SkyResolveResponse, history: AskSkyChatMessage[]): AskSkyChatMessage[] {
  const greeting = initialGreetingMessages(resolve);
  if (greeting.length === 0) {
    return history;
  }
  const g0 = greeting[0]!;
  if (history[0]?.role === "assistant" && history[0]?.content === g0.content) {
    return [...greeting, ...history.slice(1)];
  }
  return [...greeting, ...history];
}

function suggestedQuestionsFromResolve(resolve: SkyResolveResponse): string[] {
  const sq = resolve.suggestedQuestions;
  if (!Array.isArray(sq)) {
    return [];
  }
  return sq
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const chatScrollClasses = "asksky-sky-scroll-gutter";

function AskSkyTypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 py-1 text-white/80"
      role="status"
      aria-live="polite"
      aria-label="Assistant is replying"
    >
      <span className="asksky-typing-dot" />
      <span className="asksky-typing-dot" />
      <span className="asksky-typing-dot" />
    </div>
  );
}

function AskSkyConversationView({
  resolve,
  profileSlug,
  agentToken,
  embedKey,
  conversationLayout = "inline",
  renderContactLeadCapture,
  embedAppOrigin,
}: {
  resolve: SkyResolveResponse;
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  /** `"panel"` | `"embed"` = flex fill inside a fixed-height shell (chatbot panel or iframe). */
  conversationLayout?: "inline" | "panel" | "embed";
  renderContactLeadCapture?: AskSkyRenderContactLeadCapture;
  /**
   * When `renderContactLeadCapture` is omitted (e.g. script shadow embed), refusal-time contact capture
   * loads `/embed/myform` from this origin in an iframe.
   */
  embedAppOrigin?: string;
}) {
  const isMobile = useIsMobile();
  const { sky, visitorUserBubble: profile } = useAskSkyRuntime();
  const [messages, setMessages] = React.useState<AskSkyChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState<number | null>(null);
  const [visitorToken, setVisitorToken] = React.useState<string | null>(null);
  /** From `GET /sky/conversations` or latest SSE `done` — hides lead form when contact already captured. */
  const [visitorContactCaptured, setVisitorContactCaptured] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState("");
  const [phase, setPhase] = React.useState<"idle" | "streaming">("idle");
  const [banner, setBanner] = React.useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = React.useState<string[]>(() =>
    suggestedQuestionsFromResolve(resolve),
  );
  const [shareTrayOpen, setShareTrayOpen] = React.useState(false);
  /** Background refresh of suggested questions after Ask Another (does not block the UI). */
  const [suggestionsRefreshing, setSuggestionsRefreshing] = React.useState(false);
  const askAnotherRequestIdRef = React.useRef(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contactFormAnchorRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const assistantBufferRef = React.useRef("");
  const revealEndRef = React.useRef(0);
  const revealIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  /** Latest resolve for async paths without re-subscribing the hydration effect when the object reference changes. */
  const resolveLatest = React.useRef(resolve);
  resolveLatest.current = resolve;

  const conversationIdRef = React.useRef<number | null>(conversationId);
  conversationIdRef.current = conversationId;
  const visitorTokenRef = React.useRef<string | null>(visitorToken);
  visitorTokenRef.current = visitorToken;

  /** API: when false, chat input should be disabled (knowledge base not configured). */
  const knowledgeReady = resolve.hasKnowledgeBase !== false;

  const stopWordReveal = React.useCallback(() => {
    if (revealIntervalRef.current != null) {
      clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
  }, []);

  const startWordReveal = React.useCallback(() => {
    if (revealIntervalRef.current != null) {
      return;
    }
    revealIntervalRef.current = setInterval(() => {
      const full = assistantBufferRef.current;
      let end = revealEndRef.current;
      if (end >= full.length) {
        return;
      }
      end = nextRevealEnd(full, end);
      revealEndRef.current = end;
      setStreamingText(full.slice(0, end));
    }, STREAM_WORD_MS);
  }, []);

  React.useEffect(() => {
    return () => stopWordReveal();
  }, [stopWordReveal]);

  // Hydration: `resolve` is read via `resolveLatest` so reference churn / StrictMode does not double-fetch `getConversation`.
  React.useEffect(() => {
    let cancelled = false;
    setBanner(null);

    setMessages([]);
    setConversationId(null);
    setVisitorToken(null);
    setVisitorContactCaptured(false);
    setSuggestedQuestions(suggestedQuestionsFromResolve(resolveLatest.current));
    setShareTrayOpen(false);
    setSuggestionsRefreshing(false);
    askAnotherRequestIdRef.current += 1;

    const saved = loadPersisted(embedKey);
    if (!saved) {
      setMessages(initialGreetingMessages(resolveLatest.current));
      return () => {
        cancelled = true;
      };
    }

    setConversationId(saved.conversationId);
    setVisitorToken(saved.visitorToken);
    void (async () => {
      try {
        const conv = await sky.skyGetConversation(saved.conversationId, saved.visitorToken);
        if (cancelled) {
          return;
        }
        const history = conv.messages.map(mapHistoryMessage);
        setVisitorContactCaptured(Boolean(conv.visitorContactCaptured));
        setMessages(mergeGreetingFirst(resolveLatest.current, history));
      } catch (e) {
        if (cancelled) {
          return;
        }
        sessionStorage.removeItem(storageKey(embedKey));
        setConversationId(null);
        setVisitorToken(null);
        setVisitorContactCaptured(false);
        setMessages(initialGreetingMessages(resolveLatest.current));
        setBanner(formatAskSkyUserFacingError(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embedKey, sky]);

  const scrollThreadToBottom = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, []);

  React.useEffect(() => {
    scrollThreadToBottom();
  }, [
    messages,
    streamingText,
    phase,
    shareTrayOpen,
    suggestedQuestions,
    suggestionsRefreshing,
    scrollThreadToBottom,
  ]);

  React.useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    const syncHeight = () => {
      el.style.height = "0px";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    syncHeight();
    const ro = new ResizeObserver(() => {
      syncHeight();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [input]);

  const focusMessageInput = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) {
        return;
      }
      if (isMobile) {
        el.blur();
        return;
      }
      el.focus();
    });
  }, [isMobile]);

  const persistLeadInConversation = React.useCallback(
    async (args: AskSkyPersistLeadCaptureArgs) => {
      const cid = conversationIdRef.current;
      const vt = visitorTokenRef.current?.trim();
      if (cid == null || cid <= 0 || !vt) {
        setBanner("Could not link your details to this chat. Send another message and try the form again.");
        return;
      }
      try {
        await sky.skyPostLeadCapture(cid, {
          profileSlug,
          agentToken,
          visitorToken: vt,
          ...(args.formTitle?.trim() ? { formTitle: args.formTitle.trim() } : {}),
          fields: toSkyLeadCaptureFields(args.answers, args.schema),
        });
        const conv = await sky.skyGetConversation(cid, vt);
        setVisitorContactCaptured(Boolean(conv.visitorContactCaptured));
        const history = conv.messages.map(mapHistoryMessage);
        setMessages(mergeGreetingFirst(resolveLatest.current, history));
      } catch (e) {
        setBanner(formatAskSkyUserFacingError(e));
      }
    },
    [agentToken, profileSlug, sky],
  );

  const sendMessage = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || phase === "streaming" || !knowledgeReady) {
      return;
    }
    setShareTrayOpen(false);
    setInput("");
    setBanner(null);
    focusMessageInput();
    setMessages((prev) => [...prev, { role: "user", content: trimmed, at: Date.now() }]);
    setPhase("streaming");
    setStreamingText("");
    assistantBufferRef.current = "";
    revealEndRef.current = 0;
    stopWordReveal();
    askAnotherRequestIdRef.current += 1;
    setSuggestionsRefreshing(false);

    let assistant = "";
    let refusedKb = false;
    let lastDone: SkySseDonePayload | undefined;
    const lastMeta: {
      requestingContactDetails?: boolean;
      visitorContactCaptured?: boolean;
    } = {};

    try {
      await sky.streamSkyMessage(
        {
          profileSlug,
          agentToken,
          message: trimmed,
          ...(conversationId != null && conversationId > 0 ? { conversationId } : {}),
          ...(visitorToken?.trim() ? { visitorToken: visitorToken.trim() } : {}),
        },
        {
          onTextDelta: (d) => {
            assistant += d;
            assistantBufferRef.current = assistant;
            startWordReveal();
          },
          onMeta: (meta) => {
            if (typeof meta.conversationId === "number") {
              conversationIdRef.current = meta.conversationId;
              setConversationId(meta.conversationId);
            }
            if (meta.visitorToken) {
              visitorTokenRef.current = meta.visitorToken;
              setVisitorToken(meta.visitorToken);
            }
            if (typeof meta.conversationId === "number" && meta.visitorToken) {
              persistConversation(embedKey, meta.conversationId, meta.visitorToken);
            }
            if (typeof meta.requestingContactDetails === "boolean") {
              lastMeta.requestingContactDetails = meta.requestingContactDetails;
            }
            if (typeof meta.visitorContactCaptured === "boolean") {
              lastMeta.visitorContactCaptured = meta.visitorContactCaptured;
              setVisitorContactCaptured(meta.visitorContactCaptured);
            }
            if (meta.refused) {
              refusedKb = true;
            }
            if (meta.suggestedQuestions && meta.suggestedQuestions.length > 0) {
              setSuggestedQuestions(meta.suggestedQuestions);
            }
          },
          onDone: (done) => {
            lastDone = done;
            setVisitorContactCaptured(done.visitorContactCaptured);
            if (done.refused) {
              refusedKb = true;
            }
            if (done.suggestedQuestions && done.suggestedQuestions.length > 0) {
              setSuggestedQuestions(done.suggestedQuestions);
            }
          },
          onRefusal: () => {
            refusedKb = true;
          },
          onError: (msg) => {
            setBanner(msg);
          },
        },
      );

      stopWordReveal();
      assistantBufferRef.current = "";
      revealEndRef.current = 0;
      setStreamingText("");

      const assistantOut = assistant.trim() || lastDone?.answer?.trim() || "";
      let content = assistantOut;
      if (!content) {
        content = refusedKb
          ? "We could not answer that request. Try asking in a different way."
          : "No answer was returned. Please try again.";
      }

      const requesting =
        lastDone != null ? lastDone.requestingContactDetails : lastMeta.requestingContactDetails === true;
      const capturedBeforeForm =
        lastDone != null ? lastDone.visitorContactCaptured : lastMeta.visitorContactCaptured === true;
      const hasLeadSlot =
        Boolean(resolve.contactForm) &&
        (Boolean(renderContactLeadCapture) || Boolean(embedAppOrigin?.trim()));
      const cid = conversationIdRef.current;
      const vt = visitorTokenRef.current?.trim();
      const canShowContact =
        requesting &&
        !capturedBeforeForm &&
        hasLeadSlot &&
        cid != null &&
        cid > 0 &&
        Boolean(vt);

      const docs =
        !refusedKb && lastDone != null ? parseSkyRetrievedDocs(lastDone.retrievedDocs) : [];
      const liveModel =
        docs.some((d) => d.sourceKind === "live") ? ("openai-live-search" as const) : undefined;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content,
          refusal: refusedKb,
          showContactForm: canShowContact,
          ...(docs.length > 0 ? { retrievedDocs: docs } : {}),
          ...(liveModel ? { model: liveModel } : {}),
          at: Date.now(),
        },
      ]);
    } catch (e) {
      setBanner(formatAskSkyUserFacingError(e));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      stopWordReveal();
      assistantBufferRef.current = "";
      revealEndRef.current = 0;
      setStreamingText("");
      setPhase("idle");
      focusMessageInput();
    }
  };

  const send = async () => {
    await sendMessage(input);
  };

  const shareTrayConfig = isShareTrayActive(resolve.shareTray) ? resolve.shareTray : null;
  const hasCompletedExchange =
    phase === "idle" &&
    knowledgeReady &&
    messages.some((m) => m.role === "user") &&
    messages[messages.length - 1]?.role === "assistant";

  const handleAskAnother = () => {
    if (phase === "streaming") {
      return;
    }

    const cid = conversationIdRef.current;
    const vt = visitorTokenRef.current?.trim() ?? null;
    const requestId = askAnotherRequestIdRef.current + 1;
    askAnotherRequestIdRef.current = requestId;

    // Instant UX: clear the thread and return to greeting immediately.
    setShareTrayOpen(false);
    setBanner(null);
    try {
      sessionStorage.removeItem(storageKey(embedKey));
    } catch {
      /* ignore */
    }
    conversationIdRef.current = null;
    visitorTokenRef.current = null;
    setConversationId(null);
    setVisitorToken(null);
    setVisitorContactCaptured(false);
    setMessages(initialGreetingMessages(resolveLatest.current));
    setInput("");
    focusMessageInput();

    // Keep current chips for now; refresh in the background from the prior thread.
    if (cid == null || cid <= 0 || !vt) {
      setSuggestionsRefreshing(false);
      return;
    }

    setSuggestionsRefreshing(true);
    void (async () => {
      try {
        const refreshed = await sky.skyResolve({
          profileSlug,
          agentToken,
          conversationId: cid,
          visitorToken: vt,
        });
        if (askAnotherRequestIdRef.current !== requestId) {
          return;
        }
        const sq = suggestedQuestionsFromResolve(refreshed);
        if (sq.length > 0) {
          setSuggestedQuestions(sq);
        }
      } catch {
        /* keep chips from the previous turn */
      } finally {
        if (askAnotherRequestIdRef.current === requestId) {
          setSuggestionsRefreshing(false);
        }
      }
    })();
  };

  const handleReadyToShare = () => {
    if (!shareTrayConfig) {
      return;
    }
    setShareTrayOpen(true);
  };

  const shareTrayLinks = shareTrayConfig ? buildShareTrayLinks(shareTrayConfig) : [];
  const readyLabel = shareTrayConfig?.readyLabel.trim() ?? "";
  const closingMessage =
    shareTrayConfig?.closingMessage?.trim() || ASK_SKY_DEFAULT_CLOSING_MESSAGE;

  const isEmbedInline = conversationLayout === "embed";
  const isGlassPanel = conversationLayout === "panel";
  const fillsParent = isEmbedInline || isGlassPanel;
  const isGlassChrome = isGlassPanel;
  const leadVisualVariant = isEmbedInline ? "embed-inline" : isGlassChrome ? "glass" : "default";

  const askAnotherCtaClass =
    "asksky-sky-cta inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-sm font-semibold leading-snug transition-colors";
  const readyCtaClass =
    "asksky-sky-ready inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-sm font-semibold leading-snug transition-colors";
  const assistantLinkClass =
    "break-all font-medium text-sky-50 underline decoration-white/55 underline-offset-2 hover:text-white";
  const userLinkClass =
    "break-all font-medium underline decoration-current/40 underline-offset-2 hover:opacity-80";

  const renderContactInThread = React.useCallback(
    (m: AskSkyChatMessage) => {
      if (!m.showContactForm || !resolve.contactForm || visitorContactCaptured) {
        return null;
      }
      return (
        <div className="flex w-full min-w-0 justify-center px-1 mt-2">
          <div className="w-full min-w-0 max-w-[450px]">
            {renderContactLeadCapture ? (
              renderContactLeadCapture({
                contactForm: resolve.contactForm,
                profileSlug,
                agentToken,
                visualVariant: leadVisualVariant,
                persistLeadInConversation,
              })
            ) : embedAppOrigin?.trim() ? (
              <AskSkyEmbedPublicForm
                origin={embedAppOrigin}
                slug={resolve.contactForm.slug}
                embedChrome={isEmbedInline}
                formTitle={resolve.contactForm.title}
                persistLeadInConversation={persistLeadInConversation}
              />
            ) : null}
          </div>
        </div>
      );
    },
    [
      agentToken,
      embedAppOrigin,
      isEmbedInline,
      leadVisualVariant,
      persistLeadInConversation,
      profileSlug,
      renderContactLeadCapture,
      resolve.contactForm,
      visitorContactCaptured,
    ],
  );

  // Contact form schema loads async — re-scroll when the inline form grows after first paint.
  React.useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last?.showContactForm || visitorContactCaptured) {
      return;
    }
    scrollThreadToBottom();
    const anchor = contactFormAnchorRef.current;
    if (!anchor) {
      return;
    }
    const ro = new ResizeObserver(() => {
      scrollThreadToBottom();
    });
    ro.observe(anchor);
    return () => ro.disconnect();
  }, [messages, visitorContactCaptured, scrollThreadToBottom]);

  return (
    <div
      className={cn("flex min-h-0 min-w-0 flex-col", fillsParent && "flex-1 overflow-hidden")}
    >
      {banner ? (
        <div className="asksky-sky-banner mx-3 mb-3 shrink-0 px-3 py-2 text-sm">
          {banner}
        </div>
      ) : null}
      {!knowledgeReady ? (
        <div className="asksky-sky-banner mx-3 mb-3 shrink-0 px-3 py-2 text-sm">
          Chat is not available yet — the knowledge base for this agent is not set up. You can still read the greeting
          above; contact the business for other ways to reach them.
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={cn(
          "asksky-sky-scroll-gutter flex-1 overflow-y-auto space-y-3 px-3.5 py-3.5",
          fillsParent ? "flex min-h-0 flex-col" : "max-h-[min(420px,55vh)] min-h-[360px]",
        )}
      >
        {messages.length === 0 && !streamingText ? (
          <div
            className={`flex flex-col items-center justify-center px-2 text-center ${
              fillsParent ? "min-h-0 flex-1" : "h-full min-h-[300px]"
            }`}
          >
            <SkyAvatar size={48} className="mb-3" />
            <h4 className="mb-1 text-sm font-semibold" style={{ color: "var(--asksky-text)" }}>
              Got questions? Ask away.
            </h4>
          </div>
        ) : null}
        {messages.map((m, i) => {
          if (m.role === "assistant" && m.showContactForm) {
            const isLastContactFormMessage = i === messages.length - 1;
            return (
              <div
                key={i}
                ref={isLastContactFormMessage ? contactFormAnchorRef : undefined}
                className="flex w-full min-w-0 flex-col gap-2"
              >
                <div className="flex items-start gap-2 justify-start">
                  <SkyAvatar size={32} className="mt-0.5" />
                  <div className="asksky-sky-bubble-assistant">
                    <LinkifiedMessage
                      text={m.content}
                      className="text-white"
                      linkClassName={assistantLinkClass}
                    />
                    <AskSkyLiveSearchBadge model={m.model} />
                    <AskSkyMessageCitations docs={m.retrievedDocs} />
                    {!isEmbedInline && typeof m.at === "number" ? (
                      <span className="mt-1 block text-[10px] text-white/70">
                        {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : null}
                  </div>
                </div>
                {renderContactInThread(m)}
              </div>
            );
          }

          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "assistant" ? <SkyAvatar size={32} className="mt-0.5" /> : null}
              <div
                className={
                  m.role === "user" ? "asksky-sky-bubble-user" : "asksky-sky-bubble-assistant"
                }
              >
                <LinkifiedMessage
                  text={m.content}
                  className={m.role === "user" ? undefined : "text-white"}
                  linkClassName={m.role === "user" ? userLinkClass : assistantLinkClass}
                />
                {m.role === "assistant" ? (
                  <>
                    <AskSkyLiveSearchBadge model={m.model} />
                    <AskSkyMessageCitations docs={m.retrievedDocs} />
                  </>
                ) : null}
                {!isEmbedInline && typeof m.at === "number" ? (
                  <span
                    className={cn(
                      "mt-1 block text-[10px]",
                      m.role === "user" ? "opacity-60" : "text-white/70",
                    )}
                  >
                    {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : null}
              </div>
              {m.role === "user" && profile?.photo ? (
                <UserAvatarThumb src={profile.photo} alt={profile.name || "You"} />
              ) : null}
            </div>
          );
        })}
        {phase === "streaming" ? (
          <div className="flex items-start gap-2 justify-start">
            <SkyAvatar size={32} className="mt-0.5" />
            <div className="asksky-sky-bubble-assistant">
              {streamingText.trim() ? (
                <span className="inline-flex flex-wrap items-end gap-x-1.5">
                  <LinkifiedMessage
                    text={streamingText}
                    className="min-w-0 text-white"
                    linkClassName={assistantLinkClass}
                  />
                  <span className="inline-flex shrink-0 items-center gap-0.5 pb-0.5 text-white/80" aria-hidden>
                    <span className="asksky-typing-dot asksky-typing-dot-sm" />
                    <span className="asksky-typing-dot asksky-typing-dot-sm" />
                    <span className="asksky-typing-dot asksky-typing-dot-sm" />
                  </span>
                </span>
              ) : (
                <AskSkyTypingIndicator />
              )}
            </div>
          </div>
        ) : null}

        {hasCompletedExchange ? (
          <div className="min-w-0 space-y-3 pt-1">
            {shareTrayOpen && shareTrayConfig ? (
              <AskSkyShareTrayPanel
                closingMessage={closingMessage}
                links={shareTrayLinks}
                isEmbedInline={isEmbedInline}
                isGlassChrome={isGlassChrome}
                onClose={() => setShareTrayOpen(false)}
              />
            ) : null}

            {shareTrayOpen || !shareTrayConfig ? (
              <button type="button" className={cn(askAnotherCtaClass, shareTrayOpen && "mt-0.5")} onClick={handleAskAnother}>
                <RefreshCw className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                Ask Another Question
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button type="button" className={askAnotherCtaClass} onClick={handleAskAnother}>
                  <RefreshCw className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Ask Another Question
                </button>
                <button type="button" className={readyCtaClass} onClick={handleReadyToShare}>
                  <Vote className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {readyLabel}
                </button>
              </div>
            )}
          </div>
        ) : null}

        {knowledgeReady &&
        (suggestedQuestions.length > 0 || suggestionsRefreshing) &&
        phase === "idle" ? (
          <div role="region" aria-label="Suggested questions" className="min-w-0 pt-1">
            {!suggestionsRefreshing ? (
              <div id="asksky-suggested-questions" className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={`${i}-${q.slice(0, 48)}`}
                    type="button"
                    className="asksky-sky-pill"
                    onClick={() => void sendMessage(q)}
                  >
                    <span className="line-clamp-2">{q}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {suggestionsRefreshing ? (
              <p
                className="text-center text-[11px] leading-snug"
                style={{ color: "var(--asksky-muted)" }}
                role="status"
                aria-live="polite"
              >
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" aria-hidden />
                Pulling fresh follow-ups from your last chat…
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <form
        className="asksky-embed-composer shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
          focusMessageInput();
        }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={knowledgeReady ? "Type your question..." : "Chat unavailable until knowledge base is configured"}
            rows={1}
            disabled={!knowledgeReady}
            aria-disabled={phase === "streaming" || !knowledgeReady}
            className={cn(
              "asksky-sky-input min-h-[44px] max-h-[120px] min-w-0 flex-1 resize-none px-4 py-2.5 transition-colors scrollbar-hide",
              (phase === "streaming" || !knowledgeReady) && "opacity-80",
              chatScrollClasses,
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
                focusMessageInput();
              }
            }}
          />
          <Button
            type="submit"
            disabled={phase === "streaming" || !input.trim() || !knowledgeReady}
            className="asksky-sky-send h-11 w-11 shrink-0 rounded-full p-0"
            aria-label="Send message"
          >
            {phase === "streaming" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AskSkyResolvedCard({
  resolve,
  profileSlug,
  agentToken,
  embedKey,
  embedFill,
  renderContactLeadCapture,
  embedAppOrigin,
}: {
  resolve: SkyResolveResponse;
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
  embedFill?: boolean;
  glassChrome?: boolean;
  renderContactLeadCapture?: AskSkyRenderContactLeadCapture;
  embedAppOrigin?: string;
}) {
  return (
    <div
      className={
        embedFill ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : "flex flex-col"
      }
    >
      <div className="flex shrink-0 items-center px-4 pb-1 pt-3 sm:px-5">
        <p className="asksky-sky-header">Ask about this business</p>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AskSkyConversationView
          resolve={resolve}
          profileSlug={profileSlug}
          agentToken={agentToken}
          embedKey={embedKey}
          conversationLayout={embedFill ? "embed" : "inline"}
          renderContactLeadCapture={renderContactLeadCapture}
          embedAppOrigin={embedAppOrigin}
        />
      </div>
      <div className="shrink-0 px-4 pb-3 pt-1 sm:px-5">
        <SkyPoweredBy />
      </div>
    </div>
  );
}

function AskSkyChatbotPanel({
  profileSlug,
  agentToken,
  embedKey,
  renderContactLeadCapture,
  embedAppOrigin,
}: {
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  renderContactLeadCapture?: AskSkyRenderContactLeadCapture;
  embedAppOrigin?: string;
}) {
  /** Same chrome + conversation layout as inline embed (`embedFill` + glass inline messages). */
  return (
    <div className="asksky-embed-inline pointer-events-auto flex h-[min(600px,85dvh)] w-[min(100vw-2rem,24rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden shadow-2xl sm:w-[24rem]">
      {/* <div className="flex shrink-0 justify-end px-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 text-zinc-300 hover:bg-white/10 hover:text-white"
          aria-label="Close AskSKY!"
        >
          <X className="h-4 w-4" />
        </Button>
      </div> */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AskSkyResolveShell
          profileSlug={profileSlug}
          agentToken={agentToken}
          embedKey={embedKey}
          embedFill
          renderContactLeadCapture={renderContactLeadCapture}
          embedAppOrigin={embedAppOrigin}
        />
      </div>
    </div>
  );
}

function AskSkyResolveShell({
  profileSlug,
  agentToken,
  embedKey,
  embedFill,
  renderContactLeadCapture,
  embedAppOrigin,
}: {
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
  embedFill?: boolean;
  renderContactLeadCapture?: AskSkyRenderContactLeadCapture;
  embedAppOrigin?: string;
}) {
  const { sky } = useAskSkyRuntime();
  const [resolve, setResolve] = React.useState<SkyResolveResponse | null>(null);
  const [resolveError, setResolveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setResolveError(null);
      const saved = loadPersisted(embedKey);
      try {
        const data = await sky.skyResolve({
          profileSlug,
          agentToken,
          ...(saved
            ? {
                conversationId: saved.conversationId,
                visitorToken: saved.visitorToken,
              }
            : {}),
        });
        if (!cancelled) {
          setResolve(data);
        }
      } catch (e) {
        if (!cancelled) {
          setResolveError(formatAskSkyUserFacingError(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileSlug, agentToken, embedKey, sky]);

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-6 py-16 text-sm",
          embedFill && "flex-1",
        )}
        style={{ color: "var(--asksky-muted)" }}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        Connecting to AskSKY!…
      </div>
    );
  }

  if (resolveError || !resolve) {
    return (
      <div
        className={cn(
          "asksky-sky-error m-4 px-3 py-2 text-sm",
          embedFill && "flex flex-1 items-center justify-center",
        )}
      >
        {resolveError || "AskSKY! is unavailable."}
      </div>
    );
  }

  return (
    <AskSkyResolvedCard
      resolve={resolve}
      profileSlug={profileSlug}
      agentToken={agentToken}
      embedKey={embedKey}
      compactHeader={false}
      embedFill={embedFill}
      glassChrome={Boolean(embedFill)}
      renderContactLeadCapture={renderContactLeadCapture}
      embedAppOrigin={embedAppOrigin}
    />
  );
}

function AskSkyVoicePlaceholder() {
  return (
    <div className="asksky-sky-panel mx-auto min-w-0 w-full max-w-2xl p-5">
      <div className="flex items-center gap-2">
        <SkyAvatar size={32} />
        <div>
          <p className="text-sm font-semibold">Voice line</p>
          <p className="text-xs" style={{ color: "var(--asksky-muted)" }}>Coming soon</p>
        </div>
      </div>
      <p className="mt-3 text-sm" style={{ color: "var(--asksky-muted)" }}>
        Voice-style AskSKY! will let visitors speak naturally with your agent. Audio capture and playback are not
        available in this build.
      </p>
    </div>
  );
}

export interface AskSkyWidgetCoreProps {
  profileSlug: string;
  agentToken: string;
  variant: AskSkyVariant;
  embedKey: string;
  /** Full width + flex height for `/embed/asksky` iframes. */
  embedFill?: boolean;
  /** light | dark | auto (host luminance, then prefers-color-scheme). */
  theme?: AskSkyThemeOption;
  sky: AskSkySkyTransport;
  visitorUserBubble?: VisitorBubble;
  /** Optional myFORM lead capture UI when `sky/resolve` returns `contactForm`. */
  renderContactLeadCapture?: AskSkyRenderContactLeadCapture;
  /**
   * App origin for script/shadow embeds without `renderContactLeadCapture`. Refusal contact form uses
   * `GET/POST /api/embed/forms` on this origin (same React tree as the chat, not an iframe).
   */
  embedAppOrigin?: string;
}

function AskSkyWidgetInner({
  profileSlug,
  agentToken,
  variant,
  embedKey,
  embedFill,
  renderContactLeadCapture,
  embedAppOrigin,
}: Omit<AskSkyWidgetCoreProps, "sky" | "visitorUserBubble" | "theme">) {
  const [chatOpen, setChatOpen] = React.useState(false);
  /** After first open, keep the panel mounted while closed so conversation state + `getConversation` are not re-run. */
  const [chatShellMounted, setChatShellMounted] = React.useState(false);

  if (!profileSlug.trim() || !agentToken.trim()) {
    return (
      <div className="asksky-sky-banner mx-auto min-w-0 w-full max-w-2xl px-4 py-4 text-sm">
        Configure profile slug and agent token for this AskSKY! block.
      </div>
    );
  }

  if (variant === "voice") {
    return <AskSkyVoicePlaceholder />;
  }

  if (variant === "chatbot") {
    return (
      <div className="pointer-events-none fixed bottom-4 right-4 z-[2147483646] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {chatOpen || chatShellMounted ? (
          <div
            className={cn("pointer-events-auto", !chatOpen && "hidden")}
            aria-hidden={!chatOpen}
          >
            <AskSkyChatbotPanel
              key={`${profileSlug}:${agentToken}`}
              profileSlug={profileSlug}
              agentToken={agentToken}
              embedKey={embedKey}
              renderContactLeadCapture={renderContactLeadCapture}
              embedAppOrigin={embedAppOrigin}
            />
          </div>
        ) : null}
        <button
          type="button"
          className="asksky-sky-launcher pointer-events-auto"
          onClick={() => {
            setChatOpen((wasOpen) => {
              if (!wasOpen) {
                setChatShellMounted(true);
              }
              return !wasOpen;
            });
          }}
          aria-expanded={chatOpen}
          aria-label={chatOpen ? "Close AskSKY!" : "Got Questions?"}
        >
          <SkyAvatar size={28} />
          <span>Got Questions?</span>
          {!chatOpen ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-emerald-400" />
          ) : null}
        </button>
      </div>
    );
  }

  if (embedFill) {
    return (
      <div className="asksky-embed-inline flex h-full min-h-0 max-h-full w-full max-w-none flex-1 flex-col gap-0 overflow-hidden py-0">
        <AskSkyResolveShell
          profileSlug={profileSlug}
          agentToken={agentToken}
          embedKey={embedKey}
          embedFill
          renderContactLeadCapture={renderContactLeadCapture}
          embedAppOrigin={embedAppOrigin}
        />
      </div>
    );
  }

  return (
    <div className="asksky-sky-panel mx-auto min-w-0 w-full max-w-md gap-0 overflow-hidden py-0">
      <AskSkyResolveShell
        profileSlug={profileSlug}
        agentToken={agentToken}
        embedKey={embedKey}
        renderContactLeadCapture={renderContactLeadCapture}
        embedAppOrigin={embedAppOrigin}
      />
    </div>
  );
}

export function AskSkyWidgetCore({
  sky,
  visitorUserBubble,
  theme = "auto",
  ...rest
}: AskSkyWidgetCoreProps) {
  const value = React.useMemo(
    () => ({ sky, visitorUserBubble: visitorUserBubble ?? null }),
    [sky, visitorUserBubble],
  );
  const resolvedTheme = useResolvedAskSkyTheme(theme);
  return (
    <AskSkyRuntimeContext.Provider value={value}>
      <div
        data-asksky-theme={resolvedTheme}
        className={cn(
          "asksky-theme-root min-h-0 min-w-0",
          resolvedTheme === "dark" && "dark",
          rest.embedFill && "flex h-full min-h-0 flex-1 flex-col",
          rest.variant === "chatbot" && "h-full min-h-0 min-w-0",
        )}
      >
        <AskSkyWidgetInner {...rest} />
      </div>
    </AskSkyRuntimeContext.Provider>
  );
}
