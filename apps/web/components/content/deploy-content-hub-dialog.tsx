"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { useProfileStore } from "@/lib/store";
import { contentService, ApiClientError } from "@/lib/services/content";
import { profilesService, type SubProfileSummaryDto } from "@/lib/services/profiles";

function subProfileNumericId(sp: SubProfileSummaryDto): number | null {
  const n = Number(sp.id);
  return Number.isFinite(n) ? n : null;
}

export interface DeployContentHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hubId: number | null;
  hubTitle: string;
}

export function DeployContentHubDialog({
  open,
  onOpenChange,
  hubId,
  hubTitle,
}: DeployContentHubDialogProps) {
  const parentProfileId = useProfileStore((s) => s.data.id);

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [subProfiles, setSubProfiles] = React.useState<SubProfileSummaryDto[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const [baselineShareTargets, setBaselineShareTargets] = React.useState<Set<number>>(() => new Set());

  const load = React.useCallback(async () => {
    if (hubId == null || parentProfileId == null) return;
    setLoading(true);
    setError(null);
    try {
      const [shares, subs] = await Promise.all([
        contentService.listHubShares(hubId),
        profilesService.listSubProfiles(parentProfileId),
      ]);
      setSubProfiles(subs.subProfiles ?? []);
      const shared = new Set(shares.map((s) => s.targetProfileId));
      setBaselineShareTargets(shared);
      setSelectedIds(new Set(shared));
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : "Could not load deployment data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [hubId, parentProfileId]);

  React.useEffect(() => {
    if (!open || hubId == null) return;
    void load();
  }, [open, hubId, load]);

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setSubProfiles([]);
      setSelectedIds(new Set());
      setBaselineShareTargets(new Set());
    }
  }, [open]);

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (hubId == null) return;
    setSaving(true);
    setError(null);
    try {
      const toAdd: number[] = [];
      const toRemove: number[] = [];
      for (const id of selectedIds) {
        if (!baselineShareTargets.has(id)) toAdd.push(id);
      }
      for (const id of baselineShareTargets) {
        if (!selectedIds.has(id)) toRemove.push(id);
      }
      for (const targetProfileId of toAdd) {
        await contentService.shareHub(hubId, { targetProfileId });
      }
      for (const targetProfileId of toRemove) {
        await contentService.unshareHub(hubId, targetProfileId);
      }
      toast.success("Connections saved.");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : "Could not save connections.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const canInteract = hubId != null && parentProfileId != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 rounded-2xl rounded-br-none border border-slate-700/80 bg-slate-950 p-0 text-slate-100 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">
            Deploy ContentHUB
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg rounded-br-none text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <DialogHeader className="space-y-0 px-5 pb-0 pt-3 text-left">
          <DialogDescription className="text-sm text-slate-400">
            Select the profiles where you want{" "}
            <span className="font-medium text-slate-200">{hubTitle || "this hub"}</span> to appear.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(60vh,22rem)] space-y-2 overflow-y-auto px-5 py-4 custom-scrollbar">
          {!canInteract ? (
            <p className="text-sm text-slate-500">Select a hub and ensure your profile is loaded.</p>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : error && subProfiles.length === 0 ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {error}
            </p>
          ) : subProfiles.length === 0 ? (
            <p className="text-sm text-slate-500">
              No sub-profiles yet. Create content cards under your master profile first.
            </p>
          ) : (
            subProfiles.map((sp) => {
              const nid = subProfileNumericId(sp);
              if (nid == null) return null;
              const checked = selectedIds.has(nid);
              return (
                <div
                  key={sp.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                    checked
                      ? "border-success bg-success/5 ring-1 ring-success/35"
                      : "border-slate-700/90 bg-slate-900/40"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleId(nid)}
                    className="border-slate-600 data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => toggleId(nid)}
                    className="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-success/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    <span className="block truncate text-sm font-medium text-white">{sp.name}</span>
                    <span className="mt-0.5 block truncate font-mono text-xs text-slate-500">/{sp.slug}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {error && subProfiles.length > 0 ? (
          <p className="mx-5 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-800 px-5 py-4 sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            className="rounded-lg rounded-br-none text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="success"
            className="rounded-lg rounded-br-none"
            disabled={saving || loading || !canInteract || hubId == null}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save connections"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
