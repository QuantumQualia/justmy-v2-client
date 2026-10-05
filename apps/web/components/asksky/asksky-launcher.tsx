"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AskSkyTextCard } from "@/components/asksky/asksky-text-card";
import { isLikelyHandlePath } from "@/lib/mycard/handle-route";
import { useNewsHost } from "@/lib/news/news-host-context";
import { Button } from "@workspace/ui/components/button";
import { SkyAvatar } from "@workspace/ui/components/sky-avatar";

/** Pages that already have their own Sky chat, or where a launcher would get in the way. */
const HIDDEN_PREFIXES = [
  "/embed",
  "/news",
  "/biz-os",
  "/personal-os",
  "/admin",
  "/try-free",
  "/p/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function launcherHidden(pathname: string, newsHost: boolean) {
  if (newsHost && pathname === "/") return true;
  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`))) {
    return true;
  }
  // myCARD pages carry the business's own AskSKY! widget.
  return isLikelyHandlePath(pathname);
}

/** Floating "AskSKY!" pill that opens the compact texting card. */
export function AskSkyLauncher() {
  const pathname = usePathname() || "/";
  const newsHost = useNewsHost();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (launcherHidden(pathname, newsHost)) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)]">
      {open ? (
        <div
          role="dialog"
          aria-label="AskSKY!"
          className="asksky-msg-in pointer-events-auto relative w-[min(calc(100vw-2rem),22rem)]"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setOpen(false)}
            className="absolute -top-3 -right-2 z-10 size-8 rounded-full bg-card shadow-card"
            aria-label="Close AskSKY!"
          >
            <X />
          </Button>
          <AskSkyTextCard
            intro="Hey, I'm Sky - ask me anything about what's going on nearby."
            sampleQuestion="What's happening this weekend?"
            className="shadow-card"
          />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="asksky-sky-launcher pointer-events-auto"
      >
        <SkyAvatar size={28} />
        AskSKY!
      </button>
    </div>
  );
}
