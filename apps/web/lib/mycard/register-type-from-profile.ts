import type { ProfileData } from "@/lib/store";

const VALID_REGISTER_TYPES = new Set<string>([
  "personal",
  "biz",
  "growth",
  "founder",
  "city",
  "network",
]);

/**
 * Maps the viewed public profile to a `register?type=` value (see `register-form.tsx`).
 */
export function registerTypeFromProfile(
  profile: Pick<ProfileData, "type" | "osName">
): string {
  if (profile.type && VALID_REGISTER_TYPES.has(profile.type)) {
    return profile.type;
  }

  const raw = (profile.osName ?? "").trim().toLowerCase();
  if (!raw) {
    return "personal";
  }

  if (raw.includes("founder")) return "founder";
  if (raw.includes("network")) return "network";
  if (raw.includes("city")) return "city";
  if (raw.includes("growth")) return "growth";
  if (raw.includes("biz") || raw.includes("business")) return "biz";
  if (raw.includes("personal")) return "personal";

  return "personal";
}
