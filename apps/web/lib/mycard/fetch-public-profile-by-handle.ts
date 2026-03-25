import { cache } from "react";

import type { ProfileData } from "@/lib/store";
import { mapApiProfileToProfileData } from "@/lib/store/profile-mapper";
import { profilesService } from "@/lib/services/profiles";

/**
 * Single-flight profile fetch for a given slug within one RSC request.
 *
 * In Next.js App Router, React {@link cache} dedupes by arguments for the lifetime of
 * that request. These all share one `getProfileBySlug` call when the trimmed handle matches:
 * - `app/layout.tsx` (navbar hint from `x-pathname`)
 * - `generateMetadata` in `app/[handle]/page.tsx`
 * - the `[handle]` page component
 *
 * Note: If the layout segment and `params.handle` ever differ (encoding/casing), you get
 * separate cache entries and multiple API calls — keep sources aligned.
 */
const fetchPublicProfileByHandleImpl = cache(
  async (handle: string): Promise<ProfileData | null> => {
    try {
      const response = await profilesService.getProfileBySlug(handle);
      if (!response?.profile) return null;
      return mapApiProfileToProfileData(response.profile);
    } catch (error) {
      console.error("Failed to fetch profile by handle:", error);
      return null;
    }
  }
);

export async function fetchPublicProfileByHandle(
  handle: string
): Promise<ProfileData | null> {
  const h = handle.trim();
  if (!h) return null;
  return fetchPublicProfileByHandleImpl(h);
}
