"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfileStore } from "@/lib/store";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import type { ReferredProfile } from "./refer-a-friend";

/** Default page size for referrals list. */
const PAGE_SIZE = 10;

/** API response for paginated list of profiles referred by current profile. */
interface PaginatedReferralsResponse {
  data?: Array<{
    id: string;
    name: string;
    slug: string;
    osName: string;
    zipCode: string;
    referralCode: string | null;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetches the paginated list of profiles that signed up using the current profile's referral code.
 * Uses profile store's profile id to call GET /profiles/:id/referrals?page=&limit=.
 */
export function useReferrals() {
  const profileId = useProfileStore((s) => s.data.id);
  const [referrals, setReferrals] = useState<ReferredProfile[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReferrals = useCallback(
    async (targetPage = 1) => {
      if (!profileId) {
        setReferrals(null);
        setTotal(0);
        setTotalPages(1);
        setPage(1);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // GET /profiles/:id/referrals returns paginated list of profiles who signed up with this profile's referral code
        const data = await apiRequest<PaginatedReferralsResponse>(
          `profiles/${profileId}/referrals`,
          {
            params: {
              page: targetPage,
              limit: PAGE_SIZE,
            },
          }
        );

        const items = data?.data ?? [];

        if (items.length > 0) {
          setReferrals(
            items.map((r) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              osName: r.osName,
              joinedAt: r.createdAt,
            }))
          );
        } else {
          setReferrals([]);
        }

        setTotal(data?.total ?? items.length);
        setTotalPages(data?.totalPages ?? 1);
        setPage(data?.page ?? targetPage);
        setError(null);
      } catch (e) {
        // 404 = endpoint not implemented yet; show empty list
        if (e instanceof ApiClientError && e.statusCode === 404) {
          setReferrals([]);
          setTotal(0);
          setTotalPages(1);
          setPage(1);
          setError(null);
        } else {
          setError(e instanceof Error ? e.message : "Failed to load referrals");
          setReferrals([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [profileId]
  );

  useEffect(() => {
    void fetchReferrals(1);
  }, [fetchReferrals]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      if (totalPages && newPage > totalPages) return;
      void fetchReferrals(newPage);
    },
    [fetchReferrals, totalPages]
  );

  return {
    referrals,
    isLoading,
    error,
    page,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    refetch: () => fetchReferrals(page),
    goToPage,
  };
}
