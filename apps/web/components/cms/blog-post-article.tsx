"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Globe, Users } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { SiFacebook, SiInstagram, SiX, SiYoutube } from "react-icons/si";

import { AdBanner } from "@/components/common/ad-banner";
import { BlocksRenderer } from "@/components/cms/blocks-renderer";
import { openShare } from "@/components/common/share/share-store";
import { legacyPlainText } from "@/lib/legacy-html";
import type {
  PageBlock,
  PayloadPost,
  PostAuthorProfile,
  ResponsiveValue,
} from "@/lib/services/cms";
import { Button } from "@workspace/ui/components/button";

/** Tailwind max-w-5xl. Replaces the previous 48rem block default on published posts. */
const POST_COLUMN = "64rem";

function postImage(post: PayloadPost) {
  const image = post.seo?.ogImage;
  if (!image) return "";
  return typeof image === "string" ? image : image.url || "";
}

function formatPostDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function widenWidth(
  value: ResponsiveValue<string> | string | undefined,
): ResponsiveValue<string> | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    return (value === "48rem"
      ? POST_COLUMN
      : value) as unknown as ResponsiveValue<string>;
  }
  return {
    ...value,
    ...(value.mobile === "48rem" ? { mobile: POST_COLUMN } : {}),
    ...(value.tablet === "48rem" ? { tablet: POST_COLUMN } : {}),
    ...(value.desktop === "48rem" ? { desktop: POST_COLUMN } : {}),
  };
}

function widenBlock(block: PageBlock): PageBlock {
  return {
    ...block,
    styles: block.styles
      ? { ...block.styles, maxWidth: widenWidth(block.styles.maxWidth) }
      : block.styles,
    layout: block.layout
      ? {
          ...block.layout,
          maxWidth: widenWidth(block.layout.maxWidth),
          columns: block.layout.columns?.map((column) => ({
            ...column,
            blocks: column.blocks.map(widenBlock),
          })),
        }
      : block.layout,
    children: block.children?.map(widenBlock),
  };
}

function socialIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("facebook")) return <SiFacebook className="h-4 w-4" />;
  if (key.includes("instagram")) return <SiInstagram className="h-4 w-4" />;
  if (key.includes("linkedin")) return <FaLinkedin className="h-4 w-4" />;
  if (key.includes("youtube")) return <SiYoutube className="h-4 w-4" />;
  if (key === "x" || key.includes("twitter"))
    return <SiX className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

function TextLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const classNames = className ?? "text-primary hover:underline";
  if (/^https?:/i.test(href)) {
    return (
      <a href={href} className={classNames} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href || "#"} className={classNames}>
      {children}
    </Link>
  );
}

function uniqueHotlinks(author: PostAuthorProfile) {
  return (author.hotlinks ?? []).filter((link, index, all) => {
    if (!link.label || !link.link) return false;
    const key = `${link.label}\n${link.link}`;
    return (
      all.findIndex((item) => `${item.label}\n${item.link}` === key) === index
    );
  });
}

export function BlogPostArticle({ post }: { post: PayloadPost }) {
  const image = postImage(post);
  const date = formatPostDate(post.publishedAt || post.createdAt);
  const channel = post.channelLabel || "";
  const kicker = [channel, date].filter(Boolean).join(" | ");
  const excerpt = legacyPlainText(post.excerpt);
  const hasBody = (post.content ?? []).length > 0;
  const author = post.author?.slug ? post.author : null;
  const tagline = author ? legacyPlainText(author.tagline) : "";
  const socials = (author?.socialLinks ?? []).filter((link) => link.link);
  const hotlinks = author ? uniqueHotlinks(author) : [];
  const ad = author?.ad?.image ? author.ad : null;
  const blocks = (post.content ?? []).map(widenBlock);

  const share = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    void openShare({
      heading: "Share this post",
      title: post.title,
      description: excerpt || post.title,
      url: `${origin}/blog/${post.slug}`,
      imageUrl: image || undefined,
    });
  };

  return (
    <article className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
        <div className="space-y-2">
          <header className="overflow-hidden justmy-corners-xl border border-border bg-card">
            {image ? (
              <div className="relative aspect-[4/3] sm:aspect-[2/1]">
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-16 text-white sm:px-8 sm:pb-6 sm:pt-24">
                  <h1 className="text-xl font-semibold leading-snug sm:text-2xl">
                    {post.title}
                  </h1>
                  {kicker ? (
                    <p className="mt-1.5 text-sm text-white/85">{kicker}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2 px-4 py-6 sm:px-8 sm:py-8">
                <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                  {post.title}
                </h1>
                {kicker ? (
                  <p className="text-sm text-muted-foreground">{kicker}</p>
                ) : null}
              </div>
            )}
          </header>

          <div className="flex flex-wrap items-center justify-end gap-x-1 gap-y-1">
            {author ? (
              <>
                <TextLink
                  href={`/${author.slug}`}
                  className="px-1 text-sm text-primary hover:underline"
                >
                  @{author.slug}
                </TextLink>
                {author.website ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    asChild
                  >
                    <a
                      href={author.website}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Website"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
                {socials.map((social) => (
                  <Button
                    key={social.id}
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    asChild
                  >
                    <a
                      href={social.link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.name}
                    >
                      {socialIcon(social.name)}
                    </a>
                  </Button>
                ))}
              </>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-primary"
              onClick={share}
            >
              <Users className="h-4 w-4 shrink-0 text-[color:var(--cta-accent)]" />
              Support LOCALS, Share Now!
            </Button>
          </div>
        </div>
        {tagline ? (
          <p className="text-right text-sm leading-snug text-muted-foreground">
            {tagline}
          </p>
        ) : null}

        {excerpt ? (
          <p className="text-base leading-relaxed text-foreground">{excerpt}</p>
        ) : null}

        {ad && author ? (
          <AdBanner
            imageSrc={ad.image}
            imageAlt={ad.alt || author.name || "Ad"}
            imageElement={
              <img
                src={ad.image}
                alt={ad.alt || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            }
            bannerLink={ad.href || `/${author.slug}`}
            profileSlug={author.slug}
            hotlinks={hotlinks.map((link) => ({
              label: link.label,
              href: link.link,
            }))}
          />
        ) : null}
      </div>

      {hasBody ? (
        <BlocksRenderer
          blocks={blocks}
          className="bg-background text-foreground"
          emptyMessage="No content available for this post."
        />
      ) : null}
    </article>
  );
}
