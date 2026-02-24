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
  /** Profile slug (e.g. @handle or profile identifier) shown under the image */
  profileSlug: string;
  /** Exactly 3 hotlinks under the image */
  hotlinks: [AdBannerHotlink, AdBannerHotlink, AdBannerHotlink];
  className?: string;
}

/**
 * Ad banner: image, profile slug, and 3 hotlinks under the image.
 */
export function AdBanner({
  imageSrc,
  imageAlt = "Banner",
  imageElement,
  profileSlug,
  hotlinks,
  className,
}: AdBannerProps) {
  return (
    <section className={cn("relative w-full overflow-hidden", className)}>
      <div className="relative w-full aspect-[6/1]">
        {imageElement ?? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="rounded-lg rounded-br-none"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pl-4 py-1.5 text-[11px] sm:text-xs md:text-[13px] md:pl-6">
        <span className="text-white/80">@{profileSlug}</span>
        <nav className="flex items-center sm:gap-2 gap-1" aria-label="Banner links">
          {hotlinks.map((link, i) => (
            <React.Fragment key={link.href}>
              {i > 0 && <span className="text-white/50" aria-hidden>|</span>}
              <Link
                href={link.href}
                className="text-purple-300 underline underline-offset-2 hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
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
