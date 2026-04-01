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

const PAGE_SIZE = 12;

function absoluteBlogPostUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `${base}/blog/${encodeURIComponent(slug)}`;
}

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

  if (docs.length >= pageSize) {
    return Number.isFinite(page) ? page + 1 : 2;
  }
  return undefined;
}

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

function ProfileAvatar({
  profileName,
  profilePhoto,
}: {
  profileName: string;
  profilePhoto?: string | null;
}) {
  if (profilePhoto?.trim()) {
    return (
      <img
        src={profilePhoto}
        alt={profileName}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
      {initialsFromName(profileName)}
    </div>
  );
}

interface MyCardContentDesktopViewProps {
  profileType?: string;
  profileSlug: string;
  profileName: string;
  profilePhoto?: string | null;
  variant?: "light" | "dark";
  selectedTabId?: number | null;
  selectedTabTitle?: string;
}

export function MyCardContentDesktopView({
  profileType,
  profileSlug,
  profileName,
  profilePhoto,
  variant = "dark",
  selectedTabId,
  selectedTabTitle,
}: MyCardContentDesktopViewProps) {
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
        : ["content", "mycardDesktopInfinite", "idle"],
    queryFn: ({ pageParam }) =>
      contentService.getPublicTabPosts(slugKey, tabId!, {
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam,
    enabled: isPersonal && slugKey.length > 0 && tabId != null,
  });

  if (!isPersonal) return null;

  const title = selectedTabTitle?.trim() || (onlyTab?.title ?? "");
  const tabPosts: TabPostResponseDto[] =
    postsInfiniteQuery.data?.pages.flatMap((p) => p.docs) ?? [];

  const loading =
    (!hasForcedTab && hubQuery.isPending) ||
    (tabId != null && postsInfiniteQuery.isPending);

  if (loading) return null;
  if (!title || tabPosts.length === 0) return null;
  const profileHref = `/${encodeURIComponent(slugKey)}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
              className={`group flex min-w-0 flex-col overflow-hidden justmy-corners border transition-all duration-300 hover:-translate-y-1 ${
                isLight
                  ? "border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.9))] shadow-[0_10px_35px_rgba(15,23,42,0.08)] hover:border-primary/40 hover:shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
                  : "border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.9))] shadow-[0_10px_35px_rgba(2,6,23,0.3)] hover:border-blue-500/55 hover:shadow-[0_18px_48px_rgba(37,99,235,0.2)]"
              }`}
            >
              <Link
                href={profileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 pt-4 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Open profile: ${profileName}`}
              >
                <ProfileAvatar profileName={profileName} profilePhoto={profilePhoto} />
                <div className="min-w-0">
                  <span className="block line-clamp-1 text-sm font-semibold text-foreground">
                    {profileName}
                  </span>
                  <span className="block text-[11px] text-muted-foreground transition-colors group-hover:text-foreground/70">
                    View Profile
                  </span>
                </div>
              </Link>

              <div className="px-3">
                <div className={`relative overflow-hidden justmy-corners border ${isLight ? "border-border/70" : "border-slate-700/50"}`}>
                  {ogUrl ? (
                    href ? (
                      <Link
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-[16/10] h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`Open post: ${label}`}
                      >
                        <img
                          src={ogUrl}
                          alt={label}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                      </Link>
                    ) : (
                      <div className="aspect-[16/10] h-full w-full">
                        <img
                          src={ogUrl}
                          alt={label}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                      </div>
                    )
                  ) : (
                    <div className="flex aspect-[16/10] h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 items-start justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  {href ? (
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
                      {label}
                    </span>
                  )}
                  {excerpt ? (
                    <p className={`mt-2 line-clamp-3 text-[13px] leading-relaxed ${isLight ? "text-muted-foreground" : "text-slate-300/85"}`}>
                      {excerpt}
                    </p>
                  ) : null}
                </div>
                {shareUrl ? (
                  <button
                    type="button"
                    className={`mt-1 shrink-0 rounded-full p-2 cursor-pointer transition-all ${
                      isLight
                        ? "text-muted-foreground hover:bg-accent/15 hover:text-accent"
                        : "text-slate-300 hover:bg-blue-500/15 hover:text-blue-300"
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

              {href ? (
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mx-4 mb-4 inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${
                    isLight
                      ? "border-border/80 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      : "border-slate-700 text-slate-300 hover:border-blue-400/60 hover:bg-blue-500/10 hover:text-blue-300"
                  }`}
                >
                  Read Article
                </Link>
              ) : null}
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
                Loading...
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
