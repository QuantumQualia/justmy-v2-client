import { NextRequest, NextResponse } from "next/server";

/** Google lands here. Forward the code to Nest, then bounce to the plan. */
export async function GET(request: NextRequest) {
  const failed = new URL("/biz-os/settings?oauth=failed", request.nextUrl.origin);
  const apiBase = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!apiBase.startsWith("http")) {
    return NextResponse.redirect(failed);
  }
  let dest: URL;
  try {
    dest = new URL(`/biz-os/oauth-callback${request.nextUrl.search}`, `${apiBase}/`);
  } catch {
    return NextResponse.redirect(failed);
  }
  if (dest.origin === request.nextUrl.origin) {
    return NextResponse.redirect(failed);
  }
  try {
    const res = await fetch(dest, { redirect: "manual" });
    const location = res.headers.get("location");
    if (location) {
      const next = location.startsWith("http")
        ? location
        : new URL(location, request.nextUrl.origin).toString();
      return NextResponse.redirect(next);
    }
  } catch {
    /* fall through */
  }
  return NextResponse.redirect(failed);
}
