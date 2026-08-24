"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, type User } from "@/lib/services/auth";
import { bizOsService } from "@/lib/services/biz-os";
import { tokenStorage } from "@/lib/storage/token-storage";
import { useProfileStore } from "@/lib/store";
import type { StoredAuthUser } from "@/lib/auth/session-user";
import { profileIdFromMe } from "@/lib/biz-os/landing";

export const bizOsQueryKeys = {
  me: ["auth", "me"] as const,
  home: (profileId: number) => ["biz-os", "home", profileId] as const,
};

export const BIZ_OS_PAGE_DATA_EVENT = "biz-os:page-data";
export const BIZ_OS_CONNECT_GOOGLE_EVENT = "biz-os:connect-google";

export function bumpBizOsPageData() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BIZ_OS_PAGE_DATA_EVENT));
}

function readCachedMe(): User | undefined {
  const stored = tokenStorage.getUserSync<StoredAuthUser>();
  if (!stored?.id) return undefined;
  const profileId = stored.profileId ?? useProfileStore.getState().data.id;
  return {
    id: stored.id,
    email: stored.email,
    firstName: stored.firstName,
    lastName: stored.lastName,
    emailVerified: stored.emailVerified,
    role: stored.role,
    profileType: stored.profileType,
    profileId,
    profile: profileId != null ? { id: profileId } : undefined,
  };
}

/** Cookie reads happen after mount so SSR HTML matches the first client paint. */
function useBizOsSession() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState({ seeded: false, hasToken: false });

  useEffect(() => {
    const hasToken = Boolean(tokenStorage.getAccessTokenSync());
    const cached = hasToken ? readCachedMe() : undefined;
    if (cached && !queryClient.getQueryData(bizOsQueryKeys.me)) {
      queryClient.setQueryData(bizOsQueryKeys.me, cached);
    }
    setSession({ seeded: true, hasToken });
  }, [queryClient]);

  return session;
}

export function useBizOsMeQuery() {
  const session = useBizOsSession();
  const query = useQuery({
    queryKey: bizOsQueryKeys.me,
    queryFn: () => authService.getCurrentUser(),
    enabled: session.seeded && session.hasToken,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return { ...query, session };
}

export function useBizOsProfile() {
  const meQuery = useBizOsMeQuery();
  const profileId = meQuery.data
    ? profileIdFromMe(meQuery.data as User & { profile?: { id?: string | number } })
    : null;
  const { seeded, hasToken } = meQuery.session;

  return {
    profileId,
    ready:
      seeded &&
      (!hasToken || Boolean(meQuery.data) || meQuery.isFetched || meQuery.isError),
    me: meQuery.data ?? null,
    isError: seeded && (!hasToken || meQuery.isError),
    reload: meQuery.refetch,
  };
}

export function useBizOsHome() {
  const { profileId, ready, isError, me } = useBizOsProfile();
  const homeQuery = useQuery({
    queryKey: bizOsQueryKeys.home(profileId ?? 0),
    queryFn: () => bizOsService.home(profileId as number),
    enabled: ready && !isError && profileId != null,
  });

  return {
    data: homeQuery.data ?? null,
    ready: ready && (profileId == null || homeQuery.isSuccess || homeQuery.isError),
    profileId,
    me,
    isError: isError || homeQuery.isError,
  };
}

/**
 * Load page-specific Biz OS data. Stays on the skeleton until the fetch for
 * the current profile finishes — `useBizOsProfile().ready` only means the user is known.
 */
export function useBizOsFetch<T>(
  fetcher: (profileId: number) => Promise<T>,
  initial: T,
  extraKey?: string | number,
) {
  const { profileId, ready, isError, me } = useBizOsProfile();
  const [data, setData] = useState<T>(initial);
  const [forKey, setForKey] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const currentKey = ready ? `${profileId ?? "anon"}:${extraKey ?? ""}` : null;

  useEffect(() => {
    const onBump = () => setRefreshTick((n) => n + 1);
    window.addEventListener(BIZ_OS_PAGE_DATA_EVENT, onBump);
    return () => window.removeEventListener(BIZ_OS_PAGE_DATA_EVENT, onBump);
  }, []);

  useEffect(() => {
    if (currentKey == null) return;
    let cancelled = false;
    void (async () => {
      try {
        if (profileId != null) {
          const value = await fetcherRef.current(profileId);
          if (!cancelled) setData(value);
        } else if (!cancelled) {
          setData(initial);
        }
      } catch {
        if (!cancelled) setData(initial);
      } finally {
        if (!cancelled) setForKey(currentKey);
      }
    })();
    return () => {
      cancelled = true;
    };
    // `initial` is a stable empty value from the caller ([] / null).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, profileId, refreshTick]);

  return {
    data,
    setData,
    pageReady: currentKey != null && forKey === currentKey,
    profileId,
    me,
    isError,
  };
}

/** Zustand persist writes empty profile first, then rehydrates from localStorage. */
export function useProfileStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mark = () => setHydrated(true);
    if (useProfileStore.persist.hasHydrated()) {
      mark();
      return;
    }
    return useProfileStore.persist.onFinishHydration(mark);
  }, []);

  return hydrated;
}

export function useInvalidateBizOsHome() {
  const queryClient = useQueryClient();
  const { profileId } = useBizOsProfile();
  return () => {
    if (profileId == null) {
      return queryClient.invalidateQueries({ queryKey: ["biz-os", "home"] });
    }
    return queryClient.invalidateQueries({ queryKey: bizOsQueryKeys.home(profileId) });
  };
}
