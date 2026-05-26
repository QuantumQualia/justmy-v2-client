import * as React from "react";
import { Bot, Loader2, MessageCircle, Mic, Send, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import { ApiClientError } from "./api-client-error";
import type { AskSkySkyTransport, SkyConversationMessage, SkyResolveResponse } from "./sky-types";
import { LinkifiedMessage } from "./linkified-message";
import { useIsMobile } from "./use-is-mobile";
import { cn } from "@workspace/ui/lib/utils";
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

function AgentAvatarThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-600">
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
    const raw = sessionStorage.getItem(storageKey(embedKey));
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
  at?: number;
};

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

const chatScrollClasses =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500";

function AskSkyConversationView({
  resolve,
  profileSlug,
  agentToken,
  embedKey,
  conversationLayout = "inline",
}: {
  resolve: SkyResolveResponse;
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  /** `"panel"` | `"embed"` = flex fill inside a fixed-height shell (chatbot panel or iframe). */
  conversationLayout?: "inline" | "panel" | "embed";
}) {
  const isMobile = useIsMobile();
  const { sky, visitorUserBubble: profile } = useAskSkyRuntime();
  const [messages, setMessages] = React.useState<AskSkyChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState<number | null>(null);
  const [visitorToken, setVisitorToken] = React.useState<string | null>(null);
  const [streamingText, setStreamingText] = React.useState("");
  const [phase, setPhase] = React.useState<"idle" | "streaming">("idle");
  const [banner, setBanner] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const assistantBufferRef = React.useRef("");
  const revealEndRef = React.useRef(0);
  const revealIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  /** Latest resolve for async paths without re-subscribing the hydration effect when the object reference changes. */
  const resolveLatest = React.useRef(resolve);
  resolveLatest.current = resolve;

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

    setMessages([]);
    setConversationId(null);
    setVisitorToken(null);

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
        const history = conv.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        setMessages(mergeGreetingFirst(resolveLatest.current, history));
      } catch {
        if (cancelled) {
          return;
        }
        sessionStorage.removeItem(storageKey(embedKey));
        setConversationId(null);
        setVisitorToken(null);
        setMessages(initialGreetingMessages(resolveLatest.current));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embedKey, sky]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText]);

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

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || phase === "streaming") {
      return;
    }
    setInput("");
    setBanner(null);
    focusMessageInput();
    setMessages((prev) => [...prev, { role: "user", content: trimmed, at: Date.now() }]);
    setPhase("streaming");
    setStreamingText("");
    assistantBufferRef.current = "";
    revealEndRef.current = 0;
    stopWordReveal();

    let assistant = "";
    let refused = false;

    try {
      await sky.streamSkyMessage(
        {
          profileSlug,
          agentToken,
          message: trimmed,
          conversationId: conversationId ?? 0,
          visitorToken: visitorToken ?? "",
        },
        {
          onTextDelta: (d) => {
            assistant += d;
            assistantBufferRef.current = assistant;
            startWordReveal();
          },
          onMeta: (meta) => {
            if (typeof meta.conversationId === "number") {
              setConversationId(meta.conversationId);
            }
            if (meta.visitorToken) {
              setVisitorToken(meta.visitorToken);
            }
            if (typeof meta.conversationId === "number" && meta.visitorToken) {
              persistConversation(embedKey, meta.conversationId, meta.visitorToken);
            }
          },
          onRefusal: () => {
            refused = true;
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

      if (refused || !assistant.trim()) {
        const content =
          assistant.trim() ||
          (refused
            ? "We could not answer that request. Try asking in a different way."
            : "No answer was returned. Please try again.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            refusal: refused,
            at: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: assistant, at: Date.now() }]);
      }
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : "Something went wrong. Please try again.";
      setBanner(msg);
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

  const isEmbedInline = conversationLayout === "embed";
  const isGlassPanel = conversationLayout === "panel";
  const fillsParent = isEmbedInline || isGlassPanel;
  const isGlassChrome = isGlassPanel;

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col ${fillsParent ? "flex-1" : ""}`}
    >
      {banner ? (
        <div
          className={cn(
            "mx-4 mb-3 shrink-0 px-3 py-2 text-sm",
            isEmbedInline
              ? "mx-3 rounded-xl rounded-br-none border border-amber-500/30 bg-amber-500/15 text-amber-100"
              : isGlassChrome
                ? "asksky-glass-banner"
                : "rounded-lg rounded-br-none border border-amber-500/30 bg-amber-500/10 text-amber-200",
          )}
        >
          {banner}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto",
          isEmbedInline
            ? "asksky-embed-messages asksky-glass-scroll-gutter space-y-3 px-3.5 py-3.5"
            : cn(
                "space-y-4 p-4",
                isGlassChrome
                  ? "asksky-glass-body asksky-glass-scroll asksky-glass-scroll-gutter"
                  : cn("bg-slate-900", chatScrollClasses),
              ),
          fillsParent ? "flex min-h-0 flex-col" : "max-h-[min(420px,55vh)] min-h-[360px]",
        )}
      >
        {messages.length === 0 && !streamingText ? (
          <div
            className={`flex flex-col items-center justify-center px-2 text-center ${
              fillsParent ? "min-h-0 flex-1" : "h-full min-h-[300px]"
            }`}
          >
            <div
              className={cn(
                "mb-3 flex h-12 w-12 items-center justify-center rounded-full",
                isEmbedInline
                  ? "asksky-embed-empty-icon"
                  : isGlassChrome
                    ? "asksky-glass-empty-icon"
                    : "bg-blue-600/20",
              )}
            >
              <MessageCircle
                className={cn(
                  "h-6 w-6",
                  isEmbedInline ? "text-zinc-300" : isGlassChrome ? "text-blue-400" : "text-blue-500",
                )}
              />
            </div>
            <h4
              className={cn(
                "mb-1 text-sm font-semibold",
                isEmbedInline
                  ? "asksky-embed-empty-title"
                  : isGlassChrome
                    ? "asksky-glass-empty-title"
                    : "text-white",
              )}
            >
              How can I help you?
            </h4>
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${isEmbedInline ? "" : "gap-2"} ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {!isEmbedInline && m.role === "assistant" ? (
              resolve.photo ? (
                <AgentAvatarThumb src={resolve.photo} alt="" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )
            ) : null}
            <div
              className={cn(
                isEmbedInline
                  ? m.role === "user"
                    ? "asksky-embed-bubble-user"
                    : "asksky-embed-bubble-assistant"
                  : cn(
                      "max-w-[75%] px-4 py-2",
                      m.role === "user"
                        ? isGlassChrome
                          ? "asksky-glass-bubble-user text-white"
                          : "rounded-2xl rounded-br-none bg-blue-600 text-white"
                        : isGlassChrome
                          ? "asksky-glass-bubble-assistant text-slate-100"
                          : "rounded-2xl rounded-br-none bg-slate-800 text-slate-100",
                    ),
              )}
            >
              <LinkifiedMessage
                text={m.content}
                className={
                  isEmbedInline
                    ? m.role === "user"
                      ? "text-zinc-300"
                      : "text-zinc-50"
                    : m.role === "user"
                      ? "text-white"
                      : "text-slate-100"
                }
                linkClassName={
                  isEmbedInline
                    ? "break-all font-medium text-zinc-200 underline decoration-zinc-400/60 underline-offset-2 hover:text-white"
                    : m.role === "user"
                      ? "break-all font-medium text-blue-50 underline decoration-blue-200/70 underline-offset-2 hover:text-white"
                      : "break-all font-medium text-blue-300 underline decoration-blue-400/60 underline-offset-2 hover:text-white"
                }
              />
              {!isEmbedInline && typeof m.at === "number" ? (
                <span
                  className={`mt-1 block text-[10px] ${
                    m.role === "user" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
            </div>
            {!isEmbedInline && m.role === "user" ? (
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
                  isGlassChrome
                    ? "asksky-glass-avatar text-slate-200"
                    : "border border-slate-600 bg-slate-700 text-slate-200",
                )}
              >
                {profile?.photo ? (
                  <img
                    src={profile?.photo}
                    alt={profile?.name || "You"}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-200">
                    {((profile?.name || "U")[0] || "U").toUpperCase()}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {streamingText ? (
          <div className={`flex ${isEmbedInline ? "justify-start" : "gap-2 justify-start"}`}>
            {!isEmbedInline ? (
              resolve.photo ? (
                <AgentAvatarThumb src={resolve.photo} alt="" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )
            ) : null}
            <div
              className={cn(
                isEmbedInline
                  ? "asksky-embed-bubble-assistant"
                  : cn(
                      "max-w-[75%] px-4 py-2 text-slate-100",
                      isGlassChrome ? "asksky-glass-bubble-assistant" : "rounded-2xl rounded-br-none bg-slate-800",
                    ),
              )}
            >
              <LinkifiedMessage
                text={streamingText}
                className={isEmbedInline ? "text-zinc-50" : "text-slate-100"}
                linkClassName={
                  isEmbedInline
                    ? "break-all font-medium text-zinc-200 underline decoration-zinc-400/60 underline-offset-2 hover:text-white"
                    : "break-all font-medium text-blue-300 underline decoration-blue-400/60 underline-offset-2 hover:text-white"
                }
              />
            </div>
          </div>
        ) : null}
      </div>

      <form
        className={cn(
          isEmbedInline ? "asksky-embed-composer" : "border-t p-4",
          !isEmbedInline && isGlassChrome
            ? "asksky-glass-footer"
            : !isEmbedInline
              ? "border-slate-800 bg-slate-950"
              : undefined,
        )}
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
            placeholder="Type your message..."
            rows={1}
            aria-disabled={phase === "streaming"}
            className={cn(
              phase === "streaming" ? "opacity-80" : "",
              isEmbedInline
                ? "asksky-embed-input min-h-[42px] max-h-[120px] min-w-0 flex-1 resize-none px-4 py-2.5 transition-colors scrollbar-hide"
                : isGlassChrome
                  ? "asksky-glass-input min-h-[46px] max-h-[120px] min-w-0 flex-1 resize-none px-4 py-2.5 transition-colors scrollbar-hide"
                  : "min-h-[46px] max-h-[120px] min-w-0 flex-1 resize-none rounded-3xl rounded-br-none border-slate-700 bg-slate-800 px-4 py-2.5 text-white shadow-sm transition-colors placeholder:text-slate-500 focus-visible:border-blue-500",
              !isEmbedInline && !isGlassChrome ? chatScrollClasses : undefined,
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
            disabled={phase === "streaming" || !input.trim()}
            className={cn(
              "h-11 w-11 shrink-0 rounded-full p-0",
              isEmbedInline
                ? "asksky-embed-send"
                : "bg-blue-600 text-white hover:bg-blue-700",
            )}
            aria-label="Send message"
          >
            {phase === "streaming" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
  compactHeader,
  embedFill,
  glassChrome,
}: {
  resolve: SkyResolveResponse;
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
  embedFill?: boolean;
  glassChrome?: boolean;
}) {
  return (
    <div className={embedFill ? "flex min-h-0 min-w-0 flex-1 flex-col" : "flex flex-col"}>
      {glassChrome ? null : compactHeader ? (
        <div className="flex min-w-0 items-center gap-2 pb-3">
          {resolve.photo ? (
            <AgentAvatarThumb src={resolve.photo} alt="" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">
              {resolve.agentName.trim() || resolve.name}
            </h3>
            <p className="truncate text-xs text-slate-400">
              {resolve.tagline || resolve.name}
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 border-b px-4 py-3 sm:px-6",
            glassChrome ? "asksky-glass-header" : "border-slate-800 bg-slate-950",
          )}
        >
          {resolve.photo ? (
            <AgentAvatarThumb src={resolve.photo} alt="" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">
              {resolve.agentName.trim() || resolve.name}
            </h3>
            <p
              className={cn(
                "truncate text-xs",
                glassChrome ? "asksky-glass-muted" : "text-slate-400",
              )}
            >
              {resolve.tagline || resolve.name}
            </p>
          </div>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AskSkyConversationView
          resolve={resolve}
          profileSlug={profileSlug}
          agentToken={agentToken}
          embedKey={embedKey}
          conversationLayout={embedFill ? "embed" : "inline"}
        />
      </div>
    </div>
  );
}

function AskSkyChatbotPanel({
  profileSlug,
  agentToken,
  embedKey,
  onClose,
}: {
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  onClose: () => void;
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
        <AskSkyResolveShell profileSlug={profileSlug} agentToken={agentToken} embedKey={embedKey} embedFill />
      </div>
    </div>
  );
}

function AskSkyResolveShell({
  profileSlug,
  agentToken,
  embedKey,
  compactHeader,
  embedFill,
}: {
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
  embedFill?: boolean;
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
      try {
        const data = await sky.skyResolve({ profileSlug, agentToken });
        if (!cancelled) {
          setResolve(data);
        }
      } catch (e) {
        if (!cancelled) {
          setResolveError(e instanceof Error ? e.message : "Could not resolve AskSKY!.");
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
  }, [profileSlug, agentToken, sky]);

  if (loading) {
    return (
      <div
        className={cn(
          embedFill
            ? "flex flex-1 items-center justify-center gap-2 px-6 py-16 text-sm"
            : "flex items-center justify-center gap-2 px-6 py-16 text-sm",
          embedFill ? "asksky-glass-empty-title" : "text-slate-400",
        )}
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
          embedFill
            ? "m-4 flex flex-1 items-center justify-center rounded-lg rounded-br-none border px-3 py-2 text-sm"
            : "m-4 rounded-lg rounded-br-none border px-3 py-2 text-sm",
          "border-red-500/30 bg-red-500/10 text-red-200",
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
      compactHeader={compactHeader}
      embedFill={embedFill}
      glassChrome={Boolean(embedFill)}
    />
  );
}

function AskSkyVoicePlaceholder() {
  return (
    <Card className="mx-auto min-w-0 w-full max-w-2xl border-slate-700 bg-slate-900/60">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-violet-400" />
          <CardTitle className="text-base text-white">Voice line</CardTitle>
        </div>
        <CardDescription className="text-slate-400">Coming soon</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-500">
        Voice-style AskSKY! will let visitors speak naturally with your agent. Audio capture and playback are not
        available in this build.
      </CardContent>
    </Card>
  );
}

export interface AskSkyWidgetCoreProps {
  profileSlug: string;
  agentToken: string;
  variant: AskSkyVariant;
  embedKey: string;
  /** Full width + flex height for `/embed/asksky` iframes. */
  embedFill?: boolean;
  sky: AskSkySkyTransport;
  visitorUserBubble?: VisitorBubble;
}

function AskSkyWidgetInner({
  profileSlug,
  agentToken,
  variant,
  embedKey,
  embedFill,
}: Omit<AskSkyWidgetCoreProps, "sky" | "visitorUserBubble">) {
  const [chatOpen, setChatOpen] = React.useState(false);
  /** After first open, keep the panel mounted while closed so conversation state + `getConversation` are not re-run. */
  const [chatShellMounted, setChatShellMounted] = React.useState(false);

  if (!profileSlug.trim() || !agentToken.trim()) {
    return (
      <Card className="mx-auto min-w-0 w-full max-w-2xl border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-amber-200">
          Configure profile slug and agent token for this AskSKY! block.
        </CardContent>
      </Card>
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
              embedKey={`${embedKey}:chatbot`}
              onClose={() => setChatOpen(false)}
            />
          </div>
        ) : null}
        <button
          type="button"
          className="asksky-chatbot-launcher pointer-events-auto relative pl-2.5 pr-3.5"
          onClick={() => {
            setChatOpen((wasOpen) => {
              if (!wasOpen) {
                setChatShellMounted(true);
              }
              return !wasOpen;
            });
          }}
          aria-expanded={chatOpen}
          aria-label={chatOpen ? "Close AskSKY!" : "Open AskSKY!"}
        >
          <MessageCircle className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
          <span className="text-sm font-semibold tracking-wide">AskSKY!</span>
          {!chatOpen ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white/25 bg-emerald-400" />
          ) : null}
        </button>
      </div>
    );
  }

  if (embedFill) {
    return (
      <div className="asksky-embed-inline flex min-h-0 w-full max-w-none flex-1 flex-col gap-0 overflow-hidden py-0">
        <AskSkyResolveShell
          profileSlug={profileSlug}
          agentToken={agentToken}
          embedKey={embedKey}
          embedFill
        />
      </div>
    );
  }

  return (
    <Card className="mx-auto min-w-0 w-full max-w-md gap-0 overflow-hidden rounded-2xl rounded-br-none border border-slate-800 bg-slate-900 py-0 shadow-2xl">
      <CardContent className="min-w-0 p-0">
        <AskSkyResolveShell profileSlug={profileSlug} agentToken={agentToken} embedKey={embedKey} />
      </CardContent>
    </Card>
  );
}

export function AskSkyWidgetCore({ sky, visitorUserBubble, ...rest }: AskSkyWidgetCoreProps) {
  const value = React.useMemo(
    () => ({ sky, visitorUserBubble: visitorUserBubble ?? null }),
    [sky, visitorUserBubble],
  );
  return (
    <AskSkyRuntimeContext.Provider value={value}>
      <AskSkyWidgetInner {...rest} />
    </AskSkyRuntimeContext.Provider>
  );
}
