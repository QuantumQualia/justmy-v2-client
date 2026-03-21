"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutGrid, Loader2, Pencil, Plus, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { useProfileStore } from "@/lib/store";
import { profilesService, ApiClientError, type SubProfileSummaryDto } from "@/lib/services/profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { ConfirmDeletionModal } from "@/components/common/confirm-deletion-modal";

/**
 * ContentCard button schema — map roles to Button variants (colors from CSS tokens: --primary, --destructive, --border, …).
 *
 * | Role              | Variant       | Tokens used                          |
 * |-------------------|---------------|--------------------------------------|
 * | Primary CTA       | `default`     | `bg-primary`, `text-primary-foreground` |
 * | Cancel / secondary| `outline`     | `border-border`, `hover:bg-accent`   |
 * | Row: open / edit  | `outline`     | same as secondary                    |
 * | Row / confirm del.| `destructive` | `bg-destructive`, destructive ring   |
 *
 * Brand color for green CTAs: set `.dark { --primary: … }` / `--primary-foreground` in theme (e.g. `packages/ui/src/styles/globals.css`).
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function SubProfilesPanel() {
  const profileId = useProfileStore((s) => s.data.id);
  const parentEmail = useProfileStore((s) => s.data.email);

  const [subProfiles, setSubProfiles] = React.useState<SubProfileSummaryDto[]>([]);
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<SubProfileSummaryDto | null>(null);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<SubProfileSummaryDto | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setName("");
    setSlug("");
    setEmail("");
    setSlugTouched(false);
    setFormError(null);
  }, []);

  const loadList = React.useCallback(async () => {
    if (profileId == null) return;
    setListLoading(true);
    setListError(null);
    try {
      const res = await profilesService.listSubProfiles(profileId);
      setSubProfiles(res.subProfiles ?? []);
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : "Could not load content cards.";
      setListError(msg);
      setSubProfiles([]);
    } finally {
      setListLoading(false);
    }
  }, [profileId]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  React.useEffect(() => {
    if (!slugTouched && name.trim()) {
      setSlug(slugFromName(name));
    }
  }, [name, slugTouched]);

  const openCreate = () => {
    setEditingCard(null);
    resetForm();
    setCreateOpen(true);
  };

  const handleCreateOpenChange = (open: boolean) => {
    if (!open && submitting) return;
    setCreateOpen(open);
    if (!open) resetForm();
  };

  const openEdit = (sp: SubProfileSummaryDto) => {
    setCreateOpen(false);
    setEditingCard(sp);
    setName(sp.name);
    setSlug(sp.slug);
    setEmail("");
    setSlugTouched(true);
    setFormError(null);
  };

  const handleEditOpenChange = (open: boolean) => {
    if (!open && submitting) return;
    if (!open) {
      setEditingCard(null);
      resetForm();
    }
  };

  const validateForm = (): { name: string; slug: string; email?: string } | null => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return null;
    }
    if (!trimmedSlug || !SLUG_PATTERN.test(trimmedSlug)) {
      setFormError("Slug must use letters, numbers, and single hyphens between segments (e.g. east-coast-team).");
      return null;
    }
    const em = email.trim();
    return {
      name: trimmedName,
      slug: trimmedSlug,
      ...(em ? { email: em } : {}),
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileId == null) return;

    setFormError(null);
    const payload = validateForm();
    if (!payload) return;

    setSubmitting(true);
    try {
      await profilesService.createSubProfile(profileId, payload);
      resetForm();
      setCreateOpen(false);
      await loadList();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Could not create content card.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileId == null || editingCard == null) return;

    setFormError(null);
    const payload = validateForm();
    if (!payload) return;

    setSubmitting(true);
    try {
      const body: { name: string; slug: string; email?: string } = {
        name: payload.name,
        slug: payload.slug,
      };
      if (payload.email) body.email = payload.email;

      await profilesService.updateProfile(editingCard.id, body);
      setEditingCard(null);
      resetForm();
      await loadList();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Could not update content card.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (profileId == null || deleteTarget == null) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await profilesService.deleteSubProfile(deleteTarget.id);
      await loadList();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Could not delete content card.";
      setDeleteError(msg);
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open && deleteLoading) return;
    if (!open) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  };

  if (profileId == null) {
    return (
      <Card className="rounded-2xl rounded-br-none border border-white/15 bg-white/5 backdrop-blur-md">
        <CardContent className="p-6 text-sm text-white/70">
          Select or load a profile to manage content cards.
        </CardContent>
      </Card>
    );
  }

  const publicPath = (s: string) => `/${s}`;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl rounded-br-none border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
            <LayoutGrid className="size-5" aria-hidden />
            ContentCard
          </CardTitle>
          <p className="text-sm text-white/60">
            Linked profiles for departments, locations, or teams—each with its own page at{" "}
            <span className="text-white/80">/your-slug</span>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="default" onClick={openCreate} className="rounded-lg rounded-br-none">
              <Plus className="size-4" aria-hidden />
              Create
            </Button>
          </div>

          {listLoading ? (
            <div className="flex items-center gap-2 py-8 text-white/70">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : listError ? (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {listError}
            </p>
          ) : subProfiles.length === 0 ? (
            <p className="text-sm text-white/60 py-2">No content cards yet. Use Create to add one.</p>
          ) : (
            <ul className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
              {subProfiles.map((sp) => (
                <li
                  key={sp.id}
                  className="flex flex-col gap-3 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white">{sp.name}</div>
                    <div className="text-xs text-white/50 font-mono mt-0.5 truncate">{publicPath(sp.slug)}</div>
                    <span className="mt-1 inline-block text-xs text-white/45">
                      Added{" "}
                      {new Date(sp.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-lg rounded-br-none">
                      <a
                        href={publicPath(sp.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in new tab"
                      >
                        <SquareArrowOutUpRight className="size-3.5" aria-hidden />
                        View
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg rounded-br-none"
                      onClick={() => openEdit(sp)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-lg rounded-br-none"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(sp);
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent
          className="rounded-2xl rounded-br-none border border-slate-700/80 bg-slate-900 p-6 text-white shadow-2xl shadow-black/40 sm:max-w-md"
          onPointerDownOutside={(e) => submitting && e.preventDefault()}
          onEscapeKeyDown={(e) => submitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Create content card</DialogTitle>
            <DialogDescription className="text-slate-400">
              Requires permission on this profile. Leave email blank to use the parent profile&apos;s email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && createOpen && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {formError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="content-card-name" className="text-slate-300">
                Display name
              </Label>
              <Input
                id="content-card-name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="e.g. East Coast Sales"
                className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                disabled={submitting}
                autoComplete="organization"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-card-slug" className="text-slate-300">
                URL slug
              </Label>
              <Input
                id="content-card-slug"
                value={slug}
                onChange={(ev) => {
                  setSlugTouched(true);
                  setSlug(ev.target.value);
                }}
                placeholder="east-coast-sales"
                className="rounded-lg rounded-br-none border-slate-700 bg-black/40 font-mono text-sm text-white placeholder:text-slate-500"
                disabled={submitting}
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-card-email" className="text-slate-300">
                Contact email <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <Input
                id="content-card-email"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder={parentEmail ? parentEmail : "defaults to parent profile"}
                className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                disabled={submitting}
                autoComplete="email"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCreateOpenChange(false)}
                disabled={submitting}
                className="rounded-lg rounded-br-none"
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting} className="rounded-lg rounded-br-none">
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}
                Create content card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingCard != null} onOpenChange={handleEditOpenChange}>
        <DialogContent
          className="rounded-2xl rounded-br-none border border-slate-700/80 bg-slate-900 p-6 text-white shadow-2xl shadow-black/40 sm:max-w-md"
          onPointerDownOutside={(e) => submitting && e.preventDefault()}
          onEscapeKeyDown={(e) => submitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Edit content card</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update display name, URL slug, or contact email. Leave email blank to leave it unchanged on the
              server.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {formError && editingCard != null && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {formError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="content-card-edit-name" className="text-slate-300">
                Display name
              </Label>
              <Input
                id="content-card-edit-name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="e.g. East Coast Sales"
                className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                disabled={submitting}
                autoComplete="organization"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-card-edit-slug" className="text-slate-300">
                URL slug
              </Label>
              <Input
                id="content-card-edit-slug"
                value={slug}
                onChange={(ev) => {
                  setSlugTouched(true);
                  setSlug(ev.target.value);
                }}
                placeholder="east-coast-sales"
                className="rounded-lg rounded-br-none border-slate-700 bg-black/40 font-mono text-sm text-white placeholder:text-slate-500"
                disabled={submitting}
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-card-edit-email" className="text-slate-300">
                Contact email <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <Input
                id="content-card-edit-email"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="Leave blank to keep current"
                className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                disabled={submitting}
                autoComplete="email"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditOpenChange(false)}
                disabled={submitting}
                className="rounded-lg rounded-br-none"
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting} className="rounded-lg rounded-br-none">
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeletionModal
        open={deleteTarget != null}
        onOpenChange={handleDeleteOpenChange}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete content card?"
        description={
          <span>
            This will remove{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.name ?? "this content card"}
            </span>{" "}
            ({deleteTarget ? publicPath(deleteTarget.slug) : ""}). This cannot be undone.
            {deleteError ? (
              <span className="mt-3 block rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {deleteError}
              </span>
            ) : null}
          </span>
        }
        confirmText="Delete"
      />
    </div>
  );
}
