import { ApiClientError } from "./api-client-error";

function getHttpStatusAndMessage(e: unknown): { status: number; message: string } | null {
  if (e instanceof ApiClientError) {
    return { status: e.status, message: e.message };
  }
  if (e && typeof e === "object" && "statusCode" in e) {
    const sc = (e as { statusCode?: number }).statusCode;
    if (typeof sc === "number") {
      const msg =
        "message" in e && typeof (e as { message?: unknown }).message === "string"
          ? (e as { message: string }).message
          : "";
      return { status: sc, message: msg };
    }
  }
  return null;
}

/** Map HTTP status + server message to copy suitable for embed / widget UI. */
export function formatAskSkyUserFacingError(e: unknown): string {
  const http = getHttpStatusAndMessage(e);
  if (http) {
    const server = http.message.trim();
    const { status } = http;

    if (status === 404) {
      return (
        server ||
        "This AskSKY widget could not be found. Check the profile link and agent token, or ask the site owner to update the embed."
      );
    }
    if (status === 400) {
      return server || "The request could not be completed. Please check your message and try again.";
    }
    if (status === 403) {
      return server || "You do not have access to this conversation.";
    }
    if (status === 429) {
      return server || "Too many requests. Please wait a moment and try again.";
    }
    if (status === 502 || status === 503 || status === 504) {
      return server
        ? `AskSKY is temporarily unavailable (${status}). ${server}`
        : "AskSKY is temporarily unavailable. Please try again in a few minutes.";
    }
    if (status >= 500) {
      return server
        ? `Something went wrong on our side. ${server}`
        : "Something went wrong on our side. Please try again in a few minutes.";
    }
    return server || "Something went wrong. Please try again.";
  }
  if (e instanceof Error && e.message.trim()) {
    return e.message;
  }
  return "Something went wrong. Please try again.";
}
