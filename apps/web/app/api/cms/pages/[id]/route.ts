import { NextRequest } from "next/server";
import { buildApiUrl } from "@/lib/config";
import { proxyToBackend, toJsonResponse } from "../../_lib";
import { revalidateTagsWithAudit } from "../../../_lib/cache-invalidation";

type PageLike = {
  handle?: string;
  parentHandle?: string | null;
};

function revalidatePageTags(page?: PageLike | null) {
  if (!page?.handle) return;
  if (page.parentHandle) {
    revalidateTagsWithAudit("cms-pages-id", [`cms-page:${page.parentHandle}/${page.handle}`]);
    return;
  }
  revalidateTagsWithAudit("cms-pages-id", [`cms-page:${page.handle}`]);
}

async function getExistingPage(
  request: NextRequest,
  id: string,
): Promise<PageLike | null> {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("auth_access_token")?.value;
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers.Authorization = authHeader;
  } else if (cookieToken) {
    headers.Authorization = `Bearer ${cookieToken}`;
  }

  const response = await fetch(buildApiUrl(`cms/pages/${id}`), {
    method: "GET",
    headers,
  });
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as PageLike | null;
  return data;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await getExistingPage(request, id);
  const result = await proxyToBackend(request, `cms/pages/${id}`, "PATCH");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  revalidatePageTags(existing);
  revalidatePageTags(result.data as PageLike);
  return toJsonResponse(200, result.data);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await getExistingPage(request, id);
  const result = await proxyToBackend(request, `cms/pages/${id}`, "DELETE");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  revalidatePageTags(existing);
  return toJsonResponse(200, result.data);
}
