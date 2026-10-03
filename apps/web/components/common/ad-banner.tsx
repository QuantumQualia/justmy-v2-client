"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";

export interface AdBannerHotlink {
  label: string;
  href: string;
}

export interface AdBannerProps {
  /** Banner image URL */
  imageSrc: string;
  imageAlt?: string;
  /** Optional: custom element instead of Next Image (e.g. for external URLs) */
  imageElement?: React.ReactNode;
  /** Optional: clicking the banner image opens this URL. Pair with openInNewTab for external sites. */
  bannerLink?: string;
  /** Profile slug (e.g. @handle or profile identifier) shown under the image */
  profileSlug: string;
  /** Hotlinks under the image, right-aligned */
  hotlinks: readonly AdBannerHotlink[];
  className?: string;
  /** Keep the smaller shared corner. The default grows to the large corner on desktop. */
  compact?: boolean;
  /** Banner image and hotlinks open in a new tab. */
  openInNewTab?: boolean;
}

/**
 * Ad banner: image, profile slug, and hotlinks under the image.
 */
export function AdBanner({
  imageSrc,
  imageAlt = "Banner",
  imageElement,
  bannerLink,
  profileSlug,
  hotlinks,
  className,
  compact = false,
  openInNewTab = false,
}: AdBannerProps) {
  const external = openInNewTab
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  const corner = compact ? "justmy-corners-sm" : "justmy-corners-sm lg:justmy-corners-xl";
  const imageArea = (
    <div className={cn(corner, "relative aspect-[6/1] w-full overflow-hidden")}>
      {imageElement ?? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
        />
      )}
    </div>
  );

  const wrappedImage = bannerLink ? (
    <Link
      href={bannerLink}
      className={cn(corner, "block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
      aria-label={imageAlt || "Open banner link"}
      {...external}
    >
      {imageArea}
    </Link>
  ) : (
    imageArea
  );

  return (
    <section className={cn("relative w-full overflow-hidden", className)}>
      {wrappedImage}

      <div className="flex flex-wrap items-center justify-end gap-2 pl-4 py-1.5 text-[11px] sm:text-xs md:text-[13px] md:pl-6">
        {profileSlug && (
          <Link href={`/${profileSlug}`} className="text-muted-foreground">
            <span className="text-muted-foreground">@{profileSlug}</span>
          </Link>
        )}
        <nav className="flex items-center sm:gap-2 gap-1" aria-label="Banner links">
          {hotlinks.map((link, i) => (
            <React.Fragment key={link.href}>
              {i > 0 && <span className="text-muted-foreground" aria-hidden>|</span>}
              <Link
                href={link.href}
                className="text-primary underline underline-offset-2 hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...external}
              >
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </section>
  );
}
