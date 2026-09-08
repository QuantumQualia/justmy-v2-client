import { type OsName } from "@/lib/os-types";

/** Slim identity kept in the auth_user cookie (must stay well under 4KB). */
export type ImpersonationActor = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

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
  /** Present while a site admin is viewing the site as this user. */
  impersonatedBy?: ImpersonationActor;
};

export function isPlatformAdmin(user?: { role?: string | null } | null): boolean {
  return String(user?.role || "").toUpperCase() === "ADMIN";
}

export function isImpersonating(
  user?: { impersonatedBy?: ImpersonationActor | null } | null,
): boolean {
  return Boolean(user?.impersonatedBy?.id);
}

export function withImpersonation<T extends StoredAuthUser>(
  user: T,
  impersonation?: { active?: boolean; impersonatedBy?: ImpersonationActor | null } | null,
): T {
  if (impersonation?.active && impersonation.impersonatedBy?.id) {
    return { ...user, impersonatedBy: impersonation.impersonatedBy };
  }
  return user;
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
    impersonatedBy?: ImpersonationActor;
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
    impersonatedBy: user.impersonatedBy?.id ? user.impersonatedBy : undefined,
  };
}
