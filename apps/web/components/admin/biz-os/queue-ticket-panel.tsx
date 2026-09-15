"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Circle,
  ExternalLink,
  Globe,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  RotateCcw,
  Send,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { BizOsQueueTicket } from "@/lib/services/biz-os";
import { publicMycardUrl } from "@/lib/mycard/public-url";

function statusLabel(status?: string | null) {
  const value = String(status || "open").replace("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusBadgeClass(status?: string | null) {
  const value = String(status || "open");
  if (value === "resolved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  }
  if (value === "in_progress") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-800";
}

function hrefWithProtocol(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isSystemLog(log: { senderType?: string; messageText?: string }) {
  return log.senderType === "system" || Boolean(log.messageText?.startsWith("[System]"));
}

function isSkyLog(log: { senderType?: string; senderName?: string | null }) {
  const type = (log.senderType || "").toLowerCase();
  const name = (log.senderName || "").toLowerCase();
  return type === "asksky" || name.includes("sky");
}

function speakerLabel(log: { senderType?: string; senderName?: string | null }) {
  if (log.senderType === "team") return "#FunCREW";
  if (isSkyLog(log)) return "Sky";
  return log.senderName || "Owner";
}

function isOverviewDump(messageText?: string | null, overview?: string | null) {
  const text = String(messageText || "")
    .replace(/^\[System\]\s*/, "")
    .trim();
  if (!text) return false;
  const brief = String(overview || "").trim();
  if (brief && text === brief) return true;
  return /^Battle Plan:/m.test(text) && /\nChecklist:/m.test(text) && /\nRecent owner \/ Sky turns:/m.test(text);
}

export function QueueTicketPanel({
  selectedId,
  ticket,
  loading,
  saving,
  reply,
  onReplyChange,
  onUpdate,
  onBrief,
}: {
  selectedId: number | null;
  ticket: BizOsQueueTicket | null;
  loading: boolean;
  saving: boolean;
  reply: string;
  onReplyChange: (value: string) => void;
  onUpdate: (body: { supportStatus?: string; message?: string }) => void;
  onBrief?: () => void;
}) {
  const threadRef = useRef<HTMLDivElement>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const status = ticket?.supportStatus || "open";
  const progress = ticket?.plan?.progress ?? 0;
  const initial = (ticket?.businessName || "?").trim().slice(0, 1).toUpperCase();
  const logs = (ticket?.plan?.logs || []).filter((log) => !isOverviewDump(log.messageText, ticket?.skyOverview));

  useEffect(() => {
    if (briefOpen) return;
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [ticket?.id, logs.length, briefOpen]);

  useEffect(() => {
    if (!briefOpen) return;
    const el = threadRef.current;
    if (el) el.scrollTop = 0;
  }, [briefOpen, ticket?.skyOverview]);

  return (
    <aside className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-card xl:min-h-0">
      {selectedId == null ? (
        <EmptyState />
      ) : loading && !ticket ? (
        <LoadingState />
      ) : !ticket ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          Ticket not found.
        </div>
      ) : (
        <>
          <header className="shrink-0 border-b border-border px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent text-sm font-semibold text-foreground">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-semibold leading-tight">{ticket.businessName}</h2>
                  <Badge variant="outline" className={statusBadgeClass(status)}>
                    {statusLabel(status)}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{ticket.title}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {status !== "in_progress" && status !== "resolved" ? (
                <Button size="sm" disabled={saving} onClick={() => onUpdate({ supportStatus: "in_progress" })}>
                  Start work
                </Button>
              ) : null}
              {status !== "resolved" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-muted hover:text-foreground"
                  disabled={saving}
                  onClick={() => onUpdate({ supportStatus: "resolved" })}
                >
                  <Check className="h-3.5 w-3.5" />
                  Resolve
                </Button>
              ) : (
                <Button size="sm" disabled={saving} onClick={() => onUpdate({ supportStatus: "open" })}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reopen
                </Button>
              )}
              {onBrief ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-muted hover:text-foreground"
                  disabled={saving}
                  onClick={() => {
                    setBriefOpen(true);
                    onBrief();
                  }}
                >
                  Ask Sky for a brief
                </Button>
              ) : null}
            </div>
          </header>

          <button
            type="button"
            className="flex w-full shrink-0 items-center justify-between border-b border-border px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            onClick={() => setBriefOpen((open) => !open)}
          >
            Brief & checklist
            <ChevronDown className={cn("h-4 w-4 transition-transform", briefOpen ? "rotate-0" : "-rotate-90")} />
          </button>

          <div
            ref={threadRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            {briefOpen ? (
              <div className="space-y-4 border-b border-border px-5 py-4">
                <ContactRow ticket={ticket} />

                  {ticket.primaryGoal || ticket.plan?.primaryGoal ? (
                    <p className="text-xs text-muted-foreground">
                      Goal · {ticket.primaryGoal || ticket.plan?.primaryGoal}
                    </p>
                  ) : null}

                  {ticket.skyOverview ? (
                    <section>
                      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sky overview
                      </h3>
                      <p className="whitespace-pre-wrap rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm leading-relaxed">
                        {ticket.skyOverview}
                      </p>
                    </section>
                  ) : null}

                  {ticket.plan?.description ? (
                    <p className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                      {ticket.plan.description}
                    </p>
                  ) : null}

                  {ticket.plan?.tasks?.length ? (
                    <section>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Battle Plan
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {ticket.openTaskCount} open · {progress}%
                        </span>
                      </div>
                      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width]"
                          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                      </div>
                      <ul className="space-y-1.5">
                        {ticket.plan.tasks.map((task) => {
                          const done = task.status === "completed";
                          return (
                            <li
                              key={task.id}
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm",
                                done
                                  ? "border-transparent bg-muted/30 text-muted-foreground"
                                  : "border-border/80 bg-background text-foreground",
                              )}
                            >
                              {done ? (
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              ) : (
                                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className={done ? "line-through decoration-muted-foreground/60" : ""}>
                                {task.taskText}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}

            <div className="space-y-2.5 px-4 py-3">
              {logs.length ? (
                logs.map((log) => {
                  const system = isSystemLog(log);
                  const team = log.senderType === "team";
                  const sky = !team && !system && isSkyLog(log);
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "flex",
                        system && "justify-center",
                        team && "justify-end",
                        !team && !system && "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          system && "max-w-full border border-dashed border-border bg-transparent text-center text-muted-foreground",
                          team && "bg-emerald-600 text-white",
                          sky && "bg-slate-100 text-slate-800",
                          !team && !system && !sky && "bg-muted text-foreground",
                        )}
                      >
                        {!system ? (
                          <div className="mb-0.5 flex items-baseline justify-between gap-3">
                            <p
                              className={cn(
                                "text-[11px] font-semibold",
                                team ? "text-emerald-100" : "text-muted-foreground",
                                sky && "text-slate-500",
                              )}
                            >
                              {speakerLabel(log)}
                            </p>
                            {log.createdAt ? (
                              <time
                                className={cn(
                                  "shrink-0 text-[10px]",
                                  team ? "text-emerald-100/80" : "text-muted-foreground",
                                )}
                              >
                                {new Date(log.createdAt).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </time>
                            ) : null}
                          </div>
                        ) : null}
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {log.messageText.replace(/^\[System\]\s*/, "")}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  No notes yet. Your reply stays on this #FunCREW thread — not the owner’s main chat.
                </p>
              )}
            </div>
          </div>

          <form
            className="shrink-0 border-t border-border bg-card px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reply.trim()) return;
              onUpdate({ message: reply });
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                className="max-h-36 min-h-11 flex-1 resize-y rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30"
                rows={2}
                value={reply}
                onChange={(e) => onReplyChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!reply.trim() || saving) return;
                    onUpdate({ message: reply });
                  }
                }}
                placeholder="Reply as #FunCREW…"
              />
              <Button type="submit" size="icon" className="mb-0.5 shrink-0" disabled={saving || !reply.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Visible to the owner on the assist thread only. Enter to send.
            </p>
          </form>
        </>
      )}
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Select a ticket</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Open a row to see Sky’s overview, the checklist, and this assist thread.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading ticket…
    </div>
  );
}

function ContactRow({ ticket }: { ticket: BizOsQueueTicket }) {
  const items = [
    ticket.email
      ? {
          key: "email",
          href: `mailto:${ticket.email}`,
          label: ticket.email,
          icon: Mail,
          external: false,
        }
      : null,
    ticket.zipCode
      ? { key: "zip", href: null, label: ticket.zipCode, icon: MapPin, external: false }
      : null,
    ticket.slug
      ? {
          key: "card",
          href: publicMycardUrl(ticket.slug) || `/${ticket.slug}`,
          label: "myCARD",
          icon: ExternalLink,
          external: true,
        }
      : null,
    ticket.profile?.website
      ? {
          key: "web",
          href: hrefWithProtocol(ticket.profile.website),
          label: "Website",
          icon: Globe,
          external: true,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    href: string | null;
    label: string;
    icon: typeof Mail;
    external: boolean;
  }>;

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const className =
          "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-foreground";
        if (!item.href) {
          return (
            <span key={item.key} className={className}>
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.label}</span>
            </span>
          );
        }
        if (item.external && item.href.startsWith("/")) {
          return (
            <Link key={item.key} href={item.href} target="_blank" className={className}>
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        }
        return (
          <a
            key={item.key}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
            className={className}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}
