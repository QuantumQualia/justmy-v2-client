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

function PostCard({ item }: { item: TabPostResponseDto }) {
  const post = item.post;
  const label = post?.title?.trim() || `Post #${item.postId}`;
  const slug = post?.slug?.trim();
  const excerpt = legacyPlainText(post?.excerpt);
  const href = slug ? `/blog/${encodeURIComponent(slug)}` : null;
  const ogUrl = resolveContentPostOgImageUrl(post ?? undefined);
  const shareUrl = slug ? absoluteBlogPostUrl(slug) : null;

  return (
    <article
      className="flex min-w-0 w-full flex-col overflow-hidden justmy-corners border border-border bg-card shadow-card transition-colors hover:border-primary/30"
    >
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {ogUrl ? (
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
  onVisibility,
}: {
  profileSlug: string;
  tab: ContentTabResponseDto;
  layout: "grid" | "carousel";
  showTitle: boolean;
  collapsible: boolean;
  onVisibility: (tabId: number, visible: boolean) => void;
}) {
  const postsQuery = useInfiniteQuery({
    queryKey: contentQueryKeys.mycardPublicTabPostsInfinite(profileSlug, tab.id),
    queryFn: ({ pageParam }) =>
      contentService.getPublicTabPosts(profileSlug, tab.id, { page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    enabled: profileSlug.length > 0,
  });

  const [open, setOpen] = React.useState(true);
  const posts = postsQuery.data?.pages.flatMap((page) => page.docs) ?? [];
  const visible = !postsQuery.isPending && posts.length > 0;

  React.useEffect(() => {
    if (postsQuery.isPending) return;
    onVisibility(tab.id, posts.length > 0);
  }, [onVisibility, posts.length, postsQuery.isPending, tab.id]);

  if (!postsQuery.isPending && !visible) return null;

  const heading = layout === "carousel" || collapsible || showTitle;

  return (
    <section className="space-y-3">
      {heading ? (
        collapsible ? (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 border-b border-border py-2 text-left"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <h2 className="text-xl font-bold text-foreground">{tab.title}</h2>
            {open ? <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />}
          </button>
        ) : (
          <h2 className="text-xl font-bold text-foreground">{tab.title}</h2>
        )
      ) : null}
      {open && postsQuery.isPending ? (
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
      {open && !postsQuery.isPending ? (
        layout === "carousel" ? (
          <Swiper
            modules={[Pagination]}
            slidesPerView={1}
            spaceBetween={12}
            pagination={posts.length > 1 ? { clickable: true } : false}
            className="!pb-8 [&_.swiper-pagination-bullet]:bg-muted-foreground/40 [&_.swiper-pagination-bullet-active]:bg-primary"
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
          className="rounded-full"
          disabled={postsQuery.isFetchingNextPage}
          onClick={() => void postsQuery.fetchNextPage()}
        >
          {postsQuery.isFetchingNextPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Load more
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
  const [visibleIds, setVisibleIds] = React.useState<Record<number, boolean>>({});
  const onVisibility = React.useCallback((tabId: number, visible: boolean) => {
    setVisibleIds((current) => (current[tabId] === visible ? current : { ...current, [tabId]: visible }));
  }, []);
  const publishedCount = tabs.filter((tab) => visibleIds[tab.id]).length;
  const showTitle = publishedCount > 1;

  if (!slugKey || tabs.length === 0 && !hubQuery.isPending) return null;
  if (hubQuery.isPending) {
    return (
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
  }

  return (
    <div className="space-y-8">
      {tabs.map((tab) => (
        <TabSection
          key={tab.id}
          profileSlug={slugKey}
          tab={tab}
          layout={layout}
          showTitle={showTitle}
          collapsible={collapsible}
          onVisibility={onVisibility}
        />
      ))}
    </div>
  );
}
