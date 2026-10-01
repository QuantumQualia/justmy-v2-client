"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@workspace/ui/components/skeleton";
import type { PageBlock, PayloadPost } from "@/lib/services/cms";
import { cmsService } from "@/lib/services/cms";
import { legacyPlainText } from "@/lib/legacy-html";

type HubMiniBlockData = PageBlock & {
  title?: string;
  viewMode?: "magazine" | "text";
  postSlugs?: string[];
};

function postImage(post: PayloadPost) {
  const image = post.seo?.ogImage;
  if (!image) return "";
  return typeof image === "string" ? image : image.url || "";
}

export function HubMiniBlock({ block }: { block: PageBlock }) {
  const data = block as HubMiniBlockData;
  const title = data.title?.trim() || "";
  const viewMode = data.viewMode === "text" ? "text" : "magazine";
  const slugs = (data.postSlugs ?? []).map((slug) => slug.trim()).filter(Boolean);
  const slugKey = slugs.join("|");
  const [posts, setPosts] = useState<PayloadPost[]>([]);
  const [loading, setLoading] = useState(slugs.length > 0);

  useEffect(() => {
    let cancelled = false;
    const list = slugKey ? slugKey.split("|") : [];
    if (!list.length) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all(
      list.map(async (slug) => {
        try {
          return await cmsService.getPostBySlug(slug);
        } catch {
          return null;
        }
      }),
    ).then((rows) => {
      if (cancelled) return;
      setPosts(rows.filter((post): post is PayloadPost => Boolean(post && post.status === "publish")));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slugKey]);

  if (!slugs.length) return null;
  if (!loading && posts.length === 0) return null;

  return (
    <section className="space-y-4">
      {title ? <h2 className="text-xl font-bold text-foreground">{title}</h2> : null}
      {loading ? (
        viewMode === "text" ? (
          <div className="space-y-2">
            {slugs.map((slug) => (
              <Skeleton key={slug} className="h-5 w-2/3" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {slugs.map((slug) => (
              <Skeleton key={slug} className="aspect-[16/10] w-full justmy-corners" />
            ))}
          </div>
        )
      ) : viewMode === "text" ? (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${encodeURIComponent(post.slug)}`}
                className="text-sm font-semibold text-foreground hover:text-primary"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => {
            const image = postImage(post);
            const excerpt = legacyPlainText(post.excerpt);
            return (
              <article
                key={post.slug}
                className="overflow-hidden justmy-corners border border-border bg-card shadow-card transition-colors hover:border-primary/30"
              >
                <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="block">
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {image ? <img src={image} alt={post.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{post.title}</h3>
                    {excerpt ? (
                      <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{excerpt}</p>
                    ) : null}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
