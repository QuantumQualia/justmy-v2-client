"use client";

import { useEffect, useState } from "react";

import { tokenStorage } from "@/lib/storage/token-storage";

type StoredUser = {
  firstName?: string | null;
};

/** Login state for homepage copy. Missing first name stays signed-in but unpersonalized. */
export function useNewsVisitor() {
  const [signedIn, setSignedIn] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    tokenStorage
      .getUser<StoredUser>()
      .then((user) => {
        if (cancelled) return;
        setSignedIn(Boolean(user));
        const name = user?.firstName?.trim() || null;
        setFirstName(name);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { signedIn, firstName, ready };
}

export function timeOfDayGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

export function useTimeOfDayGreeting(): string | null {
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(timeOfDayGreeting(new Date()));
  }, []);
  return greeting;
}

/** Insert the visitor's first name at the start of sponsor-authored copy. */
export function personalizePitch(pitch: string, firstName: string | null): string {
  const text = pitch.trim();
  if (!text || !firstName) return text;
  if (text.toLowerCase().startsWith(firstName.toLowerCase())) return text;
  return `${firstName}, ${text}`;
}

export function formatRelativeTime(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const deltaMs = now.getTime() - then.getTime();
  const minutes = Math.round(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const dayGap = Math.round((startToday.getTime() - startThen.getTime()) / 86400000);
  if (dayGap === 1) return "Yesterday";
  if (dayGap > 1 && dayGap < 14) return `${dayGap} days ago`;
  return then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(then.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });
}
