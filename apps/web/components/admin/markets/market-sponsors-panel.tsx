"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { profilesService, type ProfileResponseDto } from "@/lib/services/profiles";
import {
  marketSponsorsService,
  type MarketSponsor,
  type MarketSponsorInput,
  type SponsorPlacement,
  type SponsorTier,
  ApiClientError,
} from "@/lib/services/market-sponsors";

type Draft = {
  profileId: string;
  profileName: string;
  profileSlug: string;
  national: boolean;
  placement: SponsorPlacement;
  tier: SponsorTier;
  weight: string;
  isActive: boolean;
  audioTagline: string;
  cta: string;
  targetUrl: string;
  pitch: string;
  startDate: string;
  endDate: string;
};

const emptyDraft = (): Draft => ({
  profileId: "",
  profileName: "",
  profileSlug: "",
  national: false,
  placement: "newsstand",
  tier: "standard",
  weight: "1",
  isActive: true,
  audioTagline: "",
  cta: "",
  targetUrl: "",
  pitch: "",
  startDate: "",
  endDate: "",
});

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function draftFromSponsor(sponsor: MarketSponsor): Draft {
  return {
    profileId: String(sponsor.profileId),
    profileName: sponsor.profileName,
    profileSlug: sponsor.profileSlug,
    national: sponsor.national,
    placement: sponsor.placement === "prize" ? "prize" : "newsstand",
    tier: sponsor.tier === "exclusive" ? "exclusive" : "standard",
    weight: String(sponsor.weight || 1),
    isActive: sponsor.isActive,
    audioTagline: sponsor.audioTagline,
    cta: sponsor.cta,
    targetUrl: sponsor.targetUrl,
    pitch: sponsor.pitch || "",
    startDate: toDateInput(sponsor.startDate),
    endDate: toDateInput(sponsor.endDate),
  };
}

function placementLabel(placement: string) {
  return placement === "prize" ? "Win with Sky" : "NewsSTAND";
}

export function MarketSponsorsPanel({ marketId }: { marketId: string }) {
  const [sponsors, setSponsors] = useState<MarketSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [profileQuery, setProfileQuery] = useState("");
  const [profileHits, setProfileHits] = useState<ProfileResponseDto[]>([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [debouncedQuery] = useDebounce(profileQuery, 300);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSponsors(await marketSponsorsService.list(marketId));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load sponsors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // marketId is the only fetch key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId]);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (query.length < 2) {
      setProfileHits([]);
      return;
    }
    let cancelled = false;
    setSearchingProfiles(true);
    profilesService
      .getProfiles({ search: query, limit: 8, page: 1 })
      .then((response) => {
        if (!cancelled) setProfileHits(response.data);
      })
      .catch(() => {
        if (!cancelled) setProfileHits([]);
      })
      .finally(() => {
        if (!cancelled) setSearchingProfiles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const openNew = () => {
    setEditingId("new");
    setDraft(emptyDraft());
    setProfileQuery("");
    setProfileHits([]);
    setError(null);
  };

  const openEdit = (sponsor: MarketSponsor) => {
    setEditingId(sponsor.id);
    setDraft(draftFromSponsor(sponsor));
    setProfileQuery("");
    setProfileHits([]);
    setError(null);
  };

  const closeEditor = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setProfileQuery("");
    setProfileHits([]);
  };

  const save = async () => {
    const profileId = Number(draft.profileId);
    const weight = Number(draft.weight);
    if (!Number.isInteger(profileId) || profileId <= 0) {
      setError("Choose a profile to sponsor this market.");
      return;
    }
    if (!draft.audioTagline.trim() || !draft.cta.trim() || !draft.targetUrl.trim()) {
      setError("Audio tagline, call to action, and target URL are required.");
      return;
    }
    if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
      setError("Weight must be a whole number from 1 to 100.");
      return;
    }

    const payload: MarketSponsorInput = {
      profileId,
      audioTagline: draft.audioTagline.trim(),
      cta: draft.cta.trim(),
      targetUrl: draft.targetUrl.trim(),
      tier: draft.tier,
      weight,
      placement: draft.placement,
      pitch: draft.pitch.trim() || null,
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      isActive: draft.isActive,
      national: draft.national,
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId === "new") {
        await marketSponsorsService.create(marketId, payload);
      } else if (typeof editingId === "number") {
        await marketSponsorsService.update(marketId, editingId, payload);
      }
      closeEditor();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save sponsor.");
      setSaving(false);
    }
  };

  const remove = async (sponsor: MarketSponsor) => {
    const scope = sponsor.national ? "every market" : "this market";
    if (!confirm(`Remove ${sponsor.profileName} as a sponsor for ${scope}?`)) return;
    setError(null);
    try {
      await marketSponsorsService.remove(marketId, sponsor.id);
      if (editingId === sponsor.id) closeEditor();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to remove sponsor.");
    }
  };

  const localSponsors = sponsors.filter((sponsor) => !sponsor.national);
  const nationalSponsors = sponsors.filter((sponsor) => sponsor.national);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Assign a profile as the NewsSTAND spotlight or the Win with Sky prize closet. Banner, hotlinks,
          and articles still come from that profile. The audio tagline is what Sky reads on the daily briefing.
        </p>
        {editingId == null ? (
          <Button type="button" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Add sponsor
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {editingId != null ? (
        <SponsorForm
          draft={draft}
          setDraft={setDraft}
          profileQuery={profileQuery}
          setProfileQuery={setProfileQuery}
          profileHits={profileHits}
          searchingProfiles={searchingProfiles}
          onPickProfile={(profile) => {
            setDraft((current) => ({
              ...current,
              profileId: profile.id,
              profileName: profile.name,
              profileSlug: profile.slug,
            }));
            setProfileQuery("");
            setProfileHits([]);
          }}
          saving={saving}
          isNew={editingId === "new"}
          onCancel={closeEditor}
          onSave={() => void save()}
        />
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading sponsors...
        </div>
      ) : (
        <div className="space-y-6">
          <SponsorGroup
            title="This market"
            empty="No sponsor is assigned to this market yet."
            sponsors={localSponsors}
            onEdit={openEdit}
            onRemove={(sponsor) => void remove(sponsor)}
          />
          <SponsorGroup
            title="All markets"
            empty="No national sponsor is in the rotation."
            sponsors={nationalSponsors}
            onEdit={openEdit}
            onRemove={(sponsor) => void remove(sponsor)}
          />
        </div>
      )}
    </div>
  );
}

function SponsorGroup({
  title,
  empty,
  sponsors,
  onEdit,
  onRemove,
}: {
  title: string;
  empty: string;
  sponsors: MarketSponsor[];
  onEdit: (sponsor: MarketSponsor) => void;
  onRemove: (sponsor: MarketSponsor) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      {sponsors.length === 0 ? (
        <p className="rounded-2xl border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="space-y-3">
          {sponsors.map((sponsor) => (
            <article
              key={sponsor.id}
              className="rounded-2xl border border-border bg-background px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" />
                    <p className="font-medium text-foreground">{sponsor.profileName}</p>
                    <span className="text-sm text-muted-foreground">/{sponsor.profileSlug}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{placementLabel(sponsor.placement)}</Badge>
                    <Badge variant="outline">{sponsor.tier === "exclusive" ? "Exclusive" : "Standard"}</Badge>
                    <Badge variant={sponsor.isActive ? "default" : "outline"}>
                      {sponsor.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Weight {sponsor.weight}</Badge>
                  </div>
                  {sponsor.pitch ? (
                    <p className="max-w-2xl text-sm text-muted-foreground">{sponsor.pitch}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {sponsor.impressionsCount.toLocaleString()} impressions
                    {" · "}
                    {sponsor.clicksCount.toLocaleString()} clicks
                    {sponsor.lastFeaturedAt
                      ? ` · last featured ${new Date(sponsor.lastFeaturedAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(sponsor)} aria-label="Edit sponsor">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(sponsor)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove sponsor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SponsorForm({
  draft,
  setDraft,
  profileQuery,
  setProfileQuery,
  profileHits,
  searchingProfiles,
  onPickProfile,
  saving,
  isNew,
  onCancel,
  onSave,
}: {
  draft: Draft;
  setDraft: (value: Draft | ((current: Draft) => Draft)) => void;
  profileQuery: string;
  setProfileQuery: (value: string) => void;
  profileHits: ProfileResponseDto[];
  searchingProfiles: boolean;
  onPickProfile: (profile: ProfileResponseDto) => void;
  saving: boolean;
  isNew: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-muted/40 p-5">
      <div className="space-y-2">
        <Label htmlFor="sponsor-profile-search">Profile</Label>
        {draft.profileId ? (
          <p className="text-sm text-foreground">
            {draft.profileName}{" "}
            <span className="text-muted-foreground">/{draft.profileSlug}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Search for the profile that should be featured.</p>
        )}
        <div className="relative">
          <Input
            id="sponsor-profile-search"
            value={profileQuery}
            onChange={(event) => setProfileQuery(event.target.value)}
            placeholder="Search by name or slug"
            autoComplete="off"
          />
          {searchingProfiles || profileHits.length > 0 ? (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-border bg-card p-1 shadow-card">
              {searchingProfiles && profileHits.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
              ) : (
                profileHits.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onPickProfile(profile)}
                    className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-secondary"
                  >
                    <span className="text-sm font-medium text-foreground">{profile.name}</span>
                    <span className="text-xs text-muted-foreground">/{profile.slug}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Where it runs</Label>
          <Select
            value={draft.national ? "national" : "market"}
            onValueChange={(value) => patch({ national: value === "national" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">This market</SelectItem>
              <SelectItem value="national">All markets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Placement</Label>
          <Select
            value={draft.placement}
            onValueChange={(value) => patch({ placement: value === "prize" ? "prize" : "newsstand" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newsstand">NewsSTAND</SelectItem>
              <SelectItem value="prize">Win with Sky</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tier</Label>
          <Select
            value={draft.tier}
            onValueChange={(value) => patch({ tier: value === "exclusive" ? "exclusive" : "standard" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="exclusive">Exclusive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sponsor-weight">Weight</Label>
          <Input
            id="sponsor-weight"
            inputMode="numeric"
            value={draft.weight}
            onChange={(event) => patch({ weight: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sponsor-start">Start date</Label>
          <Input
            id="sponsor-start"
            type="date"
            value={draft.startDate}
            onChange={(event) => patch({ startDate: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sponsor-end">End date</Label>
          <Input
            id="sponsor-end"
            type="date"
            value={draft.endDate}
            onChange={(event) => patch({ endDate: event.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Active</p>
          <p className="text-xs text-muted-foreground">Inactive sponsors stay on file and drop out of rotation.</p>
        </div>
        <Switch checked={draft.isActive} onCheckedChange={(checked) => patch({ isActive: checked })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sponsor-tagline">Audio tagline</Label>
        <Textarea
          id="sponsor-tagline"
          value={draft.audioTagline}
          onChange={(event) => patch({ audioTagline: event.target.value })}
          placeholder="Brought to you by..."
          rows={3}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sponsor-cta">Call to action</Label>
          <Input
            id="sponsor-cta"
            value={draft.cta}
            onChange={(event) => patch({ cta: event.target.value })}
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sponsor-url">Target URL</Label>
          <Input
            id="sponsor-url"
            value={draft.targetUrl}
            onChange={(event) => patch({ targetUrl: event.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sponsor-pitch">Pitch</Label>
        <Textarea
          id="sponsor-pitch"
          value={draft.pitch}
          onChange={(event) => patch({ pitch: event.target.value })}
          placeholder="Shown under the NewsSTAND banner"
          rows={3}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isNew ? "Add sponsor" : "Save sponsor"}
        </Button>
      </div>
    </div>
  );
}
