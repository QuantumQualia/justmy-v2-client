"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { Loader2, Trash2 } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { PageBlock } from "@/lib/services/cms";
import {
  profilesService,
  type MarketProfileSummary,
} from "@/lib/services/profiles";

interface ProfileSpotlightBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

type SpotlightBlock = PageBlock & {
  heading?: string;
  subheading?: string;
  mode?: "spotlight" | "feed";
  primaryProfileSlug?: string;
  feedProfileSlugs?: string[];
};

export function ProfileSpotlightBlockEditor({
  block,
  onUpdate,
}: ProfileSpotlightBlockEditorProps) {
  const typedBlock = block as SpotlightBlock;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 750);
  const [profiles, setProfiles] = useState<MarketProfileSummary[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [page] = useState(1);
  const [limit] = useState(20);
  const fetchingRef = useRef<string | null>(null);

  const heading = typedBlock.heading ?? "";
  const subheading = typedBlock.subheading ?? "";
  const mode = typedBlock.mode ?? "spotlight";
  const isSpotlight = mode === "spotlight";
  const primaryProfileSlug = typedBlock.primaryProfileSlug ?? "";
  const feedProfileSlugs = typedBlock.feedProfileSlugs ?? [];

  const updateBlock = (patch: Partial<SpotlightBlock>) => {
    onUpdate({
      ...typedBlock,
      ...patch,
    });
  };

  const primaryProfile = useMemo(
    () => profiles.find((p) => p.slug === primaryProfileSlug) ?? null,
    [profiles, primaryProfileSlug],
  );

  const feedProfiles = useMemo(
    () =>
      feedProfileSlugs
        .map((slug) => profiles.find((p) => p.slug === slug) ?? { slug } as MarketProfileSummary)
        .filter(Boolean),
    [profiles, feedProfileSlugs],
  );

  useEffect(() => {
    const fetchKey = `${page}-${limit}-${debouncedSearch || ""}`;
    if (fetchingRef.current === fetchKey) return;
    fetchingRef.current = fetchKey;

    let isActive = true;

    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const response = await profilesService.getMarketProfiles({
          page,
          limit,
          search: debouncedSearch || undefined,
        });
        if (!isActive || fetchingRef.current !== fetchKey) return;
        setProfiles(response.data || []);
      } catch {
        if (!isActive || fetchingRef.current !== fetchKey) return;
        setProfiles([]);
      } finally {
        if (fetchingRef.current === fetchKey) {
          setLoadingProfiles(false);
          fetchingRef.current = null;
        }
      }
    };

    fetchProfiles();

    return () => {
      isActive = false;
    };
  }, [page, limit, debouncedSearch]);

  const handleAddFeedProfile = (slug: string) => {
    if (!slug) return;
    if (feedProfileSlugs.includes(slug)) return;
    updateBlock({ feedProfileSlugs: [...feedProfileSlugs, slug] });
  };

  const handleRemoveFeedProfile = (slug: string) => {
    updateBlock({
      feedProfileSlugs: feedProfileSlugs.filter((s) => s !== slug),
    });
  };

  const handleReorderFeedProfile = (index: number, direction: "up" | "down") => {
    const next = [...feedProfileSlugs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const current = next[index] ?? "";
    const target = next[targetIndex] ?? "";
    if (!current || !target) return;
    next[index] = target;
    next[targetIndex] = current;
    updateBlock({ feedProfileSlugs: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Block mode</p>
          <p className="text-xs text-muted-foreground">
            Toggle between a single profile spotlight hero or a multi-profile feed strip.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Feed</span>
          <Switch
            id="profile-mode-toggle"
            checked={isSpotlight}
            onCheckedChange={(value) =>
              updateBlock({ mode: value ? "spotlight" : "feed" })
            }
          />
          <Label htmlFor="profile-mode-toggle" className="text-foreground text-sm">
            Spotlight
          </Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-muted-foreground">Section heading</Label>
        <Input
          value={heading}
          onChange={(e) => updateBlock({ heading: e.target.value })}
          placeholder="Learn more about JustMy: Your OS is Here!"
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Subheading (optional)</Label>
        <Input
          value={subheading}
          onChange={(e) => updateBlock({ subheading: e.target.value })}
          placeholder="Spotlight a primary profile and feature additional profiles from this market."
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isSpotlight && (
          <div className="space-y-3">
            <Label className="text-muted-foreground">Primary profile (spotlight)</Label>
            <Select
              value={primaryProfileSlug || "none"}
              onValueChange={(value) => {
                updateBlock({ primaryProfileSlug: value === "none" ? "" : value });
                setSearchQuery("");
              }}
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Search and select a primary profile">
                  {primaryProfile
                    ? primaryProfile.name || primaryProfile.slug
                    : primaryProfileSlug || "None selected"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <div className="p-2 border-b border-border">
                  <Input
                    placeholder="Search profiles…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-8 text-sm"
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {loadingProfiles && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Searching profiles…
                    </div>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  <SelectItem
                    value="none"
                    className="focus:bg-accent focus:text-accent-foreground text-muted-foreground"
                  >
                    None
                  </SelectItem>
                  {profiles.length === 0 && !loadingProfiles && (
                    <div className="px-3 py-4 text-xs text-muted-foreground">
                      {debouncedSearch
                        ? `No profiles found matching "${debouncedSearch}".`
                        : "Start typing to search profiles in your markets."}
                    </div>
                  )}
                  {profiles.map((profile) => (
                    <SelectItem
                      key={profile.id}
                      value={profile.slug}
                      className="focus:bg-accent focus:text-accent-foreground text-foreground"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {profile.name || profile.slug}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {profile.type || "Profile"}
                          {profile.zipCode ? ` • ${profile.zipCode}` : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This profile will be highlighted in a large hero-style card with its primary video and details.
            </p>
          </div>
        )}

        {!isSpotlight && (
        <div className="space-y-3">
          <Label className="text-muted-foreground">Feed profiles (horizontal list)</Label>
          <div className="space-y-2 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Search profiles and add them to the feed.
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search profiles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-8 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  // no-op, search is reactive
                }}
              >
                {loadingProfiles ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted">
              {profiles.length === 0 && !loadingProfiles ? (
                <div className="px-3 py-4 text-xs text-muted-foreground">
                  {debouncedSearch
                    ? `No profiles found matching "${debouncedSearch}".`
                    : "Type a search term to load profiles in your markets."}
                </div>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent/70"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {profile.name || profile.slug}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {profile.type || "Profile"}
                        {profile.zipCode ? ` • ${profile.zipCode}` : ""}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => handleAddFeedProfile(profile.slug)}
                      disabled={feedProfileSlugs.includes(profile.slug)}
                    >
                      {feedProfileSlugs.includes(profile.slug) ? "Added" : "Add"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {feedProfileSlugs.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Selected feed profiles</Label>
              <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                {feedProfiles.map((profile, index) => (
                  <div
                    key={profile.slug ?? index}
                    className="flex items-center justify-between gap-2 rounded border border-border bg-muted px-3 py-2 text-xs text-foreground"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {profile.name || profile.slug || "Unknown profile"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {profile.type || "Profile"}
                        {profile.zipCode ? ` • ${profile.zipCode}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-accent-foreground"
                        onClick={() => handleReorderFeedProfile(index, "up")}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-accent-foreground"
                        onClick={() => handleReorderFeedProfile(index, "down")}
                        disabled={index === feedProfileSlugs.length - 1}
                        title="Move down"
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-200"
                        onClick={() => handleRemoveFeedProfile(feedProfileSlugs[index]!)}
                        title="Remove from feed"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

