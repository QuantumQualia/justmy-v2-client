"use client";

import * as React from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2, Share2 } from "lucide-react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { openShare } from "@/components/common/share/share-store";
import {
  contentService,
  resolveContentPostOgImageUrl,
  type ContentTabResponseDto,
  type PaginatedTabPostsResponseDto,
  type TabPostResponseDto,
} from "@/lib/services/content";
import { contentQueryKeys } from "@/lib/query/content-query-keys";
import { legacyPlainText } from "@/lib/legacy-html";
import { safeVideoEmbedSrc } from "@/lib/utils/video";

const PAGE_SIZE = 6;

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
    return Number.isFinite(page) && page < totalPages ? page + 1 : undefined;
  }
  if (docs.length >= pageSize) return Number.isFinite(page) ? page + 1 : 2;
  return undefined;
}

function sortedTabs(hubs: { tabs?: ContentTabResponseDto[] }[]): ContentTabResponseDto[] {
  return hubs
    .flatMap((hub) => hub.tabs ?? [])
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
}

function ContentCardSkeleton() {
  return (
    <div className="overflow-hidden justmy-corners border border-border bg-card shadow-card">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

function cardVideo(post: TabPostResponseDto["post"]) {
  const urls = [post?.videoUrl, post?.externalUrl];
  for (const value of urls) {
    const url = value?.trim();
    if (!url) continue;
    const embed = safeVideoEmbedSrc(url);
    if (embed) return { kind: "embed" as const, src: embed };
  }
  const file = post?.videoUrl?.trim();
  if (file && /^https?:\/\//i.test(file)) return { kind: "file" as const, src: file };
  return null;
}

function PostCard({ item }: { item: TabPostResponseDto }) {
  const post = item.post;
  const label = post?.title?.trim() || `Post #${item.postId}`;
  const slug = post?.slug?.trim();
  const excerpt = legacyPlainText(post?.excerpt);
  const href = slug ? `/blog/${encodeURIComponent(slug)}` : null;
  const ogUrl = resolveContentPostOgImageUrl(post ?? undefined);
  const video = cardVideo(post);
  const shareUrl = slug ? absoluteBlogPostUrl(slug) : null;

  return (
    <article
      className="flex min-w-0 w-full flex-col overflow-hidden justmy-corners border border-border bg-card shadow-card transition-colors hover:border-primary/30"
    >
      <div className={video ? "aspect-[16/10] overflow-hidden bg-black" : "aspect-[16/10] overflow-hidden bg-muted"}>
        {video?.kind === "embed" ? (
          <iframe
            src={video.src}
            title={label}
            className="h-full w-full border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : video?.kind === "file" ? (
          <video src={video.src} controls playsInline className="h-full w-full bg-black object-contain" title={label} />
        ) : ogUrl ? (
          href ? (
            <Link href={href} className="block h-full w-full">
              <img src={ogUrl} alt={label} className="h-full w-full object-cover" />
            </Link>
          ) : (
            <img src={ogUrl} alt={label} className="h-full w-full object-cover" />
          )
        ) : null}
      </div>
      <div className="flex flex-1 items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          {href ? (
            <Link href={href} className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary">
              {label}
            </Link>
          ) : (
            <span className="line-clamp-2 text-sm font-semibold text-foreground">{label}</span>
          )}
          {excerpt ? <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{excerpt}</p> : null}
        </div>
        {shareUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            aria-label={`Share ${label}`}
            title="Share"
            onClick={() =>
              void openShare({
                title: label,
                description: excerpt || post?.seo?.description?.trim() || undefined,
                url: shareUrl,
                imageUrl: ogUrl ?? undefined,
                entityLabel: "Blog post",
              })
            }
          >
            <Share2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function TabSection({
  profileSlug,
  tab,
  layout,
  showTitle,
  collapsible,
  open,
  onToggle,
  onVisibility,
}: {
  profileSlug: string;
  tab: ContentTabResponseDto;
  layout: "grid" | "carousel";
  showTitle: boolean;
  collapsible: boolean;
  open: boolean;
  onToggle: () => void;
  onVisibility: (tabId: number, visible: boolean | null) => void;
}) {
  const postsQuery = useInfiniteQuery({
    queryKey: contentQueryKeys.mycardPublicTabPostsInfinite(profileSlug, tab.id),
    queryFn: ({ pageParam }) =>
      contentService.getPublicTabPosts(profileSlug, tab.id, { page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    enabled: open && profileSlug.length > 0,
  });

  const posts = postsQuery.data?.pages.flatMap((page) => page.docs) ?? [];
  const loading = open && postsQuery.isPending;
  const knownEmpty = postsQuery.isSuccess && posts.length === 0;

  React.useEffect(() => {
    if (!open && !knownEmpty) return;
    onVisibility(tab.id, loading ? null : posts.length > 0);
  }, [knownEmpty, loading, onVisibility, open, posts.length, tab.id]);

  if (knownEmpty) return null;
  if (!collapsible && posts.length === 0) return null;

  const heading = layout === "carousel" || collapsible || showTitle;

  return (
    <section className={layout === "carousel" ? "space-y-2" : "space-y-3"}>
      {heading ? (
        collapsible ? (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 border-b border-border py-2 text-left"
            aria-expanded={open}
            onClick={onToggle}
          >
            <h2 className="text-xl font-bold text-foreground">{tab.title}</h2>
            {open ? <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />}
          </button>
        ) : (
          <h2 className="text-xl font-bold text-foreground">{tab.title}</h2>
        )
      ) : null}
      {open && loading ? (
        layout === "carousel" ? (
          <ContentCardSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ContentCardSkeleton />
            <ContentCardSkeleton />
            <ContentCardSkeleton />
          </div>
        )
      ) : null}
      {open && posts.length > 0 ? (
        layout === "carousel" ? (
          <Swiper
            modules={[Pagination]}
            slidesPerView={1}
            spaceBetween={12}
            pagination={posts.length > 1 ? { clickable: true } : false}
            className={
              posts.length > 1
                ? "!pb-6 [&_.swiper-pagination-bullet]:bg-muted-foreground/40 [&_.swiper-pagination-bullet-active]:bg-primary"
                : ""
            }
          >
            {posts.map((item) => (
              <SwiperSlide key={`${item.postId}-${item.position}`} className="!h-auto">
                <PostCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((item) => (
              <PostCard key={`${item.postId}-${item.position}`} item={item} />
            ))}
          </div>
        )
      ) : null}
      {open && postsQuery.hasNextPage ? (
        <Button
          type="button"
          variant="ghost"
          className="mx-auto flex w-fit rounded-full"
          disabled={postsQuery.isFetchingNextPage}
          onClick={() => void postsQuery.fetchNextPage()}
        >
          {postsQuery.isFetchingNextPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Show more
        </Button>
      ) : null}
    </section>
  );
}

export function MycardContentSections({
  profileSlug,
  layout,
  collapsible = false,
}: {
  profileSlug: string;
  layout: "grid" | "carousel";
  collapsible?: boolean;
}) {
  const slugKey = profileSlug.trim();
  const hubQuery = useQuery({
    queryKey: contentQueryKeys.hubPublic(slugKey),
    queryFn: () => contentService.getPublicHubsBySlug(slugKey),
    enabled: slugKey.length > 0,
  });
  const tabs = React.useMemo(() => sortedTabs(hubQuery.data ?? []), [hubQuery.data]);
  const [visibleIds, setVisibleIds] = React.useState<Record<number, boolean | null>>({});
  const [openedIds, setOpenedIds] = React.useState<number[]>([]);
  const onVisibility = React.useCallback((tabId: number, visible: boolean | null) => {
    setVisibleIds((current) => (current[tabId] === visible ? current : { ...current, [tabId]: visible }));
    if (!collapsible || visible !== false) return;
    setOpenedIds((current) => {
      if (!current.includes(tabId)) return current;
      const index = tabs.findIndex((tab) => tab.id === tabId);
      const next = tabs[index + 1];
      const without = current.filter((id) => id !== tabId);
      if (!next || without.includes(next.id) || current.includes(next.id)) return without;
      return [...without, next.id];
    });
  }, [collapsible, tabs]);
  React.useEffect(() => {
    if (!collapsible || tabs.length === 0) return;
    setOpenedIds((current) => (current.length > 0 ? current : [tabs[0].id]));
  }, [collapsible, tabs]);
  const readyCount = tabs.filter((tab) => visibleIds[tab.id] === true).length;
  const stillLoading = tabs.some((tab) => visibleIds[tab.id] == null);
  const showTitle = collapsible || readyCount > 1;

  if (!slugKey || (tabs.length === 0 && !hubQuery.isPending)) return null;
  if (!collapsible && !hubQuery.isPending && !stillLoading && readyCount === 0) return null;

  const loadingSkeleton = (
    <div className="space-y-3">
      <Skeleton className="h-7 w-40" />
      {layout === "carousel" ? (
        <ContentCardSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ContentCardSkeleton />
          <ContentCardSkeleton />
          <ContentCardSkeleton />
        </div>
      )}
    </div>
  );

  return (
    <div className={layout === "carousel" ? "space-y-4" : "space-y-6"}>
      {hubQuery.isPending || (!collapsible && stillLoading && readyCount === 0) ? loadingSkeleton : null}
      {tabs.map((tab) => (
        <TabSection
          key={tab.id}
          profileSlug={slugKey}
          tab={tab}
          layout={layout}
          showTitle={showTitle}
          collapsible={collapsible}
          open={!collapsible || openedIds.includes(tab.id)}
          onToggle={() =>
            setOpenedIds((current) =>
              current.includes(tab.id) ? current.filter((id) => id !== tab.id) : [...current, tab.id],
            )
          }
          onVisibility={onVisibility}
        />
      ))}
    </div>
  );
}
