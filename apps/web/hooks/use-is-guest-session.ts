"use client";

import { useEffect, useState } from "react";

import { tokenStorage } from "@/lib/storage/token-storage";
import { useProfileStore } from "@/lib/store/profile-store";

/** `null` until storage is checked so guest-only chrome does not flash for signed-in users. */
export function useIsGuestSession(): boolean | null {
  const profileId = useProfileStore((s) => s.data.id);
  const [guest, setGuest] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = await tokenStorage.getUser();
        const token = user ? true : Boolean(await tokenStorage.getAccessToken());
        if (!cancelled) setGuest(!user && !token);
      } catch {
        if (!cancelled) setGuest(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return guest;
}
