import { NextRequest } from "next/server";
import { proxyToBackend, toJsonResponse } from "../_lib";
import { revalidateTagsWithAudit } from "../../_lib/cache-invalidation";

export async function POST(request: NextRequest) {
  const result = await proxyToBackend(request, "cms/posts", "POST");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  const post = result.data as { slug?: string };
  revalidateTagsWithAudit("cms-posts-post", post?.slug ? [`cms-post:${post.slug}`] : []);

  return toJsonResponse(200, post);
}
