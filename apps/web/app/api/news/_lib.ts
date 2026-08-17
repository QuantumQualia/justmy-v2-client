import { NextRequest, NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/config";

export function readNewsAuthHeader(request: NextRequest): string | null {
  const headerToken = request.headers.get("authorization");
  if (headerToken) return headerToken;

  const cookieToken = request.cookies.get("auth_access_token")?.value;
  if (!cookieToken) return null;
  return `Bearer ${cookieToken}`;
}

export async function proxyNewsToBackend(
  request: NextRequest,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  options?: { requireAuth?: boolean; body?: unknown },
): Promise<NextResponse> {
  const authHeader = readNewsAuthHeader(request);
  if (options?.requireAuth && !authHeader) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (authHeader) headers.Authorization = authHeader;

  let body: string | undefined;
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    if (options?.body !== undefined) {
      body = JSON.stringify(options.body);
      headers["Content-Type"] = "application/json";
    } else {
      try {
        const payload = await request.json();
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      } catch {
        body = undefined;
      }
    }
  }

  try {
    const res = await fetch(buildApiUrl(endpoint), {
      method,
      headers,
      body,
      cache: "no-store",
    });
    const text = await res.text();
    try {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json, { status: res.status });
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("content-type") || "text/plain",
        },
      });
    }
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the API." },
      { status: 502 },
    );
  }
}
