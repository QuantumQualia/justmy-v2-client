"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import {
  bizOsService,
  type BizOsQueueRow,
  type BizOsQueueTicket,
} from "@/lib/services/biz-os";
import { ApiClientError } from "@/lib/api-client";
import { QueueTicketPanel } from "@/components/admin/biz-os/queue-ticket-panel";

const TABS = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
] as const;

type QueueTab = (typeof TABS)[number]["id"];

function statusLabel(status?: string | null) {
  const value = String(status || "open").replace("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusBadgeClass(status?: string | null) {
  const value = String(status || "open");
  if (value === "resolved") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (value === "in_progress") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
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

  useEffect(() => {
    void loadRows(tab);
  }, [tab, loadRows]);

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

  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Biz OS support queue</h1>
          <p className="text-muted-foreground">
            FunCrew and Battle Plan requests. Open a row to reply, start work, or resolve.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={tab === item.id ? "default" : "outline"}
              onClick={() => {
                setSelectedId(null);
                setTab(item.id);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {error ? <p className="text-red-400">{error}</p> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Business</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const active = r.id === selectedId;
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "cursor-pointer border-t border-border transition-colors",
                        active ? "bg-emerald-500/10" : "hover:bg-accent/50",
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
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {r.latestLog?.messageText || "No notes yet"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusBadgeClass(r.supportStatus)}>
                          {statusLabel(r.supportStatus)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
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

          <QueueTicketPanel
            selectedId={selectedId}
            ticket={ticket}
            loading={ticketLoading}
            saving={saving}
            reply={reply}
            onReplyChange={setReply}
            onUpdate={(body) => void updateTicket(body)}
          />
        </div>
      </div>
    </div>
  );
}
