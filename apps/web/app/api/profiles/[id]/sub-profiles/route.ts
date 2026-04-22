import { NextRequest } from "next/server";
import { proxyToBackend, toJsonResponse } from "../../_lib";
import { revalidateTagsWithAudit } from "../../../_lib/cache-invalidation";

type ProfileLike = {
  slug?: string;
  profile?: {
    slug?: string;
  };
};

function extractSlug(data: ProfileLike | null | undefined): string | null {
  const slug = data?.profile?.slug ?? data?.slug;
  if (typeof slug !== "string") return null;
  const trimmed = slug.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await proxyToBackend(request, `profiles/${id}/sub-profiles`, "POST");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  const created = result.data as ProfileLike;
  const createdSlug = extractSlug(created);
  revalidateTagsWithAudit(
    "profiles-id-sub-profiles-post",
    createdSlug ? [`public-profile:${createdSlug}`] : []
  );

  return toJsonResponse(200, result.data);
}
