import type { SkyMessageRequest } from "./sky-types";

/** POST /sky/messages body: omit `conversationId` / `visitorToken` on first message per API contract. */
export function buildSkyMessageRequestBody(body: SkyMessageRequest): Record<string, string | number> {
  const out: Record<string, string | number> = {
    profileSlug: body.profileSlug,
    agentToken: body.agentToken,
    message: body.message,
  };
  const cid = body.conversationId;
  if (typeof cid === "number" && cid > 0 && Number.isFinite(cid)) {
    out.conversationId = cid;
  }
  const vt = typeof body.visitorToken === "string" ? body.visitorToken.trim() : "";
  if (vt.length > 0) {
    out.visitorToken = vt;
  }
  return out;
}
