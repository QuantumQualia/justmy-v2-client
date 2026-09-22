export const PERSONAL_OS_HOME = "/personal-os";
export const PERSONAL_OS_WELCOME = "/personal-os?welcome=1";

export function isPersonalOsPath(pathname: string) {
  return pathname === PERSONAL_OS_HOME || pathname.startsWith(`${PERSONAL_OS_HOME}/`);
}

export function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard");
}
