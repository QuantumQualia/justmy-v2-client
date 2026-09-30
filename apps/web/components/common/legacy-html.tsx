import { cn } from "@workspace/ui/lib/utils";
import { legacyPlainText, looksLikeHtml, sanitizeLegacyHtml, unwrapLegacyMarkup } from "@/lib/legacy-html";

export function LegacyHtml({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  const raw = value?.trim() ?? "";
  if (!raw) return null;
  const normalized = unwrapLegacyMarkup(raw);
  if (!looksLikeHtml(normalized)) {
    return <div className={cn("whitespace-pre-wrap", className)}>{normalized}</div>;
  }
  const safe = sanitizeLegacyHtml(normalized);
  if (!safe) {
    const text = legacyPlainText(raw);
    if (!text) return null;
    return <div className={cn("whitespace-pre-wrap", className)}>{text}</div>;
  }
  return (
    <div
      className={cn(
        "legacy-rich-text text-sm leading-relaxed",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_a]:underline [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_h1]:mb-2 [&_h1]:font-serif [&_h1]:text-2xl [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h3]:mb-2 [&_h3]:text-lg",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic",
        "[&_table]:my-2 [&_table]:w-full [&_td]:align-top [&_td]:p-1 [&_th]:p-1 [&_th]:text-left",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
