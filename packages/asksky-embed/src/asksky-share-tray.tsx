import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { openShareTrayLink, type AskSkyShareLink } from "./share-tray-links";
import type { SkyShareTrayChannel } from "./sky-types";

function ShareChannelIcon({ channel, className }: { channel: SkyShareTrayChannel; className?: string }) {
  const common = cn("h-3.5 w-3.5 shrink-0", className);
  const sizeProps = { width: 14, height: 14, viewBox: "0 0 24 24" as const };
  if (channel === "sms") {
    return (
      <svg {...sizeProps} fill="currentColor" className={common} aria-hidden>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
      </svg>
    );
  }
  if (channel === "whatsapp") {
    return (
      <svg {...sizeProps} fill="currentColor" className={common} aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }
  if (channel === "facebook") {
    return (
      <svg {...sizeProps} fill="currentColor" className={common} aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  return (
    <svg {...sizeProps} fill="currentColor" className={common} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

const channelAccent: Record<SkyShareTrayChannel, string> = {
  sms: "bg-sky-500/20 text-sky-200 ring-sky-400/35 hover:bg-sky-500/30",
  whatsapp: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/35 hover:bg-emerald-500/30",
  facebook: "bg-blue-500/20 text-blue-200 ring-blue-400/35 hover:bg-blue-500/30",
  x: "bg-slate-100/10 text-slate-100 ring-white/25 hover:bg-slate-100/20",
};

export function AskSkyShareTrayPanel({
  closingMessage,
  links,
  isEmbedInline,
  isGlassChrome,
  onClose,
}: {
  closingMessage: string;
  links: AskSkyShareLink[];
  isEmbedInline: boolean;
  isGlassChrome: boolean;
  onClose: () => void;
}) {
  const [lastShared, setLastShared] = React.useState<AskSkyShareLink["label"] | null>(null);
  const [shareHint, setShareHint] = React.useState<string | null>(null);

  const handleShareClick = (link: AskSkyShareLink) => {
    const opened = openShareTrayLink(link);
    setLastShared(link.label);
    setShareHint(
      opened
        ? `Opening ${link.label}… Thanks for passing it on!`
        : `Couldn’t open ${link.label}. Check your popup blocker, or long-press the button and open the link.`,
    );
  };

  return (
    <div
      role="region"
      aria-label="Share"
      className={cn(
        "overflow-hidden rounded-2xl border",
        isEmbedInline
          ? "border-white/12 bg-zinc-900/80"
          : isGlassChrome
            ? "border-white/14 bg-slate-950/55 backdrop-blur-md"
            : "border-slate-600/70 bg-gradient-to-b from-slate-800 to-slate-900",
      )}
    >
      <div className="flex items-start gap-2 border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.14em]",
              isEmbedInline ? "text-emerald-300/90" : "text-emerald-300",
            )}
          >
            Pass it on
          </p>
          <p className={cn("text-sm leading-relaxed", isEmbedInline ? "text-zinc-50" : "text-slate-100")}>
            {closingMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
            isEmbedInline
              ? "border-zinc-500/50 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white"
              : isGlassChrome
                ? "border-white/16 bg-slate-900/70 text-slate-200 hover:bg-slate-800 hover:text-white"
                : "border-slate-500/60 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white",
          )}
          aria-label="Close share tray"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5 p-2.5">
        {links.map((link) => {
          const used = lastShared === link.label;
          return (
            <button
              key={link.channel}
              type="button"
              onClick={() => handleShareClick(link)}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-center ring-1 transition-colors",
                channelAccent[link.channel],
                used && "ring-2 ring-emerald-300/70",
              )}
            >
              {used ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <ShareChannelIcon channel={link.channel} />
              )}
              <span className="text-[10px] font-semibold leading-none tracking-wide">{link.label}</span>
            </button>
          );
        })}
      </div>
      {shareHint ? (
        <p
          className={cn(
            "border-t border-white/10 px-3 py-2 text-center text-[11px] leading-snug",
            isEmbedInline ? "text-emerald-200/95" : "text-emerald-200",
          )}
          role="status"
          aria-live="polite"
        >
          {shareHint}
        </p>
      ) : (
        <p
          className={cn(
            "border-t border-white/10 px-3 py-2 text-center text-[11px] leading-snug",
            isEmbedInline ? "text-zinc-400" : "text-slate-400",
          )}
        >
          Tap a channel to share the invite link
        </p>
      )}
    </div>
  );
}
