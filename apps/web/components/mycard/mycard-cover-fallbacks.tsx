function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function coverColorsFromName(name: string) {
  const h = hueFromName(name.trim() || "mycard");
  const h2 = (h + 36) % 360;
  return {
    from: `hsl(${h} 52% 46%)`,
    mid: `hsl(${h2} 48% 34%)`,
    to: `hsl(${h} 44% 24%)`,
    avatarFrom: `hsl(${h} 54% 42%)`,
    avatarTo: `hsl(${h2} 50% 28%)`,
  };
}

export function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function hasMycardMedia(url?: string | null): boolean {
  return Boolean(url?.trim());
}

export function MycardFallbackBanner({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { from, mid, to } = coverColorsFromName(name);
  return (
    <div
      className={className ?? "h-full w-full"}
      style={{
        background: `linear-gradient(155deg, ${from} 0%, ${mid} 52%, ${to} 100%)`,
      }}
      aria-hidden
    />
  );
}

export function MycardProfileAvatar({
  name,
  photo,
}: {
  name: string;
  photo?: string | null;
}) {
  if (hasMycardMedia(photo)) {
    return (
      <img
        src={photo!}
        alt={name}
        className="h-full w-full object-cover"
      />
    );
  }

  const { avatarFrom, avatarTo } = coverColorsFromName(name);
  return (
    <div
      className="flex h-full w-full items-center justify-center text-2xl font-bold tracking-tight text-white"
      style={{
        background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})`,
      }}
      aria-hidden
    >
      {initialsFromName(name)}
    </div>
  );
}
