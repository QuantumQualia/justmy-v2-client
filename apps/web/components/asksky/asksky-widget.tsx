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

export type AskSkyVariant = "inline" | "voice" | "chatbot";

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

function RetrievedDocsSummary({ docs }: { docs: unknown[] }) {
  if (!docs.length) {
    return null;
  }
  return (
    <details className="mt-2 rounded-lg border border-slate-700/80 bg-slate-900/60 text-xs text-slate-400">
      <summary className="cursor-pointer select-none px-2 py-1.5 text-slate-300 hover:text-slate-100">
        Sources ({docs.length})
      </summary>
      <ul className="max-h-40 list-disc space-y-1 overflow-y-auto px-5 pb-2">
        {docs.map((doc, i) => (
          <li key={i} className="break-words">
            {typeof doc === "object" && doc !== null && "title" in doc && typeof (doc as { title?: string }).title === "string"
              ? (doc as { title: string }).title
              : JSON.stringify(doc)}
          </li>
        ))}
      </ul>
    </details>
  );
}

type AskSkyChatMessage = Pick<SkyConversationMessage, "role" | "content" | "retrievedDocs"> & {
  refusal?: boolean;
  at?: number;
};

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
  /** `"panel"` = flex fill inside fixed-height shell (floating chatbot). */
  conversationLayout?: "inline" | "panel";
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
            retrievedDocs: m.retrievedDocs,
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

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || phase === "streaming") {
      return;
    }
    setInput("");
    setBanner(null);
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
    }
  };

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col ${conversationLayout === "panel" ? "flex-1" : ""}`}
    >
      {banner ? (
        <div className="mx-4 mb-3 shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {banner}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={`flex-1 space-y-4 overflow-y-auto p-4 ${chatScrollClasses} ${
          conversationLayout === "panel"
            ? "min-h-0"
            : "max-h-[min(420px,55vh)] min-h-[360px]"
        }`}
      >
        {messages.length === 0 && !streamingText ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-2 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20">
              <MessageCircle className="h-6 w-6 text-blue-400" />
            </div>
            <h4 className="mb-1 text-sm font-semibold text-white">How can I help you?</h4>
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
                  : "rounded-bl-sm bg-slate-800 text-slate-100"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
              {m.retrievedDocs?.length ? <RetrievedDocsSummary docs={m.retrievedDocs} /> : null}
              {typeof m.at === "number" ? (
                <span
                  className={`mt-1 block text-[10px] ${
                    m.role === "user" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
            </div>
            {m.role === "user" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-600 bg-slate-700">
                {profile?.photo ? (
                  <Image
                    src={profile.photo}
                    alt={profile?.name || "You"}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-300">
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
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-2 text-slate-100">
              <p className="whitespace-pre-wrap break-words text-sm">{streamingText}</p>
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="border-t border-slate-800 bg-slate-950 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            disabled={phase === "streaming"}
            className={`min-h-[44px] max-h-[120px] min-w-0 flex-1 resize-none rounded-3xl border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 focus-visible:border-blue-500 ${chatScrollClasses}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button
            type="submit"
            disabled={phase === "streaming" || !input.trim()}
            className="h-10 w-10 shrink-0 rounded-full bg-blue-600 p-0 text-white hover:bg-blue-700"
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
}: {
  resolve: SkyResolveResponse;
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {compactHeader ? (
        <div className="flex min-w-0 items-center gap-2 pb-3">
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
            <h3 className="truncate text-sm font-semibold text-white">{resolve.agentName}</h3>
            <p className="truncate text-xs text-slate-400">{resolve.tagline || resolve.name}</p>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3 sm:px-6">
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
            <h3 className="text-sm font-semibold text-white">AskSKY!</h3>
            <p className="truncate text-xs text-slate-400">{resolve.tagline || resolve.name}</p>
          </div>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AskSkyConversationView resolve={resolve} profileSlug={profileSlug} agentToken={agentToken} embedKey={embedKey} />
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
  const [resolve, setResolve] = React.useState<SkyResolveResponse | null>(null);
  const [resolveError, setResolveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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
    <div className="pointer-events-auto flex h-[min(600px,85dvh)] w-[min(100vw-2rem,24rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl sm:w-[24rem]">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {loading ? (
            <span className="text-sm text-slate-400">Loading…</span>
          ) : resolveError || !resolve ? (
            <span className="min-w-0 text-sm text-red-300">{resolveError || "Unavailable"}</span>
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
                <h3 className="truncate text-sm font-semibold text-white">{resolve.agentName}</h3>
                <p className="truncate text-xs text-slate-400">{resolve.tagline || resolve.name}</p>
              </div>
            </>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 shrink-0 p-0 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-400">
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
}: {
  profileSlug: string;
  agentToken: string;
  embedKey: string;
  compactHeader?: boolean;
}) {
  const [resolve, setResolve] = React.useState<SkyResolveResponse | null>(null);
  const [resolveError, setResolveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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
      <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Connecting to AskSKY…
      </div>
    );
  }

  if (resolveError || !resolve) {
    return (
      <div className="m-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
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
}

export function AskSkyWidget({ profileSlug, agentToken, variant, embedKey }: AskSkyWidgetProps) {
  const [chatOpen, setChatOpen] = React.useState(false);

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
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-slate-900 bg-green-400" />
          ) : null}
        </Button>
      </div>
    );
  }

  return (
    <Card className="mx-auto min-w-0 w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 py-0 shadow-2xl">
      <CardContent className="min-w-0 p-0">
        <AskSkyResolveShell profileSlug={profileSlug} agentToken={agentToken} embedKey={embedKey} />
      </CardContent>
    </Card>
  );
}
