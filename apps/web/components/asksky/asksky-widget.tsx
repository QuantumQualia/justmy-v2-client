"use client";

import * as React from "react";
import Image from "next/image";
import { Bot, Loader2, MessageCircle, Mic, Send, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import { ApiClientError } from "@/lib/api-client";
import {
  skyGetConversation,
  skyResolve,
  streamSkyMessage,
  type SkyConversationMessage,
  type SkyResolveResponse,
} from "@/lib/services/sky";
import { useProfileStore } from "@/lib/store/profile-store";
import { LinkifiedMessage } from "@/components/common/chatbot/linkified-message";
import { cn } from "@workspace/ui/lib/utils";

export type AskSkyVariant = "inline" | "voice" | "chatbot";

export type AskSkyEmbedTheme = "light" | "dark";

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

/** Light embed: header + composer navy (user reference #121a31). */
const SKY_LIGHT_CHROME_BG = "bg-[#121a31] dark:bg-[#121a31]";

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

const chatScrollClasses =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500";

const chatScrollClassesLight =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500";

function AskSkyConversationView({
  resolve,
  profileSlug,
  agentToken,
  embedKey,
  conversationLayout = "inline",
  embedTheme = "dark",
}: {
  resolve: SkyResolveResponse;
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  /** `"panel"` | `"embed"` = flex fill inside a fixed-height shell (chatbot panel or iframe). */
  conversationLayout?: "inline" | "panel" | "embed";
  embedTheme?: AskSkyEmbedTheme;
}) {
  const profile = useProfileStore((s) => s.data);
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

  React.useEffect(() => {
    const saved = loadPersisted(embedKey);
    if (!saved) {
      return;
    }
    setConversationId(saved.conversationId);
    setVisitorToken(saved.visitorToken);
    void (async () => {
      try {
        const conv = await skyGetConversation(saved.conversationId, saved.visitorToken);
        setMessages(
          conv.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        );
      } catch {
        sessionStorage.removeItem(storageKey(embedKey));
        setConversationId(null);
        setVisitorToken(null);
      }
    })();
  }, [embedKey]);

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
      textareaRef.current?.focus();
    });
  }, []);

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
      await streamSkyMessage(
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

  const fillsParent = conversationLayout === "panel" || conversationLayout === "embed";
  const isLight = embedTheme === "light";
  const scrollBarCls = isLight ? chatScrollClassesLight : chatScrollClasses;

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col ${fillsParent ? "flex-1" : ""}`}
    >
      {banner ? (
        <div
          className={cn(
            "mx-4 mb-3 shrink-0 rounded-lg border px-3 py-2 text-sm",
            isLight
              ? "border-amber-600/40 bg-amber-50 text-amber-900"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200",
          )}
        >
          {banner}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 space-y-4 overflow-y-auto p-4",
          scrollBarCls,
          fillsParent ? "flex min-h-0 flex-col" : "max-h-[min(420px,55vh)] min-h-[360px]",
          isLight ? "bg-slate-100 dark:bg-slate-100" : "bg-slate-900",
        )}
      >
        {messages.length === 0 && !streamingText ? (
          <div
            className={`flex flex-col items-center justify-center px-2 text-center ${
              fillsParent ? "min-h-0 flex-1" : "h-full min-h-[300px]"
            }`}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20">
              <MessageCircle className="h-6 w-6 text-blue-500" />
            </div>
            <h4 className={cn("mb-1 text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>
              How can I help you?
            </h4>
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600">
                {resolve.photo ? (
                  <Image src={resolve.photo} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
            ) : null}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "rounded-br-sm bg-blue-600 text-white"
                  : isLight
                    ? "rounded-bl-sm border border-slate-200 bg-white text-slate-900 shadow-sm"
                    : "rounded-bl-sm bg-slate-800 text-slate-100"
              }`}
            >
              <LinkifiedMessage
                text={m.content}
                className={cn(
                  m.role === "user" ? "text-white" : isLight ? "text-slate-900" : "text-slate-100",
                )}
                linkClassName={cn(
                  m.role === "user"
                    ? "break-all font-medium text-blue-50 underline decoration-blue-200/70 underline-offset-2 hover:text-white"
                    : isLight
                      ? "break-all font-medium text-blue-600 underline decoration-blue-500/50 underline-offset-2 hover:text-blue-800"
                      : "break-all font-medium text-blue-300 underline decoration-blue-400/60 underline-offset-2 hover:text-white",
                )}
              />
              {typeof m.at === "number" ? (
                <span
                  className={`mt-1 block text-[10px] ${
                    m.role === "user"
                      ? "text-blue-100"
                      : isLight
                        ? "text-slate-500"
                        : "text-slate-400"
                  }`}
                >
                  {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
            </div>
            {m.role === "user" ? (
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border",
                  isLight
                    ? "border-slate-400 bg-slate-200 text-slate-900"
                    : "border-slate-600 bg-slate-700 text-slate-200",
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
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isLight ? "text-slate-900" : "text-slate-200",
                    )}
                  >
                    {((profile?.name || "U")[0] || "U").toUpperCase()}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {streamingText ? (
          <div className="flex gap-2 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600">
              {resolve.photo ? (
                <Image src={resolve.photo} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2",
                isLight ? "border border-slate-200 bg-white text-slate-900 shadow-sm" : "bg-slate-800 text-slate-100",
              )}
            >
              <LinkifiedMessage
                text={streamingText}
                className={isLight ? "text-slate-900" : "text-slate-100"}
                linkClassName={cn(
                  isLight
                    ? "break-all font-medium text-blue-600 underline decoration-blue-500/50 underline-offset-2 hover:text-blue-800"
                    : "break-all font-medium text-blue-300 underline decoration-blue-400/60 underline-offset-2 hover:text-white",
                )}
              />
            </div>
          </div>
        ) : null}
      </div>

      <form
        className={cn(
          "border-t p-4",
          isLight
            ? cn(SKY_LIGHT_CHROME_BG, "border-t border-white/10")
            : "border-slate-800 bg-slate-950",
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
              "min-h-[46px] max-h-[120px] min-w-0 flex-1 resize-none rounded-3xl px-4 py-2.5 shadow-sm transition-colors",
              scrollBarCls,
              isLight
                ? "border-2 border-white/20 !bg-white text-slate-900 shadow-md shadow-black/20 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400/40 dark:border-white/20 dark:!bg-white dark:text-slate-900 dark:placeholder:text-slate-500"
                : "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-blue-500",
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
            className="h-11 w-11 shrink-0 rounded-full bg-blue-600 p-0 text-white hover:bg-blue-700"
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
  embedTheme = "dark",
}: {
  resolve: SkyResolveResponse;
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
  embedFill?: boolean;
  embedTheme?: AskSkyEmbedTheme;
}) {
  const isLight = embedTheme === "light";
  return (
    <div className={embedFill ? "flex min-h-0 min-w-0 flex-1 flex-col" : "flex flex-col"}>
      {compactHeader ? (
        <div
          className={cn(
            "flex min-w-0 items-center gap-2",
            isLight
              ? cn("rounded-t-2xl border-b border-white/10 px-4 py-3", SKY_LIGHT_CHROME_BG)
              : "pb-3",
          )}
        >
          {resolve.photo ? (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-600">
              <Image src={resolve.photo} alt="" fill className="object-cover" sizes="32px" unoptimized />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">
              {resolve.agentName.trim() || resolve.name}
            </h3>
            <p className={cn("truncate text-xs", isLight ? "text-slate-300" : "text-slate-400")}>
              {resolve.tagline || resolve.name}
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 border-b px-4 py-3 sm:px-6",
            isLight ? cn(SKY_LIGHT_CHROME_BG, "border-b border-white/10") : "border-slate-800 bg-slate-950",
          )}
        >
          {resolve.photo ? (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-600">
              <Image src={resolve.photo} alt="" fill className="object-cover" sizes="32px" unoptimized />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">
              {resolve.agentName.trim() || resolve.name}
            </h3>
            <p className={cn("truncate text-xs", isLight ? "text-slate-300" : "text-slate-400")}>
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
          embedTheme={embedTheme}
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
  embedTheme = "dark",
}: {
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  onClose: () => void;
  embedTheme?: AskSkyEmbedTheme;
}) {
  const [resolve, setResolve] = React.useState<SkyResolveResponse | null>(null);
  const [resolveError, setResolveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const isLight = embedTheme === "light";

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setResolveError(null);
      try {
        const data = await skyResolve({ profileSlug, agentToken });
        if (!cancelled) {
          setResolve(data);
        }
      } catch (e) {
        if (!cancelled) {
          setResolveError(e instanceof Error ? e.message : "Could not resolve AskSKY.");
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
  }, [profileSlug, agentToken]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex h-[min(600px,85dvh)] w-[min(100vw-2rem,24rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:w-[24rem]",
        isLight ? "border border-slate-200 bg-white dark:border-slate-200 dark:bg-white" : "border-slate-800 bg-slate-900",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between border-b px-4 py-3",
          isLight ? cn(SKY_LIGHT_CHROME_BG, "border-b border-white/10") : "border-slate-800 bg-slate-950",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {loading ? (
            <span className={cn("text-sm", isLight ? "text-slate-300" : "text-slate-400")}>Loading…</span>
          ) : resolveError || !resolve ? (
            <span className={cn("min-w-0 text-sm", isLight ? "text-red-300" : "text-red-600")}>
              {resolveError || "Unavailable"}
            </span>
          ) : (
            <>
              {resolve.photo ? (
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-600">
                  <Image src={resolve.photo} alt="" fill className="object-cover" sizes="32px" unoptimized />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">
                  {resolve.agentName.trim() || resolve.name}
                </h3>
                <p className={cn("truncate text-xs", isLight ? "text-slate-300" : "text-slate-400")}>
                  {resolve.tagline || resolve.name}
                </p>
              </div>
            </>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={cn(
            "h-8 w-8 shrink-0 p-0",
            isLight ? "text-slate-200 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white",
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div
            className={cn(
              "flex flex-1 items-center justify-center gap-2 text-sm",
              isLight ? "text-slate-600" : "text-slate-400",
            )}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting…
          </div>
        ) : resolveError || !resolve ? null : (
          <AskSkyConversationView
            resolve={resolve}
            profileSlug={profileSlug}
            agentToken={agentToken}
            embedKey={embedKey}
            conversationLayout="panel"
            embedTheme={embedTheme}
          />
        )}
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
  embedTheme = "dark",
}: {
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
  embedFill?: boolean;
  embedTheme?: AskSkyEmbedTheme;
}) {
  const [resolve, setResolve] = React.useState<SkyResolveResponse | null>(null);
  const [resolveError, setResolveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const isLight = embedTheme === "light";

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setResolveError(null);
      try {
        const data = await skyResolve({ profileSlug, agentToken });
        if (!cancelled) {
          setResolve(data);
        }
      } catch (e) {
        if (!cancelled) {
          setResolveError(e instanceof Error ? e.message : "Could not resolve AskSKY.");
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
  }, [profileSlug, agentToken]);

  if (loading) {
    return (
      <div
        className={cn(
          embedFill
            ? "flex flex-1 items-center justify-center gap-2 px-6 py-16 text-sm"
            : "flex items-center justify-center gap-2 px-6 py-16 text-sm",
          isLight ? "text-slate-600" : "text-slate-400",
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        Connecting to AskSKY…
      </div>
    );
  }

  if (resolveError || !resolve) {
    return (
      <div
        className={cn(
          embedFill
            ? "m-4 flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-sm"
            : "m-4 rounded-lg border px-3 py-2 text-sm",
          isLight
            ? "border-red-300 bg-red-50 text-red-800"
            : "border-red-500/30 bg-red-500/10 text-red-200",
        )}
      >
        {resolveError || "AskSKY is unavailable."}
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
      embedTheme={embedTheme}
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
        Voice-style AskSKY will let visitors speak naturally with your agent. Audio capture and playback are not
        available in this build.
      </CardContent>
    </Card>
  );
}

export interface AskSkyWidgetProps {
  profileSlug: string;
  agentToken: string;
  variant: AskSkyVariant;
  embedKey: string;
  /** Full width + flex height for `/embed/asksky` iframes. */
  embedFill?: boolean;
  /** Light/dark chrome for embed routes (`theme` query param). */
  embedTheme?: AskSkyEmbedTheme;
}

export function AskSkyWidget({
  profileSlug,
  agentToken,
  variant,
  embedKey,
  embedFill,
  embedTheme = "dark",
}: AskSkyWidgetProps) {
  const [chatOpen, setChatOpen] = React.useState(false);
  const isLight = embedTheme === "light";

  if (!profileSlug.trim() || !agentToken.trim()) {
    return (
      <Card className="mx-auto min-w-0 w-full max-w-2xl border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-amber-200">
          Configure profile slug and agent token for this AskSKY block.
        </CardContent>
      </Card>
    );
  }

  if (variant === "voice") {
    return <AskSkyVoicePlaceholder />;
  }

  if (variant === "chatbot") {
    return (
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        {chatOpen ? (
          <AskSkyChatbotPanel
            profileSlug={profileSlug}
            agentToken={agentToken}
            embedKey={`${embedKey}:chatbot`}
            embedTheme={embedTheme}
            onClose={() => setChatOpen(false)}
          />
        ) : null}
        <Button
          type="button"
          size="lg"
          className="pointer-events-auto relative h-14 w-14 rounded-full bg-blue-600 p-0 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          onClick={() => setChatOpen((o) => !o)}
          aria-expanded={chatOpen}
          aria-label={chatOpen ? "Close AskSKY" : "Open AskSKY"}
        >
          <MessageCircle className="h-7 w-7" />
          {!chatOpen ? (
            <span
              className={cn(
                "absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 bg-green-400",
                isLight ? "border-white" : "border-slate-900",
              )}
            />
          ) : null}
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-2xl py-0",
        embedFill
          ? "flex min-h-0 w-full max-w-none flex-1 flex-col"
          : "mx-auto min-w-0 w-full max-w-md shadow-2xl",
        isLight ? "border border-slate-200 bg-white dark:border-slate-200 dark:bg-white" : "border border-slate-800 bg-slate-900",
      )}
    >
      <CardContent className={`min-w-0 p-0 ${embedFill ? "flex min-h-0 flex-1 flex-col" : ""}`}>
        <AskSkyResolveShell
          profileSlug={profileSlug}
          agentToken={agentToken}
          embedKey={embedKey}
          embedFill={embedFill}
          embedTheme={embedTheme}
        />
      </CardContent>
    </Card>
  );
}
