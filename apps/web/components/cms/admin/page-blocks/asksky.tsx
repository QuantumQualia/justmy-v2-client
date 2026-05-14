"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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
  type ProfileResponseDto,
} from "@/lib/services/profiles";
import { agentsService, resolveAgentPublicIdentifier, type AgentResponseDto } from "@/lib/services/agents";
import { useProfileStore } from "@/lib/store";

type AskSkyVariant = "inline" | "voice" | "chatbot";

const ADMIN_PAGE_SIZE = 10;

function mapAdminProfileToSummary(p: ProfileResponseDto): MarketProfileSummary {
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    type: p.type,
    zipCode: p.zipCode,
  };
}

function sortProfiles(list: MarketProfileSummary[]): MarketProfileSummary[] {
  return [...list].sort((a, b) => {
    const an = (a.name || a.slug).toLowerCase();
    const bn = (b.name || b.slug).toLowerCase();
    return an.localeCompare(bn);
  });
}

/** Match block token to an agent row (handles public id vs raw agentToken, trimming). */
function agentMatchesStoredToken(agent: AgentResponseDto, stored: string): boolean {
  const v = stored.trim();
  if (!v) return false;
  const resolved = resolveAgentPublicIdentifier(agent);
  if (resolved && resolved === v) return true;
  const raw = typeof agent.agentToken === "string" ? agent.agentToken.trim() : "";
  if (raw && raw === v) return true;
  const pub = typeof agent.publicIdentifier === "string" ? agent.publicIdentifier.trim() : "";
  if (pub && pub === v) return true;
  return false;
}

function canonicalAgentSelectValue(agent: AgentResponseDto): string | null {
  const fromResolve = resolveAgentPublicIdentifier(agent);
  if (fromResolve) return fromResolve;
  const raw = typeof agent.agentToken === "string" ? agent.agentToken.trim() : "";
  return raw || null;
}

interface AskSkyBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function AskSkyBlockEditor({ block, onUpdate }: AskSkyBlockEditorProps) {
  const activeProfileSlug = useProfileStore((s) => String(s.data.slug ?? "").trim());

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [debouncedSearch] = useDebounce(profileSearch, 400);

  const [adminProfiles, setAdminProfiles] = useState<MarketProfileSummary[]>([]);
  const [adminPage, setAdminPage] = useState(0);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingMoreProfiles, setLoadingMoreProfiles] = useState(false);
  const [profilesLoadFailed, setProfilesLoadFailed] = useState(false);

  const profileListAbortRef = useRef<AbortController | null>(null);
  const profileListScrollRef = useRef<HTMLDivElement | null>(null);
  const skipDebouncedProfileReloadRef = useRef(false);
  /** Bumps when `profileSlug` changes so stale agent list responses are ignored. */
  const agentsFetchGenRef = useRef(0);

  const [slugExtra, setSlugExtra] = useState<MarketProfileSummary | null>(null);

  const [agents, setAgents] = useState<AgentResponseDto[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const profileSlug = String(block.askSkyProfileSlug ?? "").trim();
  const agentToken = String(block.askSkyAgentToken ?? "").trim();
  const variant = (block.askSkyVariant as AskSkyVariant | undefined) ?? "inline";
  const missingRequired = !profileSlug || !agentToken;

  const patch = (partial: Partial<PageBlock>) => {
    onUpdate({ ...block, ...partial });
  };

  const fetchAdminProfilesPage = useCallback(
    async (page: number, search: string, append: boolean) => {
      const res = await profilesService.getProfiles({
        page,
        limit: ADMIN_PAGE_SIZE,
        search: search.trim() ? search.trim() : undefined,
      });
      const chunk = (res.data || []).map(mapAdminProfileToSummary).filter((p) => p.slug);
      const totalPages = Math.max(1, res.totalPages ?? 1);
      setAdminTotalPages(totalPages);
      setAdminPage(page);
      if (append) {
        setAdminProfiles((prev) => {
          const seen = new Set(prev.map((p) => p.slug));
          const next = [...prev];
          for (const p of chunk) {
            if (!seen.has(p.slug)) {
              seen.add(p.slug);
              next.push(p);
            }
          }
          return next;
        });
      } else {
        setAdminProfiles(chunk);
      }
    },
    [],
  );

  const reloadProfileList = useCallback(
    async (search: string) => {
      const q = search.trim();
      if (!q) {
        profileListAbortRef.current?.abort();
        setAdminProfiles([]);
        setAdminPage(0);
        setAdminTotalPages(1);
        setProfilesLoadFailed(false);
        setLoadingProfiles(false);
        profileListScrollRef.current?.scrollTo({ top: 0 });
        return;
      }

      profileListAbortRef.current?.abort();
      const ctrl = new AbortController();
      profileListAbortRef.current = ctrl;
      setLoadingProfiles(true);
      setProfilesLoadFailed(false);
      setAdminPage(0);
      try {
        await fetchAdminProfilesPage(1, q, false);
        if (ctrl.signal.aborted) return;
        profileListScrollRef.current?.scrollTo({ top: 0 });
      } catch {
        if (!ctrl.signal.aborted) {
          setAdminProfiles([]);
          setProfilesLoadFailed(true);
        }
      } finally {
        if (!ctrl.signal.aborted) setLoadingProfiles(false);
      }
    },
    [fetchAdminProfilesPage],
  );

  const loadMoreProfiles = useCallback(async () => {
    if (!profileMenuOpen || loadingProfiles || loadingMoreProfiles) return;
    if (adminPage < 1) return;
    if (adminPage >= adminTotalPages) return;
    const nextPage = adminPage + 1;
    setLoadingMoreProfiles(true);
    try {
      await fetchAdminProfilesPage(nextPage, debouncedSearch, true);
    } catch {
      /* ignore append errors */
    } finally {
      setLoadingMoreProfiles(false);
    }
  }, [
    adminPage,
    adminTotalPages,
    debouncedSearch,
    fetchAdminProfilesPage,
    loadingMoreProfiles,
    loadingProfiles,
    profileMenuOpen,
  ]);

  const handleProfileMenuOpenChange = (open: boolean) => {
    if (open) {
      skipDebouncedProfileReloadRef.current = true;
      setProfileMenuOpen(true);
      setProfileSearch("");
      void reloadProfileList("");
    } else {
      setProfileMenuOpen(false);
      setProfileSearch("");
      profileListAbortRef.current?.abort();
    }
  };

  useEffect(() => {
    if (!profileMenuOpen) return;
    if (skipDebouncedProfileReloadRef.current) {
      skipDebouncedProfileReloadRef.current = false;
      return;
    }
    void reloadProfileList(debouncedSearch.trim());
  }, [debouncedSearch, profileMenuOpen, reloadProfileList]);

  const onProfileListScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (loadingProfiles || loadingMoreProfiles) return;
      if (adminPage < 1) return;
      if (adminPage >= adminTotalPages) return;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
      if (nearBottom) {
        void loadMoreProfiles();
      }
    },
    [adminPage, adminTotalPages, loadMoreProfiles, loadingMoreProfiles, loadingProfiles],
  );

  useEffect(() => {
    if (!profileSlug) {
      setSlugExtra(null);
      return;
    }
    if (slugExtra?.slug === profileSlug) {
      return;
    }
    if (adminProfiles.some((p) => p.slug === profileSlug)) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const { profiles: rawList } = await profilesService.getProfilesBySlugs([profileSlug]);
        const raw = rawList?.[0] as Record<string, unknown> | undefined;
        if (cancelled) return;
        if (raw && typeof raw.slug === "string" && raw.slug.trim()) {
          const s = raw.slug.trim();
          setSlugExtra({
            id: String(raw.id ?? s),
            name: (typeof raw.name === "string" && raw.name.trim()) || s,
            slug: s,
            type: typeof raw.type === "string" ? raw.type : undefined,
            zipCode: typeof raw.zipCode === "string" ? raw.zipCode : undefined,
          });
        } else {
          setSlugExtra({ id: profileSlug, name: profileSlug, slug: profileSlug });
        }
      } catch {
        if (!cancelled) setSlugExtra({ id: profileSlug, name: profileSlug, slug: profileSlug });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [profileSlug, adminProfiles, slugExtra]);

  const displayProfiles = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return [];
    }
    const list = [...adminProfiles];
    if (slugExtra && !list.some((p) => p.slug === slugExtra.slug)) {
      list.push(slugExtra);
    }
    return sortProfiles(list);
  }, [adminProfiles, slugExtra, debouncedSearch]);

  const profileSearchPending = profileMenuOpen && profileSearch.trim() !== debouncedSearch.trim();

  /** Radix SelectValue reads labels from SelectItems; those unmount when the list is cleared after search resets, so the trigger would go blank unless we set an explicit label. */
  const selectedProfileLabel = useMemo(() => {
    const slug = profileSlug.trim();
    if (!slug) return "";
    const fromAdmin = adminProfiles.find((p) => p.slug === slug);
    if (fromAdmin) {
      return (fromAdmin.name || fromAdmin.slug).trim() || slug;
    }
    if (slugExtra?.slug === slug) {
      return (slugExtra.name || slugExtra.slug).trim() || slug;
    }
    return slug;
  }, [profileSlug, adminProfiles, slugExtra]);

  useEffect(() => {
    if (!profileSlug) {
      agentsFetchGenRef.current += 1;
      setAgents([]);
      setLoadingAgents(false);
      return;
    }

    const gen = ++agentsFetchGenRef.current;
    setAgents([]);
    setLoadingAgents(true);

    let cancelled = false;

    const run = async () => {
      try {
        let list = await agentsService.listProfileAgents(profileSlug);
        if (
          gen === agentsFetchGenRef.current &&
          !cancelled &&
          list.length === 0 &&
          profileSlug &&
          activeProfileSlug &&
          profileSlug === activeProfileSlug
        ) {
          list = await agentsService.listProfileAgents();
        }
        if (!cancelled && gen === agentsFetchGenRef.current) {
          setAgents(list);
        }
      } catch {
        if (!cancelled && gen === agentsFetchGenRef.current) {
          setAgents([]);
        }
      } finally {
        if (!cancelled && gen === agentsFetchGenRef.current) {
          setLoadingAgents(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [profileSlug, activeProfileSlug]);

  const agentOptions = useMemo(() => {
    const out: { token: string; label: string; id: string; isActive: boolean }[] = [];
    for (const a of agents) {
      const token = canonicalAgentSelectValue(a);
      if (!token) continue;
      out.push({ token, label: a.name || token, id: String(a.id), isActive: a.isActive });
    }
    return out;
  }, [agents]);

  const activeAgentOptions = useMemo(
    () => agentOptions.filter((o) => o.isActive !== false),
    [agentOptions],
  );

  const tokenInActiveAgentOptions = useMemo(
    () => agents.some((a) => a.isActive !== false && agentMatchesStoredToken(a, agentToken)),
    [agents, agentToken],
  );

  const selectedResolvedAgent = useMemo(() => {
    if (!agentToken.trim()) return null;
    for (const a of agents) {
      if (agentMatchesStoredToken(a, agentToken)) return a;
    }
    return null;
  }, [agents, agentToken]);

  const selectedAgentIsInactive = Boolean(selectedResolvedAgent && !selectedResolvedAgent.isActive);

  const selectedAgentLabel = useMemo(() => {
    for (const a of agents) {
      if (agentMatchesStoredToken(a, agentToken)) {
        return a.name || canonicalAgentSelectValue(a) || agentToken;
      }
    }
    const opt = agentOptions.find((o) => o.token.trim() === agentToken.trim());
    if (opt) return opt.label;
    if (agentToken) {
      return agentToken.length > 40 ? `${agentToken.slice(0, 18)}…${agentToken.slice(-10)}` : agentToken;
    }
    return "";
  }, [agentOptions, agents, agentToken]);

  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 text-slate-200">
        <CardContent className="space-y-4 p-4 pt-4">
          <p className="text-sm text-slate-400">
            AskSKY resolves the profile and agent, then streams answers over SSE.{" "}
            <span className="font-medium text-slate-300">Profile</span> and{" "}
            <span className="font-medium text-slate-300">agent</span> are required for this block to work on published
            pages.
          </p>

          {profilesLoadFailed && !loadingProfiles && profileMenuOpen ? (
            <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              Could not load profiles from <span className="font-medium text-white">GET /profiles/admin</span>. Confirm
              you are signed in with permission to use the admin profile list.
            </div>
          ) : null}

          {missingRequired ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Select both required fields below. The widget will not load until they are set.
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="asksky-profile-select" className="text-slate-200">
              Profile <span className="text-red-400">*</span>
            </Label>
            <Select
              value={profileSlug || undefined}
              onOpenChange={handleProfileMenuOpenChange}
              onValueChange={(value) => {
                const slug = value.trim();
                const picked =
                  displayProfiles.find((p) => p.slug === slug) ?? adminProfiles.find((p) => p.slug === slug);
                if (picked) {
                  setSlugExtra({
                    id: picked.id,
                    name: picked.name,
                    slug: picked.slug,
                    type: picked.type,
                    zipCode: picked.zipCode,
                  });
                } else {
                  setSlugExtra(null);
                }
                patch({
                  askSkyProfileSlug: value,
                  askSkyAgentToken: "",
                });
                setProfileSearch("");
              }}
            >
              <SelectTrigger
                id="asksky-profile-select"
                aria-required="true"
                className={`border-slate-600 bg-slate-900 text-white ${!profileSlug ? "border-amber-600/60" : ""}`}
              >
                <SelectValue placeholder="Choose profile">
                  {profileSlug.trim() ? selectedProfileLabel : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[min(380px,72vh)] border-slate-600 bg-slate-900 p-0 text-slate-100">
                <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 p-2">
                  <Input
                    placeholder="Search profiles…"
                    value={profileSearch}
                    onChange={(e) => setProfileSearch(e.target.value)}
                    className="h-8 border-slate-600 bg-slate-950 text-sm text-white placeholder:text-slate-500"
                    onKeyDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
                <div
                  ref={profileListScrollRef}
                  onScroll={onProfileListScroll}
                  className="max-h-[min(300px,52vh)] min-h-0 overflow-y-scroll overscroll-contain p-1 pr-2 [scrollbar-width:thin] [scrollbar-color:rgb(71_85_105)_rgb(15_23_42)]"
                >
                  {loadingProfiles && profileSearch.trim() ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-xs text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading profiles…
                    </div>
                  ) : displayProfiles.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-slate-400">
                      {!profileSearch.trim()
                        ? "Type in the search box to find profiles."
                        : profileSearchPending
                          ? "Searching…"
                          : "No profiles found."}
                    </div>
                  ) : (
                    <>
                      {displayProfiles.map((profile) => (
                        <SelectItem
                          key={`${profile.id}-${profile.slug}`}
                          value={profile.slug}
                          className="focus:bg-slate-800 focus:text-white text-slate-200"
                        >
                          {profile.name || profile.slug}
                        </SelectItem>
                      ))}
                      {loadingMoreProfiles ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading more…
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Uses <span className="text-slate-400">GET /profiles/admin</span> (10 per page). Type to search; scroll to
              load more. The <code className="text-slate-400">search</code> query runs after you enter text.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asksky-agent-select" className="text-slate-200">
              Agent <span className="text-red-400">*</span>
            </Label>
            <Select
              value={agentToken || undefined}
              onValueChange={(value) => patch({ askSkyAgentToken: value })}
              disabled={!profileSlug}
            >
              <SelectTrigger
                id="asksky-agent-select"
                aria-required="true"
                className={`border-slate-600 bg-slate-900 text-white ${!agentToken ? "border-amber-600/60" : ""}`}
              >
                <SelectValue
                  placeholder={
                    !profileSlug ? "Choose profile first" : "Choose agent"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[min(320px,60vh)] border-slate-600 bg-slate-900 text-slate-100">
                <div className="max-h-[280px] overflow-y-auto p-1">
                  {agentToken && !tokenInActiveAgentOptions ? (
                    <SelectItem
                      value={agentToken}
                      className="focus:bg-slate-800 focus:text-white text-slate-200"
                    >
                      {selectedAgentLabel}
                    </SelectItem>
                  ) : null}
                  {loadingAgents ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-xs text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading agents…
                    </div>
                  ) : null}
                  {!loadingAgents && profileSlug && activeAgentOptions.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-slate-400">
                      No active agents with a public token found for this profile.
                    </div>
                  ) : null}
                  {activeAgentOptions.map((o) => (
                    <SelectItem
                      key={o.id}
                      value={o.token}
                      className="focus:bg-slate-800 focus:text-white text-slate-200"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
            {selectedAgentIsInactive ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                This agent is inactive. AskSKY will not work for visitors until you activate the agent in Agent
                management.
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Interface variant</Label>
            <Select
              value={variant}
              onValueChange={(value) => patch({ askSkyVariant: value as AskSkyVariant })}
            >
              <SelectTrigger className="border-slate-600 bg-slate-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-900 text-slate-100">
                <SelectItem value="inline">Embedded inline</SelectItem>
                <SelectItem value="chatbot">Chatbot style (floating)</SelectItem>
                <SelectItem value="voice">Voice line (coming soon)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Voice line shows a &quot;Coming soon&quot; placeholder in the published page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
