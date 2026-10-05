"use client";

import { Flame } from "lucide-react";
import { useEffect } from "react";

import { useIsGuestSession } from "@/hooks/use-is-guest-session";
import { useNewsAuthUiStore } from "@/lib/store/news-auth-ui-store";
import { useSkyStreakStore } from "@/lib/store/sky-streak-store";
import { cn } from "@workspace/ui/lib/utils";

const GUEST_REWARD = 5;

/** "4-day streak · ask today for +5 myCREDITS" under the AskSKY! chat title. */
export function AskSkyStreakLine({ className }: { className?: string }) {
  const guest = useIsGuestSession();
  const status = useSkyStreakStore((s) => s.status);
  const hydrate = useSkyStreakStore((s) => s.hydrate);
  const openAuth = useNewsAuthUiStore((s) => s.openAuth);

  useEffect(() => {
    if (guest === false) void hydrate();
  }, [guest, hydrate]);

  if (guest) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        <button type="button" onClick={openAuth} className="font-semibold text-primary hover:underline">
          Sign in
        </button>{" "}
        to earn +{GUEST_REWARD} myCREDITS for asking every day
      </p>
    );
  }

  if (!status) return <p className={cn("h-4", className)} aria-hidden />;

  const days = status.streak;
  const lead = days > 0 ? `${days}-day streak` : "Start a streak";
  const tail = status.askedToday
    ? `+${status.reward} myCREDITS earned today`
    : `ask today for +${status.reward} myCREDITS`;

  return (
    <p className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Flame className={cn("size-3.5", days > 0 ? "text-primary" : "text-muted-foreground")} aria-hidden />
      <span>
        <span className="font-semibold text-foreground">{lead}</span> · {tail}
      </span>
    </p>
  );
}
