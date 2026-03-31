"use client";

import * as React from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Loader2, Share2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { openShare } from "@/components/common/share/share-store";
import {
  contentService,
  resolveContentNumericId,
  resolveContentPostOgImageUrl,
  type PaginatedTabPostsResponseDto,
  type TabPostResponseDto,
} from "@/lib/services/content";
import { contentQueryKeys, firstSortedTab } from "@/lib/query/content-query-keys";

const PAGE_SIZE = 10;

function absoluteBlogPostUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `${base}/blog/${encodeURIComponent(slug)}`;
}

interface MyCardContentLiteViewProps {
  profileType?: string;
  /** Profile slug for `content/hubs/public/:slug` (required for public hub + posts). */
  profileSlug: string;
  variant?: "light" | "dark";
  /** Optional explicit content tab id (used by desktop dynamic tab selection). */
  selectedTabId?: number | null;
  /** Optional explicit title to display for selected tab. */
  selectedTabTitle?: string;
}

/**
 * TanStack sets `hasNextPage` when `getNextPageParam(lastPage)` is not `undefined`.
 * Important: if the API sends `totalPages`, we must NOT use the "full page" heuristic
 * on the last page — otherwise a full last page (`docs.length === limit`) still returns
 * `page + 1` and "Load more" never disappears.
 */
function getNextPageParam(lastPage: PaginatedTabPostsResponseDto): number | undefined {
  const page = Number(lastPage.page);
  const totalPages = Number(lastPage.totalPages);
  const docs = lastPage.docs ?? [];
  const pageSize = Number(lastPage.limit) || PAGE_SIZE;

  if (Number.isFinite(totalPages) && totalPages > 0) {
    if (Number.isFinite(page) && page < totalPages) {
      return page + 1;
    }
    return undefined;
  }

  // API omitted totalPages: guess "there may be more" only when this page was full
  if (docs.length >= pageSize) {
    return Number.isFinite(page) ? page + 1 : 2;
  }
  return undefined;
}

/** Deterministic hue 0–359 from string (for avatar gradient). */
function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function initialsFromTitle(title: string): string {
  const t = title.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]![0] ?? "";
    const b = parts[parts.length - 1]![0] ?? "";
    return (a + b).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

function TitleAvatar({
  title,
  variant,
}: {
  title: string;
  variant: "light" | "dark";
}) {
  const initials = initialsFromTitle(title);
  const h = hueFromString(title);
  const h2 = (h + 48) % 360;
  const textClass = variant === "light" ? "text-foreground" : "text-white";
  return (
    <div
      className={`flex h-full min-h-0 w-full items-center justify-center text-lg font-bold tracking-tight ${textClass} shadow-inner`}
      style={{
        background: `linear-gradient(135deg, hsl(${h} 42% 32%), hsl(${h2} 45% 26%))`,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function PostThumbnail({
  imageUrl,
  title,
  variant,
}: {
  imageUrl: string | null;
  title: string;
  variant: "light" | "dark";
}) {
  const [broken, setBroken] = React.useState(false);

  React.useEffect(() => {
    setBroken(false);
  }, [imageUrl]);

  if (imageUrl && !broken) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-full min-h-0 w-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setBroken(true)}
      />
    );
  }

  return <TitleAvatar title={title} variant={variant} />;
}

export function MyCardContentLiteView({
  profileType,
  profileSlug,
  variant = "dark",
  selectedTabId,
  selectedTabTitle,
}: MyCardContentLiteViewProps) {
  const isPersonal = !profileType || profileType === "personal";
  const isLight = variant === "light";
  const slugKey = profileSlug.trim();
  const forcedTabId = resolveContentNumericId(selectedTabId);
  const hasForcedTab = forcedTabId != null;

  const hubQuery = useQuery({
    queryKey: contentQueryKeys.hubPublic(slugKey),
    queryFn: () => contentService.getPublicHubsBySlug(slugKey),
    enabled: isPersonal && slugKey.length > 0 && !hasForcedTab,
  });

  const hubs = hubQuery.data ?? null;
  const onlyTab =
    !hasForcedTab && hubs && hubs.length > 0 && hubs[0]?.tabs?.length
      ? firstSortedTab(hubs[0])
      : null;
  const tabId = hasForcedTab ? forcedTabId : resolveContentNumericId(onlyTab?.id);
  
  const postsInfiniteQuery = useInfiniteQuery({
    queryKey:
      tabId != null && slugKey
        ? contentQueryKeys.mycardPublicTabPostsInfinite(slugKey, tabId)
        : ["content", "mycardPublicInfinite", "idle"],
    queryFn: ({ pageParam }) =>
      contentService.getPublicTabPosts(slugKey, tabId!, {
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam,
    enabled: isPersonal && slugKey.length > 0 && tabId != null,
  });

  if (!isPersonal) {
    return null;
  }

  const title = selectedTabTitle?.trim() || (onlyTab?.title ?? "");
  const tabPosts: TabPostResponseDto[] =
    postsInfiniteQuery.data?.pages.flatMap((p) => p.docs) ?? [];

  const loading =
    (!hasForcedTab && hubQuery.isPending) ||
    (tabId != null && postsInfiniteQuery.isPending);

  if (loading) {
    return null;
  }

  if (!title || tabPosts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>

      <div className="space-y-2">
        {tabPosts.map((item) => {
          const post = item.post;
          const label = post?.title?.trim() || `Post #${item.postId}`;
          const slug = post?.slug?.trim();
          const excerpt = post?.excerpt?.trim() ?? "";
          const href = slug ? `/blog/${encodeURIComponent(slug)}` : null;
          const ogUrl = resolveContentPostOgImageUrl(post ?? undefined);
          const seoDescription = post?.seo?.description?.trim() ?? "";
          const shareDescription = excerpt || seoDescription || undefined;
          const shareUrl = slug ? absoluteBlogPostUrl(slug) : null;

          return (
            <article
              key={`${item.postId}-${item.position}`}
              className={`group flex items-stretch gap-0 overflow-hidden rounded-lg rounded-br-none border backdrop-blur-sm transition-all duration-200 ${
                isLight
                  ? "border-border bg-card/70 hover:border-primary/30 hover:shadow-lg"
                  : "border-slate-700/50 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
              }`}
            >
              <div
                className={`flex min-h-0 w-28 shrink-0 self-stretch overflow-hidden border-r ${
                  isLight ? "border-border bg-card" : "border-slate-700/40 bg-slate-800/80"
                }`}
              >
                {href ? (
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full min-h-0 min-w-0 w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Open post: ${label}`}
                  >
                    <PostThumbnail
                      imageUrl={ogUrl}
                      title={label}
                      variant={variant}
                    />
                  </Link>
                ) : (
                  <div className="h-full min-h-0 min-w-0 w-full">
                    <PostThumbnail
                      imageUrl={ogUrl}
                      title={label}
                      variant={variant}
                    />
                  </div>
                )}
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  {href ? (
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className="line-clamp-2 text-sm font-semibold text-foreground">
                      {label}
                    </span>
                  )}
                  {excerpt ? (
                    <p
                      className={`mt-1 line-clamp-2 text-xs ${
                        isLight ? "text-muted-foreground" : "text-slate-400/80"
                      }`}
                    >
                      {excerpt}
                    </p>
                  ) : null}
                </div>
                {shareUrl ? (
                  <button
                    type="button"
                    className={`mt-auto shrink-0 cursor-pointer transition-colors ${
                        isLight
                          ? "text-accent group-hover:text-accent"
                          : "text-slate-400 group-hover:text-blue-400"
                    }`}
                    aria-label={`Share ${label}`}
                    title="Share"
                    onClick={() =>
                      void openShare({
                        title: label,
                        description: shareDescription,
                        url: shareUrl,
                        imageUrl: ogUrl ?? undefined,
                        entityLabel: "Blog post",
                      })
                    }
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {postsInfiniteQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            className={`touch-manipulation ${
              isLight
                ? "hover:bg-muted"
                : "hover:bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/30"
            }`}
            disabled={postsInfiniteQuery.isFetchingNextPage}
            onClick={() => void postsInfiniteQuery.fetchNextPage()}
          >
            {postsInfiniteQuery.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
