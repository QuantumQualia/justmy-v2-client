"use client";

import { useEffect, useState } from "react";

import { tokenStorage } from "@/lib/storage/token-storage";
import { useProfileStore } from "@/lib/store/profile-store";

/** `null` until storage is checked so guest-only chrome does not flash for signed-in users. */
export function useIsGuestSession(): boolean | null {
  const profileId = useProfileStore((s) => s.data.id);
  const [guest, setGuest] = useState<boolean | null>(null);

  useEffect(() => {
    if (profileId) {
      setGuest(false);
      return;
    }
    let cancelled = false;
    void tokenStorage
      .getUser()
      .then((user) => {
        if (!cancelled) setGuest(!user);
      })
      .catch(() => {
        if (!cancelled) setGuest(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return guest;
}
