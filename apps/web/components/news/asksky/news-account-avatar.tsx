"use client";

import { cn } from "@workspace/ui/lib/utils";

type NewsAccountAvatarProps = {
  photoUrl?: string | null;
  label: string;
  size?: "sm" | "md";
  className?: string;
};

export function NewsAccountAvatar({
  photoUrl,
  label,
  size = "sm",
  className,
}: NewsAccountAvatarProps) {
  const initial = (label.trim() || "A").slice(0, 1).toUpperCase();
  const src = photoUrl?.trim() || "";

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-violet-600 to-cyan-400 font-bold text-white",
        size === "md" ? "h-11 w-11 text-sm" : "h-6 w-6 text-[10px]",
        className,
      )}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
