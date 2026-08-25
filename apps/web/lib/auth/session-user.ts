import { type OsName } from "@/lib/os-types";

/** Slim identity kept in the auth_user cookie (must stay well under 4KB). */
export type StoredAuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  /** Platform User.role — not ProfileMember.role. */
  role?: "USER" | "ADMIN";
  osName?: OsName;
  /** @deprecated read osName; still written so older cookies keep working */
  profileType?: OsName;
  profileId?: number;
};

export function isPlatformAdmin(user?: { role?: string | null } | null): boolean {
  return String(user?.role || "").toUpperCase() === "ADMIN";
}

export function parseProfileId(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function slimAuthUser(
  user: {
    id?: string | number;
    email?: string;
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean | null;
    role?: string | null;
    osName?: string;
    profileType?: string;
    profileId?: number;
    profile?: { id?: string | number; osName?: string; type?: string };
  } | null | undefined,
  profile?: { id?: string | number; osName?: string; type?: string } | null,
): StoredAuthUser | null {
  if (!user?.id || !user.email) return null;
  const osName = String(
    profile?.osName ||
      profile?.type ||
      user.osName ||
      user.profileType ||
      user.profile?.osName ||
      user.profile?.type ||
      "",
  ).toUpperCase();
  const profileId = parseProfileId(profile?.id ?? user.profileId ?? user.profile?.id);
  return {
    id: String(user.id),
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    emailVerified: Boolean(user.emailVerified),
    role: String(user.role || "").toUpperCase() === "ADMIN" ? "ADMIN" : "USER",
    osName: (osName || undefined) as OsName | undefined,
    profileType: (osName || undefined) as OsName | undefined,
    profileId,
  };
}
