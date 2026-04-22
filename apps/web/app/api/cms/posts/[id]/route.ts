import { NextRequest } from "next/server";
import { buildApiUrl } from "@/lib/config";
import { proxyToBackend, toJsonResponse } from "../../_lib";
import { revalidateTagsWithAudit } from "../../../_lib/cache-invalidation";

type PostLike = { slug?: string };

function revalidatePostTag(post?: PostLike | null) {
  if (!post?.slug) return;
  revalidateTagsWithAudit("cms-posts-id", [`cms-post:${post.slug}`]);
}

async function getExistingPost(
  request: NextRequest,
  id: string,
): Promise<PostLike | null> {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("auth_access_token")?.value;
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers.Authorization = authHeader;
  } else if (cookieToken) {
    headers.Authorization = `Bearer ${cookieToken}`;
  }

  const response = await fetch(buildApiUrl(`cms/posts/${id}`), {
    method: "GET",
    headers,
  });
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as PostLike | null;
  return data;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await getExistingPost(request, id);
  const result = await proxyToBackend(request, `cms/posts/${id}`, "PATCH");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  revalidatePostTag(existing);
  revalidatePostTag(result.data as PostLike);
  return toJsonResponse(200, result.data);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await getExistingPost(request, id);
  const result = await proxyToBackend(request, `cms/posts/${id}`, "DELETE");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  revalidatePostTag(existing);
  return toJsonResponse(200, result.data);
}
