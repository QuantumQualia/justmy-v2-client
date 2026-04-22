import { NextRequest } from "next/server";
import { proxyToBackend, toJsonResponse } from "../_lib";
import { revalidateTagsWithAudit } from "../../_lib/cache-invalidation";

export async function POST(request: NextRequest) {
  const result = await proxyToBackend(request, "cms/pages", "POST");
  if (!result.ok) {
    return toJsonResponse(result.status, result.data);
  }

  const page = result.data as {
    handle?: string;
    parentHandle?: string | null;
  };

  const tags =
    page?.handle && page.parentHandle
      ? [`cms-page:${page.parentHandle}/${page.handle}`]
      : page?.handle
        ? [`cms-page:${page.handle}`]
        : [];
  revalidateTagsWithAudit("cms-pages-post", tags);

  return toJsonResponse(200, page);
}
