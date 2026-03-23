"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { ConfirmDeletionModal } from "@/components/common/confirm-deletion-modal";
import { PostEditorDialog } from "@/components/content/post-editor-dialog";
import { cmsService, type PayloadPost } from "@/lib/services/cms";
import {
  contentService,
  resolveContentNumericId,
  type ContentHubResponseDto,
} from "@/lib/services/content";
import { contentQueryKeys, firstSortedTab } from "@/lib/query/content-query-keys";

const DEFAULT_HUB_TITLE = "My Content Hub";
const DEFAULT_TAB_TITLE = "My Contents";
const TAB_POSTS_PAGE_SIZE = 20;

function toNumericPostId(id: number | string | null | undefined): number | null {
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return null;
}

export function ContentHubLiteView() {
  const queryClient = useQueryClient();
  const [tabName, setTabName] = React.useState("");
  const [tabNameDialogOpen, setTabNameDialogOpen] = React.useState(false);
  const [postStatusFilter, setPostStatusFilter] = React.useState<"draft" | "publish" | "archive">(
    "publish"
  );

  const [postEditorOpen, setPostEditorOpen] = React.useState(false);
  const [postEditorMode, setPostEditorMode] = React.useState<"create" | "edit">("create");
  const [postEditorPostId, setPostEditorPostId] = React.useState<string | undefined>();
  const [confirmDeletePostId, setConfirmDeletePostId] = React.useState<number | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(true);

  const tabNameRef = React.useRef(tabName);
  tabNameRef.current = tabName;

  const hubsQuery = useQuery({
    queryKey: contentQueryKeys.hubsCurrent(),
    queryFn: () => contentService.getCurrentProfileHubs(),
  });

  const hub = hubsQuery.data?.[0] ?? null;
  const tab = React.useMemo(() => firstSortedTab(hub), [hub]);

  React.useEffect(() => {
    if (tabNameDialogOpen) return;
    setTabName(firstSortedTab(hub)?.title ?? "");
  }, [hub, tabNameDialogOpen]);

  const tabId = resolveContentNumericId(tab?.id);
  const postsQuery = useQuery({
    queryKey:
      tabId != null
        ? contentQueryKeys.tabPosts(tabId, postStatusFilter)
        : ([...contentQueryKeys.all, "tabPosts", "idle", postStatusFilter] as const),
    queryFn: () =>
      contentService.getTabPosts(tabId!, {
        page: 1,
        limit: TAB_POSTS_PAGE_SIZE,
        status: postStatusFilter,
      }),
    enabled: tabId != null,
  });

  const ensureLiteHubMutation = useMutation({
    mutationFn: async (requestedTabTitle?: string) => {
      const hubs = queryClient.getQueryData<ContentHubResponseDto[]>(contentQueryKeys.hubsCurrent());
      let ensuredHub = hubs?.[0];
      const normalizedTabTitle =
        requestedTabTitle?.trim() ||
        tabNameRef.current.trim() ||
        DEFAULT_TAB_TITLE;

      if (!ensuredHub) {
        ensuredHub = await contentService.createHub({
          title: DEFAULT_HUB_TITLE,
          description: null,
        });
      }

      const firstTab = firstSortedTab(ensuredHub);
      if (!firstTab) {
        await contentService.createTab(ensuredHub.id, { title: normalizedTabTitle });
      } else if (requestedTabTitle !== undefined && firstTab.title !== normalizedTabTitle) {
        await contentService.updateTab(firstTab.id, { title: normalizedTabTitle });
      }

      return contentService.getHubById(ensuredHub.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contentQueryKeys.hubsCurrent() });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async ({ tabId, postId }: { tabId: number; postId: number }) => {
      await contentService.deleteTabPost(tabId, postId);
      await cmsService.deletePost(String(postId));
    },
    onSuccess: (_, { tabId }) => {
      void queryClient.invalidateQueries({ queryKey: contentQueryKeys.tabPostsRoot(tabId) });
    },
  });

  const saving = ensureLiteHubMutation.isPending || deletePostMutation.isPending;
  const loadingHub = hubsQuery.isPending;
  const loadingPosts = Boolean(tabId != null && postsQuery.isFetching);

  React.useEffect(() => {
    if (hubsQuery.isError) {
      console.error("Failed to load content hub lite data:", hubsQuery.error);
      toast.error("Failed to load content");
    }
  }, [hubsQuery.isError, hubsQuery.error]);

  const handleSaveTabName = async () => {
    const nextName = tabName.trim();
    if (!nextName) return;
    try {
      await ensureLiteHubMutation.mutateAsync(nextName);
      setTabNameDialogOpen(false);
      toast.success("Tab name updated");
    } catch (error) {
      console.error("Failed to update tab name:", error);
      toast.error("Failed to update tab name");
    }
  };

  const openCreateSharedPost = () => {
    setPostEditorMode("create");
    setPostEditorPostId(undefined);
    setPostEditorOpen(true);
  };

  const handlePostSaved = async (post: PayloadPost) => {
    if (postEditorMode !== "create") {
      if (tabId != null) {
        void queryClient.invalidateQueries({ queryKey: contentQueryKeys.tabPostsRoot(tabId) });
      }
      return;
    }
    const postId = toNumericPostId(post.id);
    if (postId === null) return;

    try {
      const refreshed = await ensureLiteHubMutation.mutateAsync(undefined);
      const newTab = firstSortedTab(refreshed);
      if (!newTab) {
        toast.error("Failed to locate tab");
        return;
      }
      await contentService.addPostToTab(newTab.id, { postId });
      const newTabId = resolveContentNumericId(newTab.id);
      if (newTabId != null) {
        void queryClient.invalidateQueries({ queryKey: contentQueryKeys.tabPostsRoot(newTabId) });
      }
      setPostEditorMode("edit");
      setPostEditorPostId(String(postId));
    } catch (error) {
      console.error("Failed to add shared post to lite tab:", error);
      toast.error("Post created but failed to add to tab");
    }
  };

  const handleDeletePost = async () => {
    if (!tab || confirmDeletePostId == null) return;
    try {
      await deletePostMutation.mutateAsync({
        tabId: tab.id,
        postId: confirmDeletePostId,
      });
      toast.success("Post deleted");
      setConfirmDeletePostId(null);
    } catch (error) {
      console.error("Failed to delete post in lite view:", error);
      toast.error("Failed to delete post");
      throw error;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <PostEditorDialog
        open={postEditorOpen}
        onOpenChange={setPostEditorOpen}
        mode={postEditorMode}
        editPostId={postEditorPostId}
        initialPostType="shared-from-url"
        keepOpenAfterCreate
        onSaved={handlePostSaved}
      />

      <ConfirmDeletionModal
        open={confirmDeletePostId !== null}
        onOpenChange={(open) => {
          if (!open && !deletePostMutation.isPending) {
            setConfirmDeletePostId(null);
          }
        }}
        loading={deletePostMutation.isPending}
        title="Delete shared post"
        description="Delete this shared post permanently?"
        confirmText="Delete"
        loadingConfirmText="Deleting..."
        onConfirm={handleDeletePost}
      />

      <Dialog
        open={tabNameDialogOpen}
        onOpenChange={(open) => {
          if (!saving) setTabNameDialogOpen(open);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-0"
        >
          <div className="border-b border-slate-700 px-5 py-4">
            <DialogTitle className="text-slate-100">Edit tab title</DialogTitle>
          </div>
          <div className="space-y-3 px-5 py-4">
            <Input
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              placeholder="Tab title"
              className="h-9 rounded-md border-slate-600 bg-slate-950 text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && tabName.trim() && !saving) {
                  e.preventDefault();
                  void handleSaveTabName();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-700 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTabNameDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="success"
              onClick={() => void handleSaveTabName()}
              disabled={saving || !tabName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 py-0 shadow-lg shadow-black/20">
        <CardHeader className="border-b border-slate-700/70 bg-slate-900/90 pt-3 !pb-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="truncate text-base text-slate-100">
                {tab?.title || "My Contents"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-300 hover:text-white"
                onClick={() => setTabNameDialogOpen(true)}
                title="Edit tab title"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-white"
              onClick={() => setIsExpanded((v) => !v)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded ? (
          <CardContent className="space-y-4 bg-slate-900/40 p-4 pt-0">
            <div className="flex justify-end">
              <Button
                variant="success"
                size="icon"
                className="rounded-full"
                onClick={() => void openCreateSharedPost()}
                disabled={saving}
                title="Add shared post"
                aria-label="Add shared post"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 p-1">
              <div className="grid grid-cols-3 gap-1">
                {(["draft", "publish", "archive"] as const).map((status) => {
                  const isActive = postStatusFilter === status;
                  const activeClass =
                    status === "publish"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                      : status === "draft"
                        ? "bg-amber-500/15 text-amber-300 border border-amber-400/30"
                        : "bg-slate-400/15 text-slate-200 border border-slate-400/30";
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPostStatusFilter(status)}
                      className={`h-8 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        isActive
                          ? activeClass
                          : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingHub ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading content...
              </div>
            ) : loadingPosts ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading posts...
              </div>
            ) : (postsQuery.data?.docs.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm text-slate-300">
                No {postStatusFilter} posts yet. Click the add button to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {postsQuery.data?.docs.map((item) => (
                  <div
                    key={item.postId}
                    className="flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-950/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {item.post?.title ?? `Post #${item.postId}`}
                      </p>
                      <p className="truncate text-xs text-slate-400">{item.post?.slug ? `/${item.post.slug}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:bg-slate-800 hover:text-white"
                        onClick={() => {
                          setPostEditorMode("edit");
                          setPostEditorPostId(String(item.postId));
                          setPostEditorOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:bg-slate-800 hover:text-destructive"
                        onClick={() => setConfirmDeletePostId(item.postId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
