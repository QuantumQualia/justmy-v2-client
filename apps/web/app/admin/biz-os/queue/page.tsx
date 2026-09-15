"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import {
  bizOsService,
  type BizOsQueueRow,
  type BizOsQueueTicket,
} from "@/lib/services/biz-os";
import { ApiClientError } from "@/lib/api-client";
import { QueueTicketPanel } from "@/components/admin/biz-os/queue-ticket-panel";
import { useRealtime } from "@/lib/realtime";

const TABS = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
] as const;

type QueueTab = (typeof TABS)[number]["id"];

function queueTabFromHandoff(status?: unknown): QueueTab | null {
  if (status === "resolved") return "resolved";
  if (status === "active") return "in_progress";
  if (status === "waiting" || status === "open") return "open";
  return null;
}

function statusLabel(status?: string | null) {
  const value = String(status || "open").replace("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusBadgeClass(status?: string | null) {
  const value = String(status || "open");
  if (value === "resolved") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  if (value === "in_progress") return "border-sky-500/30 bg-sky-500/10 text-sky-700";
  return "border-amber-500/30 bg-amber-500/10 text-amber-800";
}

export default function BizOsAdminQueuePage() {
  const [tab, setTab] = useState<QueueTab>("open");
  const [rows, setRows] = useState<BizOsQueueRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ticket, setTicket] = useState<BizOsQueueTicket | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const rowsRefreshInFlight = useRef(false);

  const loadRows = useCallback(async (status: QueueTab) => {
    setLoading(true);
    setError("");
    try {
      setRows(await bizOsService.adminQueue(status));
    } catch (err) {
      setRows([]);
      setError(err instanceof ApiClientError ? err.message : "Could not load queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRowsSilent = useCallback(async (status: QueueTab) => {
    if (rowsRefreshInFlight.current) return;
    rowsRefreshInFlight.current = true;
    try {
      setRows(await bizOsService.adminQueue(status));
    } catch {
      /* keep the current list */
    } finally {
      rowsRefreshInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void loadRows(tab);
  }, [tab, loadRows]);

  useRealtime({
    topics: ["funcrew.queue", selectedId ? `funcrew.handoff.${selectedId}` : null],
    onEvent: (event) => {
      if (event.type !== "funcrew.message") return;
      const handoffId = Number(event.payload?.handoffId);
      const log = event.payload?.log as
        | { id: number; senderType?: string; senderName?: string | null; messageText: string; createdAt: string }
        | undefined;
      const nextStatus = queueTabFromHandoff(event.payload?.status);
      if (Number.isFinite(handoffId) && log?.id) {
        setTicket((current) => {
          if (!current || current.id !== handoffId) return current;
          const logs = current.plan?.logs || [];
          if (logs.some((row) => row.id === log.id)) return current;
          return {
            ...current,
            supportStatus: nextStatus || current.supportStatus,
            latestLog: {
              senderName: log.senderType === "team" ? "#FunCREW" : log.senderName,
              messageText: log.messageText,
              createdAt: String(log.createdAt),
            },
            plan: current.plan
              ? { ...current.plan, logs: [...logs, { ...log, senderType: log.senderType || "team", createdAt: String(log.createdAt) }] }
              : current.plan,
          };
        });
      }
      void refreshRowsSilent(tab);
    },
  });

  useEffect(() => {
    if (selectedId == null) {
      setTicket(null);
      setReply("");
      return;
    }
    setReply("");
    let cancelled = false;
    setTicketLoading(true);
    void bizOsService
      .adminQueueTicket(selectedId)
      .then((data) => {
        if (!cancelled) setTicket(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : "Could not load ticket.");
        }
      })
      .finally(() => {
        if (!cancelled) setTicketLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function updateTicket(body: { supportStatus?: string; message?: string }) {
    if (selectedId == null) return;
    setSaving(true);
    setError("");
    try {
      const next = await bizOsService.adminUpdateQueue(selectedId, body);
      setTicket(next);
      setReply("");
      const nextStatus = (next.supportStatus || "open") as QueueTab;
      if (nextStatus !== tab && TABS.some((t) => t.id === nextStatus)) {
        setTab(nextStatus);
      } else {
        await loadRows(tab);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function briefTicket() {
    if (selectedId == null) return;
    setSaving(true);
    setError("");
    try {
      setTicket(await bizOsService.adminQueueBrief(selectedId));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not ask Sky for a brief.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-var(--impersonation-banner-h,0px)-var(--news-header-h,4rem))] flex-col overflow-hidden bg-background px-6 py-5 text-foreground lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight">SmartHandoff</h1>
          <p className="text-sm text-muted-foreground">
            #FunCREW battle plan assists. Open a row for Sky’s overview, the checklist, and this thread.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-muted p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setTab(item.id);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
                  tab === item.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] xl:overflow-hidden">
          <div className="flex min-h-[18rem] flex-col overflow-hidden rounded-2xl border border-border bg-card xl:min-h-0">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-card/95 text-muted-foreground backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 font-medium">Business</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const active = r.id === selectedId;
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "cursor-pointer border-t border-border/80 transition-colors duration-150",
                          active
                            ? "bg-sidebar-accent shadow-[inset_3px_0_0_0_var(--foreground)]"
                            : "hover:bg-muted/80",
                        )}
                        onClick={() => setSelectedId(r.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{r.businessName}</p>
                          <p className="text-xs text-muted-foreground">
                            {[r.zipCode, r.email].filter(Boolean).join(" · ") || "No contact"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{r.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {r.latestLog?.messageText || "No notes yet"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusBadgeClass(r.supportStatus)}>
                            {statusLabel(r.supportStatus)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {loading ? (
                <p className="px-4 py-8 text-center text-muted-foreground">Loading…</p>
              ) : null}
              {!loading && rows.length === 0 && !error ? (
                <p className="px-4 py-8 text-center text-muted-foreground">No tickets in this tab.</p>
              ) : null}
            </div>
          </div>

          <QueueTicketPanel
            selectedId={selectedId}
            ticket={ticket}
            loading={ticketLoading}
            saving={saving}
            reply={reply}
            onReplyChange={setReply}
            onUpdate={(body) => void updateTicket(body)}
            onBrief={() => void briefTicket()}
          />
        </div>
      </div>
    </div>
  );
}
