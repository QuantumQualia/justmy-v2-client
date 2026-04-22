import { NextRequest } from "next/server";
import { proxyToBackend, toJsonResponse } from "../_lib";
import { revalidateTagsWithAudit } from "../../_lib/cache-invalidation";

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

function revalidateProfileSlug(data: ProfileLike | null | undefined) {
  const slug = extractSlug(data);
  if (!slug) return;
  revalidateTagsWithAudit("profiles-id", [`public-profile:${slug}`]);
}

async function getExistingProfile(
  request: NextRequest,
  id: string,
): Promise<ProfileLike | null> {
  const result = await proxyToBackend(request, `profiles/${id}`, "GET");
  if (!result.ok) return null;
  return result.data as ProfileLike;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await getExistingProfile(request, id);
  const result = await proxyToBackend(request, `profiles/${id}`, "PATCH");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  revalidateProfileSlug(existing);
  revalidateProfileSlug(result.data as ProfileLike);
  return toJsonResponse(200, result.data);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await getExistingProfile(request, id);
  const result = await proxyToBackend(request, `profiles/${id}`, "DELETE");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  revalidateProfileSlug(existing);
  return toJsonResponse(200, result.data);
}
