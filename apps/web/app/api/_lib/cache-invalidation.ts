import { revalidateTag } from "next/cache";

const ALLOWED_TAG_PREFIXES = ["cms-page:", "cms-post:", "public-profile:"] as const;

function isAllowedTag(tag: string): boolean {
  return ALLOWED_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix));
}

export function filterAllowedTags(tags: string[]): string[] {
  return tags.filter(isAllowedTag);
}

export function revalidateTagsWithAudit(source: string, tags: string[]) {
  const uniqueAllowedTags = [...new Set(filterAllowedTags(tags))];
  if (uniqueAllowedTags.length === 0) return [];

  for (const tag of uniqueAllowedTags) {
    revalidateTag(tag, "max");
  }

  console.info("[cache-revalidate]", {
    source,
    tags: uniqueAllowedTags,
    count: uniqueAllowedTags.length,
    at: new Date().toISOString(),
  });

  return uniqueAllowedTags;
}
