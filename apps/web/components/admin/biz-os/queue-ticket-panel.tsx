"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Check,
  Circle,
  ExternalLink,
  Globe,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  RotateCcw,
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
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (value === "in_progress") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

function hrefWithProtocol(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isSystemLog(log: { senderType?: string; messageText?: string }) {
  return log.senderType === "system" || Boolean(log.messageText?.startsWith("[System]"));
}

export function QueueTicketPanel({
  selectedId,
  ticket,
  loading,
  saving,
  reply,
  onReplyChange,
  onUpdate,
}: {
  selectedId: number | null;
  ticket: BizOsQueueTicket | null;
  loading: boolean;
  saving: boolean;
  reply: string;
  onReplyChange: (value: string) => void;
  onUpdate: (body: { supportStatus?: string; message?: string }) => void;
}) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const status = ticket?.supportStatus || "open";
  const progress = ticket?.plan?.progress ?? 0;
  const initial = (ticket?.businessName || "?").trim().slice(0, 1).toUpperCase();

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [ticket?.id, ticket?.plan?.logs?.length]);

  return (
    <aside className="flex min-h-[36rem] flex-col overflow-hidden rounded-xl border border-border bg-card xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]">
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
          <header className="border-b border-border px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-semibold text-emerald-300">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold leading-tight">{ticket.businessName}</h2>
                  <Badge variant="outline" className={statusBadgeClass(status)}>
                    {statusLabel(status)}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{ticket.title}</p>
                {ticket.primaryGoal || ticket.plan?.primaryGoal ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Goal · {ticket.primaryGoal || ticket.plan?.primaryGoal}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {status !== "in_progress" && status !== "resolved" ? (
                <Button size="sm" disabled={saving} onClick={() => onUpdate({ supportStatus: "in_progress" })}>
                  Start work
                </Button>
              ) : null}
              {status !== "resolved" ? (
                <Button
                  size="sm"
                  variant="outline"
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
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <ContactRow ticket={ticket} />

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
                    className="h-full rounded-full bg-emerald-400 transition-[width]"
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
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
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

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conversation
              </h3>
              <div className="space-y-2">
                {ticket.plan?.logs?.length ? (
                  ticket.plan.logs.map((log) => {
                    const system = isSystemLog(log);
                    const team = log.senderType === "team";
                    return (
                      <div
                        key={log.id}
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm",
                          system && "border border-dashed border-border bg-transparent text-muted-foreground",
                          team && !system && "border border-emerald-500/20 bg-emerald-500/10",
                          !team && !system && "border border-border bg-muted/60",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p
                            className={cn(
                              "text-[11px] font-semibold",
                              team && !system ? "text-emerald-300" : "text-muted-foreground",
                            )}
                          >
                            {log.senderName || (team ? "JustMy Team" : "Owner")}
                          </p>
                          {log.createdAt ? (
                            <time className="shrink-0 text-[11px] text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </time>
                          ) : null}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-foreground">
                          {log.messageText.replace(/^\[System\]\s*/, "")}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    No notes yet. Your reply will show on the owner’s Battle Plan log.
                  </p>
                )}
                <div ref={logEndRef} />
              </div>
            </section>
          </div>

          <form
            className="border-t border-border bg-card px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reply.trim()) return;
              onUpdate({ message: reply });
            }}
          >
            <textarea
              className="min-h-[5.5rem] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-emerald-500"
              value={reply}
              onChange={(e) => onReplyChange(e.target.value)}
              placeholder="Reply as JustMy Team…"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">Visible to the business owner on their plan.</p>
              <Button type="submit" size="sm" disabled={saving || !reply.trim()}>
                {saving ? "Sending…" : "Send reply"}
              </Button>
            </div>
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
          Open a row to see the Battle Plan, contact the owner, and reply as JustMy Team.
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
          "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:border-emerald-500/40 hover:text-foreground";
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
