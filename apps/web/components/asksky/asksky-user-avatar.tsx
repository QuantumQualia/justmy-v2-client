"use client";

import { initialsFromName } from "@/components/mycard/mycard-cover-fallbacks";
import { useProfileStore } from "@/lib/store";
import { cn } from "@workspace/ui/lib/utils";

export function AskSkyUserAvatar({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const photo = useProfileStore((s) => s.data.photo);
  const name = useProfileStore((s) => s.data.name);
  const src = photo?.trim() || "";
  const label = name?.trim() || "You";
  const initials = name?.trim() ? initialsFromName(name) : "Y";

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-violet-600 to-cyan-400 font-bold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) }}
      title={label}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
