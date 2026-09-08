"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { isImpersonating, type StoredAuthUser } from "@/lib/auth/session-user";
import { authService } from "@/lib/services/auth";
import { tokenStorage } from "@/lib/storage/token-storage";

function readSessionUser(): StoredAuthUser | null {
  return tokenStorage.getUserSync<StoredAuthUser>();
}

export function ImpersonationBanner() {
  const [user, setUser] = useState<StoredAuthUser | null>(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    const sync = () => setUser(readSessionUser());
    sync();
    const timer = window.setInterval(sync, 2000);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const active = isImpersonating(user) && Boolean(user);

  useEffect(() => {
    if (!active) {
      document.documentElement.style.setProperty("--impersonation-banner-h", "0px");
      return;
    }
    document.documentElement.style.setProperty("--impersonation-banner-h", "2.5rem");
    return () => {
      document.documentElement.style.setProperty("--impersonation-banner-h", "0px");
    };
  }, [active]);

  if (!active || !user) return null;

  const viewingAs = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const admin = user.impersonatedBy;
  const adminLabel = admin
    ? [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email
    : "admin";

  async function handleStop() {
    if (stopping) return;
    setStopping(true);
    try {
      await authService.stopImpersonation();
      window.location.assign("/admin/users");
    } catch (error) {
      console.error(error);
      setStopping(false);
      window.alert("Could not restore your admin session. Try signing in again.");
    }
  }

  return (
    <>
      <div className="h-10" aria-hidden="true" />
      <div className="fixed inset-x-0 top-0 z-[400] flex h-10 items-center justify-between gap-3 bg-amber-500 px-3 text-amber-950 shadow-md md:px-4">
        <p className="min-w-0 truncate text-sm font-medium">
          Viewing as {viewingAs}
          {user.email && viewingAs !== user.email ? ` (${user.email})` : ""}
          {adminLabel ? ` · signed in as ${adminLabel}` : ""}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleStop}
          disabled={stopping}
          className="h-7 shrink-0 bg-white text-amber-950 hover:bg-amber-100"
        >
          {stopping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Stop impersonating"}
        </Button>
      </div>
    </>
  );
}
