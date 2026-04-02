import type { ProfileData } from "@/lib/store";
import type { ProfileKind } from "@/lib/os-types";
import {
  DEFAULT_PROFILE_KIND,
  normalizeProfileKindInput,
  osNameToProfileKind,
} from "@/lib/os-types";

/**
 * Resolves the viewed public profile to a **canonical** `ProfileKind` (backend wire values only).
 * For user-facing register URLs use `profileKindToRegisterQueryParam(kind)` on the result.
 */
export function registerTypeFromProfile(
  profile: Pick<ProfileData, "type" | "osName">
): ProfileKind {
  if (profile.type) {
    const resolved = normalizeProfileKindInput(profile.type);
    if (resolved) return resolved;
  }

  const os = (profile.osName ?? "").trim();
  if (os) {
    const fromOs = osNameToProfileKind(os);
    if (fromOs) return fromOs;
  }

  const raw = (profile.osName ?? "").trim().toLowerCase();
  if (!raw) {
    return DEFAULT_PROFILE_KIND;
  }

  if (raw.includes("founder")) return "founder";
  if (raw.includes("network")) return "network";
  if (raw.includes("city")) return "city";
  if (raw.includes("command")) return "growth";
  if (raw.includes("growth")) return "growth";
  if (raw.includes("biz") || raw.includes("business")) return "biz";
  if (raw.includes("personal")) return "personal";

  return DEFAULT_PROFILE_KIND;
}
