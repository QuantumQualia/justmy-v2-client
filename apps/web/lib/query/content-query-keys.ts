import type { ContentHubResponseDto, ContentTabResponseDto } from "@/lib/services/content";

/** Stable keys for content / hub fetches (shared across editor + public card). */
export const contentQueryKeys = {
  all: ["content"] as const,
  hubsCurrent: () => [...contentQueryKeys.all, "hubs", "current"] as const,
  tabPostsRoot: (tabId: number) => [...contentQueryKeys.all, "tab", tabId, "posts"] as const,
  tabPosts: (tabId: number, status: "draft" | "publish" | "archive") =>
    [...contentQueryKeys.tabPostsRoot(tabId), status] as const,
  /** Paginated card preview (separate from single-page editor tabPosts query). */
  mycardTabPostsInfinite: (tabId: number) =>
    [...contentQueryKeys.all, "tab", tabId, "posts", "publish", "mycardInfinite"] as const,
} as const;

export function firstSortedTab(hub: ContentHubResponseDto | null | undefined): ContentTabResponseDto | null {
  if (!hub?.tabs?.length) return null;
  return (
    [...hub.tabs].sort(
      (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
    )[0] ?? null
  );
}
