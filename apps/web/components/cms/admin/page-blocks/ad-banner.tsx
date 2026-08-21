"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import type { PageBlock } from "@/lib/services/cms";
import { cn } from "@workspace/ui/lib/utils";

type BannerType = "custom" | "market-sponsor" | "profile";

interface AdBannerBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function AdBannerBlockEditor({ block, onUpdate }: AdBannerBlockEditorProps) {
  const updateField = (field: string, value: unknown) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const bannerType = (block.bannerType as BannerType) || "custom";
  const imageSrc = (block.imageSrc as string) || "";
  const imageAlt = (block.imageAlt as string) || "";
  const bannerLink = (block.bannerLink as string) || "";
  const profileSlug = (block.profileSlug as string) || "";
  const profileId = (block.profileId as string) || "";

  const hotlinks = (block.hotlinks as { label: string; href: string }[] | undefined) || [];
  const ensureHotlinks = (index: number) => hotlinks[index] || { label: "", href: "" };

  const inputClass =
    "bg-muted border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1.5";

  const handleHotlinkChange = (index: number, key: "label" | "href", value: string) => {
    const next = [...hotlinks];
    next[index] = { ...ensureHotlinks(index), [key]: value };
    updateField("hotlinks", next);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-muted border-border text-foreground">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Ad banner with an image, profile slug, and up to 3 hotlinks.
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            Banner type can be Custom, Market Sponsor, or Profile. Future types can be added without
            changing this block.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Banner type */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Banner Type</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              bannerType === "custom"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => updateField("bannerType", "custom")}
          >
            Custom
          </button>
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              bannerType === "market-sponsor"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => updateField("bannerType", "market-sponsor")}
          >
            Market Sponsor
          </button>
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              bannerType === "profile"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => updateField("bannerType", "profile")}
          >
            Profile
          </button>
        </div>
      </div>

      {/* Market sponsor: no fields, content from backend */}
      {bannerType === "market-sponsor" && (
        <p className="text-xs text-muted-foreground">
          Banner content will be fetched from the backend. No CMS fields needed.
        </p>
      )}

      {/* Profile: only Profile ID */}
      {bannerType === "profile" && (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Profile ID</Label>
          <Input
            type="text"
            placeholder="Profile ID (banner fetched from backend)"
            value={profileId}
            onChange={(e) => updateField("profileId", e.target.value)}
            className={inputClass}
          />
          <p className="text-[11px] text-muted-foreground">
            This profile&apos;s ad banner will be fetched from the backend.
          </p>
        </div>
      )}

      {/* Custom: image, banner link, profile slug, hotlinks */}
      {bannerType === "custom" && (
        <>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Image URL</Label>
            <Input
              type="text"
              placeholder="/images/placeholders/banner_placement.jpg"
              value={imageSrc}
              onChange={(e) => updateField("imageSrc", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Image Alt Text</Label>
            <Input
              type="text"
              placeholder="Ad Banner"
              value={imageAlt}
              onChange={(e) => updateField("imageAlt", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Banner link (optional)</Label>
            <Input
              type="text"
              placeholder="URL when user clicks the banner image"
              value={bannerLink}
              onChange={(e) => updateField("bannerLink", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Profile Slug</Label>
            <Input
              type="text"
              placeholder="e.g. justmymemphis"
              value={profileSlug}
              onChange={(e) => updateField("profileSlug", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Hotlinks (up to 3)</Label>
            <p className="text-[11px] text-muted-foreground">
              These appear under the banner image as small text links.
            </p>
            {[0, 1, 2].map((idx) => {
              const link = ensureHotlinks(idx);
              return (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Label #{idx + 1}</Label>
                    <Input
                      type="text"
                      placeholder={idx === 0 ? "Learn More" : idx === 1 ? "Contact Us" : "Follow Us"}
                      value={link.label}
                      onChange={(e) => handleHotlinkChange(idx, "label", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">URL #{idx + 1}</Label>
                    <Input
                      type="text"
                      placeholder={idx === 0 ? "/learn-more" : idx === 1 ? "/contact-us" : "/follow-us"}
                      value={link.href}
                      onChange={(e) => handleHotlinkChange(idx, "href", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

