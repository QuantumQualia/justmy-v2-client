import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/config";

function readAuthToken(request: NextRequest): string | null {
  const headerToken = request.headers.get("authorization");
  if (headerToken) return headerToken;

  const cookieToken = request.cookies.get("auth_access_token")?.value;
  if (!cookieToken) return null;
  return `Bearer ${cookieToken}`;
}

export async function proxyToBackend(
  request: NextRequest,
  endpoint: string,
  method: "POST" | "PATCH" | "DELETE",
) {
  const authHeader = readAuthToken(request);
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  let body: string | undefined;
  if (method !== "DELETE") {
    try {
      const payload = await request.json();
      body = JSON.stringify(payload);
      headers["Content-Type"] = "application/json";
    } catch {
      body = undefined;
    }
  }

  const response = await fetch(buildApiUrl(endpoint), {
    method,
    headers,
    body,
  });

  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text || "Unexpected response from backend." };
  }

  return {
    ok: response.ok,
    status: response.status,
    data: json,
  };
}

export function toJsonResponse(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}
