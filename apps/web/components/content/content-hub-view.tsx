"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  GripVertical,
  Link2,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import debounce from "lodash/debounce";
import { ApiClientError } from "@/lib/api-client";
import { cmsService } from "@/lib/services/cms";
import type { PayloadPost } from "@/lib/services/cms";
import { ConfirmDeletionModal } from "@/components/common/confirm-deletion-modal";
import { DeployContentHubDialog } from "@/components/content/deploy-content-hub-dialog";
import { PostEditorDialog, type PostType } from "@/components/content/post-editor-dialog";
import { useProfileStore } from "@/lib/store";
import {
  contentService,
  type ContentHubResponseDto,
  type ContentTabResponseDto,
  type PaginatedTabPostsResponseDto,
  type TabPostResponseDto,
} from "@/lib/services/content";

/**
 * Buttons in this view use shadcn `Button` variants only — colors come from theme tokens
 * (`--primary`, `--destructive`, `--muted-foreground`, `--accent`, … in `packages/ui/src/styles/globals.css`).
 * Prefer `default` / `success` / `outline` / `ghost` / `destructive`; avoid raw `bg-*` / `text-*` palette classes on Button.
 */
const TAB_REORDER_DEBOUNCE_MS = 2000;
const TAB_REORDER_MAX_WAIT_MS = 5000;
const TAB_POSTS_PAGE_SIZE = 10;

type ViewerPostOption = {
  id: number;
  title: string;
  slug?: string;
  status?: "draft" | "publish" | "archive";
};

function toNumericPostId(id: number | string | null | undefined): number | null {
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return null;
}

function SortablePostItem({
  item,
  onEdit,
  onRemove,
}: {
  item: TabPostResponseDto;
  onEdit: (postId: number) => void;
  onRemove: (postId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.postId,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const status = item.post?.status ?? "draft";
  const statusColor =
    status === "publish" ? "bg-green-500" : status === "archive" ? "bg-slate-400" : "bg-yellow-500";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg rounded-br-none border border-slate-700 bg-slate-900/60 p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            className="shrink-0 cursor-grab touch-none text-slate-500 hover:text-slate-300 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">
              {item.post?.title ?? `Post #${item.postId}`}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {status === "publish" ? "Published" : status === "archive" ? "Archived" : "Draft"}
              {item.post?.slug ? ` · /${item.post.slug}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {status === "publish" && item.post?.slug ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
              title="Open published post"
            >
              <a
                href={`/blog/${encodeURIComponent(item.post.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item.postId)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Edit post"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.postId)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title="Remove or delete post"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ContentHubView() {
  const allowsSubProfiles = useProfileStore((s) => s.data.allowsSubProfiles === true);

  const [hubs, setHubs] = React.useState<ContentHubResponseDto[]>([]);
  const [selectedHubId, setSelectedHubId] = React.useState<number | null>(null);
  const [selectedTabId, setSelectedTabId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [searchPosts, setSearchPosts] = React.useState("");
  const [debouncedSearchPosts, setDebouncedSearchPosts] = React.useState("");
  const [searchPostResults, setSearchPostResults] = React.useState<ViewerPostOption[]>([]);
  const [searchingPosts, setSearchingPosts] = React.useState(false);
  const [tabPostStatusFilter, setTabPostStatusFilter] = React.useState<
    "all" | "draft" | "publish" | "archive"
  >("all");

  type ConfirmAction =
    | { kind: "hub"; hubId: number }
    | { kind: "tab"; tabId: number }
    | { kind: "post"; postId: number }
    | { kind: "deleteCmsPost"; postId: number };

  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction | null>(null);

  const [hubModalOpen, setHubModalOpen] = React.useState(false);
  const [hubModalMode, setHubModalMode] = React.useState<"create" | "edit">("create");
  const [hubModalHubId, setHubModalHubId] = React.useState<number | null>(null);
  const [hubFormTitle, setHubFormTitle] = React.useState("");
  const [hubFormDescription, setHubFormDescription] = React.useState("");
  const [hubModalSaving, setHubModalSaving] = React.useState(false);

  const [tabModalOpen, setTabModalOpen] = React.useState(false);
  const [tabModalMode, setTabModalMode] = React.useState<"create" | "edit">("create");
  const [tabModalTabId, setTabModalTabId] = React.useState<number | null>(null);
  const [tabFormTitle, setTabFormTitle] = React.useState("");
  const [tabModalSaving, setTabModalSaving] = React.useState(false);

  const [postEditorOpen, setPostEditorOpen] = React.useState(false);
  const [postEditorMode, setPostEditorMode] = React.useState<"create" | "edit">("create");
  const [postEditorPostId, setPostEditorPostId] = React.useState<string | undefined>();
  const [postEditorPostType, setPostEditorPostType] = React.useState<PostType>("standard");

  const [deployHubDialogOpen, setDeployHubDialogOpen] = React.useState(false);

  const [typePickerOpen, setTypePickerOpen] = React.useState(false);
  const [removePostDialogOpen, setRemovePostDialogOpen] = React.useState(false);
  const [removePostId, setRemovePostId] = React.useState<number | null>(null);
  const [addingPostId, setAddingPostId] = React.useState<number | null>(null);
  const [tabPostsPage, setTabPostsPage] = React.useState(1);
  const [tabPostsRefreshKey, setTabPostsRefreshKey] = React.useState(0);
  const [tabPostsSearch, setTabPostsSearch] = React.useState("");
  const [debouncedTabPostsSearch, setDebouncedTabPostsSearch] = React.useState("");
  const [tabPostsResponse, setTabPostsResponse] = React.useState<PaginatedTabPostsResponseDto | null>(null);
  const [loadingTabPosts, setLoadingTabPosts] = React.useState(false);

  const bumpTabPostsRefreshRef = React.useRef<() => void>(() => { });
  React.useEffect(() => {
    bumpTabPostsRefreshRef.current = () => setTabPostsRefreshKey((k) => k + 1);
  });

  const selectedHub = React.useMemo(
    () => hubs.find((hub) => hub.id === selectedHubId) ?? null,
    [hubs, selectedHubId]
  );

  const tabs = React.useMemo(
    () =>
      [...(selectedHub?.tabs ?? [])].sort(
        (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
      ),
    [selectedHub]
  );

  const selectedTab = React.useMemo(
    () => tabs.find((tab) => tab.id === selectedTabId) ?? null,
    [tabs, selectedTabId]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedTabPostsSearch(tabPostsSearch), 300);
    return () => clearTimeout(timer);
  }, [tabPostsSearch]);

  React.useEffect(() => {
    setTabPostsPage(1);
    setTabPostsSearch("");
    setDebouncedTabPostsSearch("");
  }, [selectedTabId]);

  React.useEffect(() => {
    setTabPostsPage(1);
  }, [tabPostStatusFilter, debouncedTabPostsSearch]);

  React.useEffect(() => {
    if (!selectedTabId) {
      setTabPostsResponse(null);
      return;
    }
    let cancelled = false;
    setLoadingTabPosts(true);
    void (async () => {
      try {
        const res = await contentService.getTabPosts(selectedTabId, {
          page: tabPostsPage,
          limit: TAB_POSTS_PAGE_SIZE,
          ...(debouncedTabPostsSearch ? { search: debouncedTabPostsSearch } : {}),
          ...(tabPostStatusFilter !== "all" ? { status: tabPostStatusFilter } : {}),
        });
        if (!cancelled) setTabPostsResponse(res);
      } catch (error) {
        console.error("Failed to load tab posts:", error);
        if (!cancelled) {
          toast.error("Failed to load tab posts");
          setTabPostsResponse(null);
        }
      } finally {
        if (!cancelled) setLoadingTabPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    selectedTabId,
    tabPostsPage,
    tabPostsRefreshKey,
    debouncedTabPostsSearch,
    tabPostStatusFilter,
  ]);

  React.useEffect(() => {
    if (!tabPostsResponse) return;
    const tp = Math.max(1, tabPostsResponse.totalPages);
    setTabPostsPage((p) => Math.min(p, tp));
  }, [tabPostsResponse?.totalPages]);

  const displayTabPosts = React.useMemo(
    () => tabPostsResponse?.docs ?? [],
    [tabPostsResponse]
  );

  const tabPostsTotalPages = React.useMemo(
    () => Math.max(1, tabPostsResponse?.totalPages ?? 1),
    [tabPostsResponse?.totalPages]
  );

  const visibleTabPostsCount = React.useMemo(
    () => tabPostsResponse?.totalDocs ?? 0,
    [tabPostsResponse?.totalDocs]
  );

  const loadHubs = React.useCallback(async () => {
    setLoading(true);
    try {
      const nextHubs = await contentService.getCurrentProfileHubs();
      setHubs(nextHubs);
    } catch (error) {
      console.error("Failed to load content hubs:", error);
      toast.error("Failed to load content hubs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchPosts(searchPosts), 300);
    return () => clearTimeout(timer);
  }, [searchPosts]);

  React.useEffect(() => {
    const q = debouncedSearchPosts.trim();
    if (!q) {
      setSearchPostResults([]);
      setSearchingPosts(false);
      return;
    }
    let cancelled = false;
    setSearchingPosts(true);
    void (async () => {
      try {
        const res = await cmsService.getAllPosts({ page: 1, limit: 30, search: q });
        if (cancelled) return;
        const options = (res.docs ?? [])
          .map((post) => {
            const id = toNumericPostId(post.id);
            if (id === null) return null;
            return { id, title: post.title, slug: post.slug, status: post.status } as ViewerPostOption;
          })
          .filter((item): item is ViewerPostOption => item !== null);
        setSearchPostResults(options);
      } catch {
        if (!cancelled) setSearchPostResults([]);
      } finally {
        if (!cancelled) setSearchingPosts(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSearchPosts]);

  React.useEffect(() => {
    void loadHubs();
  }, [loadHubs]);

  React.useEffect(() => {
    if (hubs.length === 0) {
      setSelectedHubId(null);
      return;
    }
    if (!selectedHubId || !hubs.some((hub) => hub.id === selectedHubId)) {
      setSelectedHubId(hubs[0]!.id);
    }
  }, [hubs, selectedHubId]);

  React.useEffect(() => {
    if (!selectedHub) {
      setSelectedTabId(null);
      return;
    }
    if (!selectedTabId || !selectedHub.tabs.some((tab) => tab.id === selectedTabId)) {
      const firstTab = [...selectedHub.tabs].sort((a, b) => a.position - b.position)[0];
      setSelectedTabId(firstTab?.id ?? null);
    }
  }, [selectedHub, selectedTabId]);

  const replaceHubInState = React.useCallback((nextHub: ContentHubResponseDto) => {
    setHubs((prev) => prev.map((hub) => (hub.id === nextHub.id ? nextHub : hub)));
  }, []);

  const persistTabOrderToApi = React.useMemo(
    () =>
      debounce(
        (hubId: number, tabIds: number[]) => {
          void (async () => {
            try {
              const hub = await contentService.reorderContentTabs(hubId, { tabIds });
              replaceHubInState(hub);
            } catch (error) {
              console.error("Failed to reorder tabs:", error);
              toast.error("Failed to reorder tabs");
              try {
                const refreshed = await contentService.getHubById(hubId);
                replaceHubInState(refreshed);
              } catch (refreshError) {
                console.error("Failed to refresh hub after reorder error:", refreshError);
              }
            }
          })();
        },
        TAB_REORDER_DEBOUNCE_MS,
        { maxWait: TAB_REORDER_MAX_WAIT_MS }
      ),
    [replaceHubInState]
  );

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    return () => {
      persistTabOrderToApi.flush();
      persistTabOrderToApi.cancel();
    };
  }, [persistTabOrderToApi]);

  const openHubModalCreate = () => {
    setHubModalMode("create");
    setHubModalHubId(null);
    setHubFormTitle("");
    setHubFormDescription("");
    setHubModalOpen(true);
  };

  const openHubModalEdit = (hub: ContentHubResponseDto) => {
    setHubModalMode("edit");
    setHubModalHubId(hub.id);
    setHubFormTitle(hub.title);
    setHubFormDescription(hub.description ?? "");
    setHubModalOpen(true);
  };

  const closeHubModal = () => {
    setHubModalOpen(false);
    setHubModalHubId(null);
    setHubFormTitle("");
    setHubFormDescription("");
  };

  const handleSubmitHubModal = async () => {
    const title = hubFormTitle.trim();
    if (!title) return;
    setHubModalSaving(true);
    try {
      if (hubModalMode === "create") {
        const hub = await contentService.createHub({
          title,
          description: hubFormDescription.trim() || null,
        });
        setHubs((prev) => [...prev, hub]);
        setSelectedHubId(hub.id);
        toast.success("Content hub created");
      } else if (hubModalHubId != null) {
        await contentService.updateHub(hubModalHubId, {
          title,
          description: hubFormDescription.trim() || null,
        });
        const refreshed = await contentService.getHubById(hubModalHubId);
        replaceHubInState(refreshed);
        toast.success("Content hub updated");
      }
      closeHubModal();
    } catch (error) {
      console.error("Failed to save hub:", error);
      toast.error(
        hubModalMode === "create" ? "Failed to create content hub" : "Failed to update content hub"
      );
    } finally {
      setHubModalSaving(false);
    }
  };

  const requestDeleteHub = (hubId: number) => {
    if (saving) return;
    setConfirmAction({ kind: "hub", hubId });
    setConfirmModalOpen(true);
  };

  const handleDeleteHub = async (hubId: number) => {
    setSaving(true);
    try {
      await contentService.deleteHub(hubId);
      setHubs((prev) => prev.filter((hub) => hub.id !== hubId));
      if (selectedHubId === hubId) setSelectedHubId(null);
      toast.success("Content hub deleted");
    } catch (error) {
      console.error("Failed to delete hub:", error);
      toast.error("Failed to delete content hub");
    } finally {
      setSaving(false);
    }
  };

  const openTabModalCreate = () => {
    if (!selectedHub) return;
    setTabModalMode("create");
    setTabModalTabId(null);
    setTabFormTitle("");
    setTabModalOpen(true);
  };

  const openTabModalEdit = (tab: ContentTabResponseDto) => {
    setTabModalMode("edit");
    setTabModalTabId(tab.id);
    setTabFormTitle(tab.title);
    setTabModalOpen(true);
  };

  const closeTabModal = () => {
    setTabModalOpen(false);
    setTabModalTabId(null);
    setTabFormTitle("");
  };

  const handleSubmitTabModal = async () => {
    const title = tabFormTitle.trim();
    if (!selectedHub || !title) return;
    setTabModalSaving(true);
    try {
      if (tabModalMode === "create") {
        await contentService.createTab(selectedHub.id, { title });
        const refreshed = await contentService.getHubById(selectedHub.id);
        replaceHubInState(refreshed);
        const orderedTabs = [...refreshed.tabs].sort((a, b) => a.position - b.position);
        setSelectedTabId(orderedTabs[orderedTabs.length - 1]?.id ?? null);
        toast.success("Tab created");
      } else if (tabModalTabId != null) {
        await contentService.updateTab(tabModalTabId, { title });
        const refreshed = await contentService.getHubById(selectedHub.id);
        replaceHubInState(refreshed);
        toast.success("Tab updated");
      }
      closeTabModal();
    } catch (error) {
      console.error("Failed to save tab:", error);
      toast.error(
        tabModalMode === "create" ? "Failed to create tab" : "Failed to update tab"
      );
    } finally {
      setTabModalSaving(false);
    }
  };

  const requestDeleteTab = (tabId: number) => {
    if (saving) return;
    setConfirmAction({ kind: "tab", tabId });
    setConfirmModalOpen(true);
  };

  const handleDeleteTab = async (tabId: number) => {
    setSaving(true);
    try {
      await contentService.deleteTab(tabId);
      if (selectedHub) {
        const refreshed = await contentService.getHubById(selectedHub.id);
        replaceHubInState(refreshed);
      }
      toast.success("Tab deleted");
    } catch (error) {
      console.error("Failed to delete tab:", error);
      toast.error("Failed to delete tab");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveTab = (tabId: number, direction: "up" | "down") => {
    if (!selectedHub) return;
    const ordered = [...tabs];
    const index = ordered.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) return;
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex]!, ordered[index]!];

    const reorderedTabs = ordered.map((tab, i) => ({ ...tab, position: i }));
    replaceHubInState({ ...selectedHub, tabs: reorderedTabs });

    persistTabOrderToApi(selectedHub.id, ordered.map((tab) => tab.id));
  };

  const handleAddPostToTab = async (postId: number) => {
    if (!selectedTab) return;
    setAddingPostId(postId);
    try {
      await contentService.addPostToTab(selectedTab.id, { postId });
      if (selectedHub) {
        const refreshed = await contentService.getHubById(selectedHub.id);
        replaceHubInState(refreshed);
      }
      toast.success("Post added to tab");
      setTabPostsRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to add post to tab:", error);
      toast.error("Failed to add post");
    } finally {
      setAddingPostId(null);
    }
  };

  const handleRemovePostFromTab = async (postId: number) => {
    if (!selectedTab) return;
    try {
      setSaving(true);
      await contentService.deleteTabPost(selectedTab.id, postId);
      if (selectedHub) {
        const refreshed = await contentService.getHubById(selectedHub.id);
        replaceHubInState(refreshed);
      }
      toast.success("Post removed from tab");
      setTabPostsRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to remove post:", error);
      toast.error("Failed to remove post");
    } finally {
      setSaving(false);
    }
  };

  const requestRemovePostFromTab = (postId: number) => {
    if (saving) return;
    setConfirmAction({ kind: "post", postId });
    setConfirmModalOpen(true);
  };

  const handleConfirmDeletion = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    if (action.kind === "hub") {
      await handleDeleteHub(action.hubId);
    } else if (action.kind === "tab") {
      await handleDeleteTab(action.tabId);
    } else if (action.kind === "post") {
      await handleRemovePostFromTab(action.postId);
    } else if (action.kind === "deleteCmsPost") {
      await handleDeleteCmsPost(action.postId);
    }
  };

  const handlePostDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedTab) return;
    const targetItem = tabPostsResponse?.docs.find((p) => p.postId === over.id);
    if (!targetItem) return;
    const targetPosition = targetItem.position;
    setTabPostsResponse((prev) => {
      if (!prev) return prev;
      const oldIndex = prev.docs.findIndex((p) => p.postId === active.id);
      const newIndex = prev.docs.findIndex((p) => p.postId === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return { ...prev, docs: arrayMove(prev.docs, oldIndex, newIndex) };
    });
    void (async () => {
      try {
        await contentService.updateTabPostPosition(selectedTab.id, Number(active.id), {
          position: targetPosition,
        });
      } catch (error) {
        console.error("Failed to move post:", error);
        toast.error("Failed to reorder post");
        bumpTabPostsRefreshRef.current();
      }
    })();
  };

  const openPostEditor = (mode: "create" | "edit", editPostId?: string, postType?: PostType) => {
    setPostEditorMode(mode);
    setPostEditorPostId(editPostId);
    setPostEditorPostType(postType ?? "standard");
    setPostEditorOpen(true);
  };

  const handlePostSaved = async (post: PayloadPost) => {
    const wasCreate = postEditorMode === "create";
    const wasShared = postEditorPostType === "shared-from-url";

    if (wasCreate && selectedTab) {
      const numericId = toNumericPostId(post.id);
      if (numericId !== null) {
        try {
          await contentService.addPostToTab(selectedTab.id, { postId: numericId });
        } catch (error) {
          console.error("Failed to add created post to tab:", error);
          toast.error("Post created but failed to add to tab");
        }
      }
    }

    if (selectedHub) {
      const refreshed = await contentService.getHubById(selectedHub.id);
      replaceHubInState(refreshed);
    }

    setTabPostsRefreshKey((k) => k + 1);

    if (wasCreate && wasShared) {
      setTimeout(() => openPostEditor("edit", String(post.id)), 150);
    }
  };

  const requestDeleteCmsPost = (postId: number) => {
    if (saving) return;
    setConfirmAction({ kind: "deleteCmsPost", postId });
    setConfirmModalOpen(true);
  };

  const openRemovePostDialog = (postId: number) => {
    setRemovePostId(postId);
    setRemovePostDialogOpen(true);
  };

  const handleDeleteCmsPost = async (postId: number) => {
    setSaving(true);
    try {
      if (selectedTab) {
        try {
          await contentService.deleteTabPost(selectedTab.id, postId);
        } catch (err) {
          if (!(err instanceof ApiClientError && err.statusCode === 404)) {
            throw err;
          }
        }
      }
      await cmsService.deletePost(String(postId));
      if (selectedHub) {
        const refreshed = await contentService.getHubById(selectedHub.id);
        replaceHubInState(refreshed);
      }
      toast.success("Post deleted permanently");
      setTabPostsRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    } finally {
      setSaving(false);
    }
  };

  const tabPostIds = React.useMemo(() => {
    return new Set((tabPostsResponse?.docs ?? []).map((p) => p.postId));
  }, [tabPostsResponse]);

  const filteredPostOptions = React.useMemo(
    () => searchPostResults.filter((p) => !tabPostIds.has(p.id)),
    [searchPostResults, tabPostIds]
  );

  const hubModal =
    hubModalOpen ? (
      <Dialog
        open={hubModalOpen}
        onOpenChange={(open) => {
          if (!open && !hubModalSaving) closeHubModal();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl rounded-br-none border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 p-0"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <DialogTitle className="text-white">
                {hubModalMode === "create" ? "New content hub" : "Edit content hub"}
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeHubModal}
                className="h-8 w-8 rounded-lg rounded-br-none"
                aria-label="Close"
                disabled={hubModalSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="hubFormTitle" className="text-slate-300">
                  Title
                </Label>
                <Input
                  id="hubFormTitle"
                  value={hubFormTitle}
                  onChange={(e) => setHubFormTitle(e.target.value)}
                  placeholder="e.g. Main directory"
                  className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hubFormDescription" className="text-slate-300">
                  Description <span className="text-slate-500">(optional)</span>
                </Label>
                <Textarea
                  id="hubFormDescription"
                  value={hubFormDescription}
                  onChange={(e) => setHubFormDescription(e.target.value)}
                  placeholder="Short description for this hub…"
                  className="min-h-[88px] rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeHubModal}
                disabled={hubModalSaving}
                className="rounded-lg rounded-br-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={() => void handleSubmitHubModal()}
                disabled={hubModalSaving || !hubFormTitle.trim()}
                className="rounded-lg rounded-br-none"
              >
                {hubModalSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : hubModalMode === "create" ? (
                  "Create hub"
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    ) : null;

  const tabModal =
    tabModalOpen ? (
      <Dialog
        open={tabModalOpen}
        onOpenChange={(open) => {
          if (!open && !tabModalSaving) closeTabModal();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl rounded-br-none border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 p-0"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <DialogTitle className="text-white">
                {tabModalMode === "create" ? "New tab" : "Edit tab"}
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeTabModal}
                disabled={tabModalSaving}
                className="h-8 w-8 rounded-lg rounded-br-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="tabFormTitle" className="text-slate-300">
                  Tab name
                </Label>
                <Input
                  id="tabFormTitle"
                  value={tabFormTitle}
                  onChange={(e) => setTabFormTitle(e.target.value)}
                  placeholder="e.g. Featured posts"
                  className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tabFormTitle.trim() && !tabModalSaving) {
                      e.preventDefault();
                      void handleSubmitTabModal();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeTabModal}
                disabled={tabModalSaving}
                className="rounded-lg rounded-br-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={() => void handleSubmitTabModal()}
                disabled={tabModalSaving || !tabFormTitle.trim()}
                className="rounded-lg rounded-br-none"
              >
                {tabModalSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : tabModalMode === "create" ? (
                  "Create tab"
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    ) : null;

  return (
    <div className="">
      {hubModal}
      {tabModal}

      <DeployContentHubDialog
        open={deployHubDialogOpen}
        onOpenChange={setDeployHubDialogOpen}
        hubId={selectedHub?.id ?? null}
        hubTitle={selectedHub?.title ?? ""}
      />

      {/* ── Post type picker ── */}
      <Dialog open={typePickerOpen} onOpenChange={setTypePickerOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl rounded-br-none border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 p-0"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <DialogTitle className="text-white">Choose post type</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTypePickerOpen(false)}
                className="h-8 w-8 rounded-lg rounded-br-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 p-5">
              <button
                type="button"
                onClick={() => {
                  setTypePickerOpen(false);
                  openPostEditor("create", undefined, "standard");
                }}
                className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-800/40 p-4 text-left transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/[0.06]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-emerald-400">
                  <FileText className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">Standard Post</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
                    Write a post with title, content blocks, tags, and SEO.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTypePickerOpen(false);
                  openPostEditor("create", undefined, "shared-from-url");
                }}
                className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-800/40 p-4 text-left transition-colors hover:border-blue-500/50 hover:bg-blue-500/[0.06]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-blue-400">
                  <Link2 className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">Share from URL</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
                    Paste an external link — metadata is fetched automatically.
                  </span>
                </span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Remove post options ── */}
      <Dialog
        open={removePostDialogOpen}
        onOpenChange={(o) => {
          setRemovePostDialogOpen(o);
          if (!o) setRemovePostId(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[min(100%,20rem)] max-w-[20rem] gap-0 rounded-2xl rounded-br-none border border-slate-800/70 bg-slate-950 p-0 shadow-2xl shadow-black/30 sm:max-w-[20rem]"
        >
          <div className="flex items-center justify-between border-b border-slate-800/60 px-4 py-3">
            <DialogTitle className="text-base font-semibold tracking-tight text-slate-100">
              Remove post
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRemovePostDialogOpen(false)}
              className="h-8 w-8 shrink-0 rounded-lg rounded-br-none"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="px-4 pb-4 pt-3">
            <p className="mb-3 text-[13px] leading-snug text-slate-500">
              What would you like to do with this post?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (removePostId !== null) {
                    requestRemovePostFromTab(removePostId);
                  }
                  setRemovePostDialogOpen(false);
                  setRemovePostId(null);
                }}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-800/80 border-l-orange-400/70 bg-slate-900/50 px-3 py-2.5 text-left transition-colors cursor-pointer hover:border-l-orange-400/90 hover:border-slate-700/90 hover:bg-slate-800/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-800/60 text-orange-300/90">
                  <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-200">Remove from this tab</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    The post stays in the system.
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (removePostId !== null) {
                    requestDeleteCmsPost(removePostId);
                  }
                  setRemovePostDialogOpen(false);
                  setRemovePostId(null);
                }}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-800/80 border-l-red-400/70 bg-slate-900/50 px-3 py-2.5 text-left transition-colors cursor-pointer hover:border-l-red-400/90 hover:border-slate-700/90 hover:bg-slate-800/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-800/60 text-red-300/90">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-200">Delete permanently</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    Remove from all tabs and delete from system.
                  </span>
                </span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PostEditorDialog
        open={postEditorOpen}
        onOpenChange={setPostEditorOpen}
        mode={postEditorMode}
        editPostId={postEditorPostId}
        initialPostType={postEditorPostType}
        onSaved={handlePostSaved}
      />
      <ConfirmDeletionModal
        open={confirmModalOpen}
        onOpenChange={(open) => {
          setConfirmModalOpen(open);
          if (!open) setConfirmAction(null);
        }}
        loading={saving}
        title="Confirm deletion"
        description={
          confirmAction?.kind === "hub"
            ? "Delete this content hub and all of its tabs?"
            : confirmAction?.kind === "tab"
              ? "Delete this tab and all tab posts?"
              : confirmAction?.kind === "post"
                ? "Remove this post from the tab?"
                : confirmAction?.kind === "deleteCmsPost"
                  ? "Permanently delete this post? It will also be removed from all tabs."
                  : ""
        }
        confirmText={
          confirmAction?.kind === "hub"
            ? "Delete hub"
            : confirmAction?.kind === "tab"
              ? "Delete tab"
              : confirmAction?.kind === "post"
                ? "Remove post"
                : confirmAction?.kind === "deleteCmsPost"
                  ? "Delete permanently"
                  : "Confirm"
        }
        onConfirm={handleConfirmDeletion}
      />
      <div className="mx-auto max-w-[1400px]">
        <Card className="overflow-hidden rounded-2xl rounded-br-none border border-slate-800 bg-slate-950/95 shadow-xl shadow-black/20 py-0 gap-0">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-800/90 bg-slate-900/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                Content hub
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Manage hubs, tabs, and posts for your profile.
              </CardDescription>
            </div>
            {allowsSubProfiles ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg rounded-br-none"
                  disabled={!selectedHub || selectedHub.isShared === true}
                  title={
                    !selectedHub
                      ? "Select a library first"
                      : selectedHub.isShared
                        ? "Shared hubs cannot be redeployed from this view"
                        : "Choose which sub-profiles receive this hub"
                  }
                  onClick={() => setDeployHubDialogOpen(true)}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect to Profile
                </Button>
              </div>
            ) : null}
          </CardHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <aside className="border-b border-slate-800/80 bg-slate-950/50 lg:col-span-3 lg:border-b-0 lg:border-r lg:border-slate-800/80">
              <div className="flex flex-col gap-4 p-4 md:p-5 lg:min-h-[min(70vh,48rem)]">
                <div className="rounded-2xl rounded-br-none border border-slate-800/90 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-4 shadow-inner">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Libraries
                  </p>
                  <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-200">
                    Your hubs
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Select a hub below or add a new library.
                  </p>
                  <Button
                    type="button"
                    variant="success"
                    onClick={openHubModalCreate}
                    disabled={saving}
                    className="mt-4 h-10 w-full rounded-lg rounded-br-none font-medium shadow-sm"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    New content hub
                  </Button>
                </div>

                <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-xl rounded-br-none border border-slate-800/80 bg-slate-900/30 p-2">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading hubs…
                    </div>
                  ) : hubs.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm text-slate-400">No hubs yet</p>
                      <p className="mt-1 text-xs text-slate-600">Create one with the button above.</p>
                    </div>
                  ) : (
                    hubs.map((hub) => {
                      const active = selectedHubId === hub.id;
                      return (
                        <div
                          key={hub.id}
                          className={`group flex items-stretch gap-0.5 rounded-xl rounded-br-none border transition-colors ${active
                            ? "border-emerald-500/40 bg-emerald-500/[0.08] ring-1 ring-emerald-500/25"
                            : "border-transparent bg-transparent hover:bg-slate-800/50"
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedHubId(hub.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl rounded-br-none py-2.5 pl-3 pr-2 text-left"
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg rounded-br-none border ${active
                                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                                : "border-slate-700/80 bg-slate-800/60 text-slate-500"
                                }`}
                            >
                              {active ? (
                                <FolderOpen className="h-4 w-4" />
                              ) : (
                                <Folder className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block truncate text-sm font-medium ${active ? "text-white" : "text-slate-300"
                                  }`}
                              >
                                {hub.title}
                              </span>
                              {hub.description ? (
                                <span className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                  {hub.description}
                                </span>
                              ) : (
                                <span className="mt-0.5 text-xs text-slate-600">
                                  {hub.tabs.length} tab{hub.tabs.length === 1 ? "" : "s"}
                                </span>
                              )}
                            </span>
                          </button>
                          <div className="flex shrink-0 flex-col justify-center gap-0.5 border-l border-slate-800/80 py-1 pr-1 pl-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openHubModalEdit(hub)}
                              className="h-8 w-8 rounded-lg rounded-br-none text-muted-foreground hover:text-foreground"
                              title="Edit hub"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => requestDeleteHub(hub.id)}
                              className="h-8 w-8 rounded-lg rounded-br-none text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              title="Delete hub"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </nav>
              </div>
            </aside>

            <section className="space-y-5 p-5 md:p-8 lg:col-span-9">
              <div className="border-b border-slate-800/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {selectedHub ? selectedHub.title : "Your workspace"}
                </h1>
                <p className="mt-1 text-sm text-slate-400 md:text-base">
                  {selectedHub?.description?.trim()
                    ? selectedHub.description
                    : "Create tabs, add posts, and organize content by status."}
                </p>
              </div>

              {!selectedHub ? (
                <Card className="rounded-xl rounded-br-none border-slate-800 bg-slate-900/50">
                  <CardContent className="p-6 text-sm text-slate-400">
                    Select or create a content hub to begin.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="success"
                      onClick={openTabModalCreate}
                      disabled={saving}
                      className="rounded-lg rounded-br-none"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add tab
                    </Button>
                  </div>

                  {tabs.length === 0 ? (
                    <Card className="rounded-xl rounded-br-none border-slate-800 bg-slate-900/50">
                      <CardContent className="p-6 text-sm text-slate-400">
                        No tabs in this hub yet.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {tabs.map((tab) => {
                        const isSelected = selectedTabId === tab.id;
                        const tabPostCountForHeader =
                          isSelected
                            ? (tabPostsResponse?.totalDocs ?? tab.postCount)
                            : tab.postCount;
                        return (
                          <Card
                            key={tab.id}
                            className="overflow-hidden rounded-xl rounded-br-none border-slate-800 bg-slate-900/60 py-0"
                          >
                            <div
                              className={`flex items-center justify-between px-4 py-3 ${
                                isSelected
                                  ? "bg-success text-success-foreground"
                                  : "bg-muted/80 text-foreground"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedTabId(tab.id)}
                                className="flex items-center gap-2 text-left cursor-pointer"
                              >
                                {isSelected ? (
                                  <ChevronUp className="h-4 w-4 opacity-90" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-semibold">{tab.title}</span>
                                <span
                                  className={
                                    isSelected ? "text-xs opacity-90" : "text-xs text-muted-foreground"
                                  }
                                >
                                  ({tabPostCountForHeader})
                                </span>
                              </button>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTabModalEdit(tab);
                                  }}
                                  className={
                                    isSelected
                                      ? "h-7 w-7 p-0 hover:bg-success-foreground/15"
                                      : "h-7 w-7 p-0"
                                  }
                                  title="Edit tab name"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleMoveTab(tab.id, "up")}
                                  className={
                                    isSelected
                                      ? "h-7 w-7 p-0 hover:bg-success-foreground/15"
                                      : "h-7 w-7 p-0"
                                  }
                                  title="Move up"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleMoveTab(tab.id, "down")}
                                  className={
                                    isSelected
                                      ? "h-7 w-7 p-0 hover:bg-success-foreground/15"
                                      : "h-7 w-7 p-0"
                                  }
                                  title="Move down"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => requestDeleteTab(tab.id)}
                                  className={
                                    isSelected
                                      ? "h-7 w-7 p-0 hover:bg-success-foreground/15 hover:text-destructive"
                                      : "h-7 w-7 p-0 hover:text-destructive"
                                  }
                                  title="Delete tab"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {isSelected && (
                              <CardContent className="p-4 space-y-4">
                                {/* ── Add existing / Create new ── */}
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative flex-1 max-w-md">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                      <Input
                                        value={searchPosts}
                                        onChange={(e) => setSearchPosts(e.target.value)}
                                        placeholder="Search existing posts to add…"
                                        className="pl-9 rounded-lg rounded-br-none border-slate-700 bg-black/50 text-white"
                                      />
                                    </div>
                                    <Button
                                      variant="success"
                                      onClick={() => setTypePickerOpen(true)}
                                      className="rounded-lg rounded-br-none"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create Post
                                    </Button>
                                  </div>

                                  {searchPosts.trim() && (
                                    <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-700/80 bg-black/30 divide-y divide-slate-800/80">
                                      {searchingPosts ? (
                                        <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          Searching…
                                        </div>
                                      ) : filteredPostOptions.length === 0 ? (
                                        <p className="px-3 py-4 text-center text-xs text-slate-500">No matching posts found.</p>
                                      ) : (
                                        filteredPostOptions.map((post) => {
                                          const statusColor =
                                            post.status === "publish"
                                              ? "bg-green-500"
                                              : post.status === "archive"
                                                ? "bg-slate-400"
                                                : "bg-yellow-500";
                                          return (
                                            <div
                                              key={post.id}
                                              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-800/40 transition-colors"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
                                                <span className="text-sm text-slate-100 truncate">{post.title}</span>
                                                {post.slug && (
                                                  <span className="text-xs text-slate-500 truncate">/{post.slug}</span>
                                                )}
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => void handleAddPostToTab(post.id)}
                                                disabled={addingPostId !== null}
                                                className="shrink-0 h-7 px-2 text-xs text-primary hover:bg-primary/10"
                                              >
                                                {addingPostId === post.id ? (
                                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                  <>
                                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                                    Add
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* ── Status filter + search ── */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    {(["all", "draft", "publish", "archive"] as const).map((f) => {
                                      const colors: Record<string, string> = {
                                        all: "text-white",
                                        draft: "text-yellow-400",
                                        publish: "text-green-400",
                                        archive: "text-slate-200",
                                      };
                                      const labels: Record<string, string> = {
                                        all: "All",
                                        draft: "Draft",
                                        publish: "Published",
                                        archive: "Archived",
                                      };
                                      return (
                                        <React.Fragment key={f}>
                                          {f !== "all" && <span className="text-slate-600">|</span>}
                                          <button
                                            type="button"
                                            onClick={() => setTabPostStatusFilter(f)}
                                            className={tabPostStatusFilter === f ? colors[f] : "text-slate-400"}
                                          >
                                            {labels[f]}
                                          </button>
                                        </React.Fragment>
                                      );
                                    })}
                                  </div>
                                  <div className="relative ml-auto w-full sm:w-56">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                                    <Input
                                      value={tabPostsSearch}
                                      onChange={(e) => setTabPostsSearch(e.target.value)}
                                      placeholder="Search tab posts…"
                                      className="h-8 pl-8 text-xs rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                                    />
                                  </div>
                                </div>

                                {/* ── Tab posts (server-paginated, drag-and-drop sortable) ── */}
                                <div className="space-y-2">
                                  {loadingTabPosts ? (
                                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                      Loading posts…
                                    </div>
                                  ) : displayTabPosts.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                      {debouncedTabPostsSearch ? "No posts match your search." : "No posts in this tab yet."}
                                    </p>
                                  ) : (
                                    <DndContext
                                      sensors={dndSensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={handlePostDragEnd}
                                    >
                                      <SortableContext
                                        items={displayTabPosts.map((p) => p.postId)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        {displayTabPosts.map((item) => (
                                          <SortablePostItem
                                            key={item.postId}
                                            item={item}
                                            onEdit={(pid) => openPostEditor("edit", String(pid))}
                                            onRemove={openRemovePostDialog}
                                          />
                                        ))}
                                      </SortableContext>
                                    </DndContext>
                                  )}
                                </div>
                                {!loadingTabPosts && tabPostsTotalPages > 1 ? (
                                  <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-slate-500">
                                      Showing{" "}
                                      {visibleTabPostsCount === 0
                                        ? 0
                                        : (tabPostsPage - 1) * TAB_POSTS_PAGE_SIZE + 1}
                                      –
                                      {Math.min(
                                        tabPostsPage * TAB_POSTS_PAGE_SIZE,
                                        visibleTabPostsCount
                                      )}{" "}
                                      of {visibleTabPostsCount}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={tabPostsPage <= 1}
                                        onClick={() => setTabPostsPage((p) => Math.max(1, p - 1))}
                                        className="h-8 rounded-lg rounded-br-none"
                                      >
                                        Previous
                                      </Button>
                                      <span className="text-xs text-slate-500">
                                        Page {tabPostsPage} / {tabPostsTotalPages}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={tabPostsPage >= tabPostsTotalPages}
                                        onClick={() =>
                                          setTabPostsPage((p) => Math.min(tabPostsTotalPages, p + 1))
                                        }
                                        className="h-8 rounded-lg rounded-br-none"
                                      >
                                        Next
                                      </Button>
                                    </div>
                                  </div>
                                ) : null}
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}

