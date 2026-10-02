import { NextRequest } from "next/server";
import { proxyToBackend, toJsonResponse } from "../../../_lib";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await proxyToBackend(request, `cms/posts/${id}/newsstand`, "PATCH");
  return toJsonResponse(result.ok ? 200 : result.status, result.data);
}
