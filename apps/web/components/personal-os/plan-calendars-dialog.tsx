"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  bizOsService,
  type CalendarProvider,
} from "@/lib/services/biz-os";

export function PlanCalendarsDialog({
  open,
  onOpenChange,
  profileId,
  planId,
  busy,
  onBusyChange,
  onSynced,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: number | string | null;
  planId: number;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSynced: () => Promise<void>;
}) {
  const [appleId, setAppleId] = useState("");
  const [applePass, setApplePass] = useState("");
  const [savingApple, setSavingApple] = useState(false);
  const connectionsQuery = useQuery({
    queryKey: ["biz-os", "calendar-connections", profileId],
    queryFn: () => bizOsService.listCalendarConnections(profileId as number | string),
    enabled: Boolean(open && profileId != null),
    staleTime: 60_000,
  });
  const connections = connectionsQuery.data ?? [];

  async function refreshConnections() {
    await connectionsQuery.refetch();
    await onSynced();
  }

  async function connect(provider: "google_calendar" | "microsoft_calendar") {
    if (!profileId) return;
    const { authUrl } = await bizOsService.connectCalendar(
      profileId,
      provider,
      `/personal-os/plans/${planId}?calendars=1`,
    );
    window.location.assign(authUrl);
  }

  async function saveApple() {
    if (!profileId) return;
    setSavingApple(true);
    try {
      await bizOsService.connectAppleCalendar(profileId, appleId, applePass);
      setApplePass("");
      toast.success("Apple Calendar connected.");
      await refreshConnections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save Apple Calendar.");
    } finally {
      setSavingApple(false);
    }
  }

  async function sync(provider: CalendarProvider) {
    if (!profileId || busy) return;
    onBusyChange(true);
    try {
      const result = await bizOsService.syncPlanCalendar(profileId, planId, provider);
      toast.success(`Wrote ${result.synced} dated steps to the calendar.`);
      await refreshConnections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Calendar sync failed.");
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calendars</DialogTitle>
          <DialogDescription>
            Sync dated steps to a calendar that’s already set up for this workspace.
          </DialogDescription>
        </DialogHeader>
        {connectionsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading calendars…</p>
        ) : connections.length ? (
          <div className="space-y-4">
            {connections.map((row) => (
              <div key={row.provider} className="rounded-2xl border border-slate-200/80 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.connected
                        ? row.accountName
                          ? `Connected · ${row.accountName}`
                          : "Connected"
                        : "Not connected yet"}
                    </p>
                  </div>
                  {row.provider !== "apple_caldav" ? (
                    row.connected ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={busy}
                        onClick={() => void sync(row.provider)}
                      >
                        Sync
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (row.provider === "google_calendar" || row.provider === "microsoft_calendar") {
                            void connect(row.provider);
                          }
                        }}
                      >
                        Connect
                      </Button>
                    )
                  ) : row.connected ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void sync(row.provider)}
                    >
                      Sync
                    </Button>
                  ) : null}
                </div>
                {row.provider === "apple_caldav" && !row.connected ? (
                  <div className="mt-3 space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="apple-id" className="text-xs text-slate-600">
                        Apple ID
                      </Label>
                      <Input
                        id="apple-id"
                        placeholder="name@icloud.com"
                        value={appleId}
                        onChange={(e) => setAppleId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="apple-pass" className="text-xs text-slate-600">
                        App-specific password
                      </Label>
                      <Input
                        id="apple-pass"
                        placeholder="App-specific password"
                        type="password"
                        value={applePass}
                        onChange={(e) => setApplePass(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={savingApple || !appleId.trim() || !applePass.trim()}
                      onClick={() => void saveApple()}
                    >
                      {savingApple ? "Saving…" : "Save Apple Calendar"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No calendars are available on this workspace yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
