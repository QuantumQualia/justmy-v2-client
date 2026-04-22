import { NextRequest, NextResponse } from "next/server";
import { filterAllowedTags, revalidateTagsWithAudit } from "../_lib/cache-invalidation";

type RevalidatePayload = {
  tags?: string[];
  page?: {
    handle?: string;
    parentHandle?: string;
    subHandle?: string;
  };
  post?: {
    slug?: string;
  };
  profile?: {
    handle?: string;
    slug?: string;
  };
};

function cleanSegment(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildTagsFromPayload(payload: RevalidatePayload): string[] {
  const tags = new Set<string>();

  for (const tag of payload.tags ?? []) {
    const normalized = cleanSegment(tag);
    if (normalized) tags.add(normalized);
  }

  const handle = cleanSegment(payload.page?.handle);
  const parentHandle = cleanSegment(payload.page?.parentHandle);
  const subHandle = cleanSegment(payload.page?.subHandle);

  if (handle && parentHandle && subHandle) {
    tags.add(`cms-page:${handle}/${parentHandle}/${subHandle}`);
  } else if (handle && parentHandle) {
    tags.add(`cms-page:${handle}/${parentHandle}`);
  } else if (handle) {
    tags.add(`cms-page:${handle}`);
  }

  const postSlug = cleanSegment(payload.post?.slug);
  if (postSlug) {
    tags.add(`cms-post:${postSlug}`);
  }

  const profileHandle = cleanSegment(payload.profile?.handle ?? payload.profile?.slug);
  if (profileHandle) {
    tags.add(`public-profile:${profileHandle}`);
  }

  return [...tags];
}

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-revalidate-secret");
  if (headerSecret === expectedSecret) {
    return true;
  }

  const querySecret = request.nextUrl.searchParams.get("secret");
  if (querySecret === expectedSecret) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  const manualEndpointEnabled =
    process.env.ENABLE_MANUAL_REVALIDATE_ENDPOINT === "true";
  if (!manualEndpointEnabled) {
    return NextResponse.json(
      {
        ok: false,
        error: "Manual revalidation endpoint is disabled.",
      },
      { status: 404 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized revalidation request.",
      },
      { status: 401 }
    );
  }

  let payload: RevalidatePayload = {};
  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    // Keep default empty payload; allows "tag-only via query" use in future.
  }

  const tags = filterAllowedTags(buildTagsFromPayload(payload));
  if (tags.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "No cache tags provided or derived from payload.",
      },
      { status: 400 }
    );
  }

  const revalidatedTags = revalidateTagsWithAudit("manual-api", tags);

  return NextResponse.json({
    ok: true,
    revalidatedTags,
  });
}
