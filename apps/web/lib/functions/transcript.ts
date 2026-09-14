import type { BattlePlanLog } from "@/lib/services/biz-os";

export type TranscriptLine = {
  speaker: string;
  text: string;
};

function isSkyLog(log: Pick<BattlePlanLog, "senderType" | "senderName">) {
  const type = (log.senderType || "").toLowerCase();
  const name = (log.senderName || "").toLowerCase();
  return type === "asksky" || type === "system" || name.includes("sky");
}

export function conversationThrough(
  logs: BattlePlanLog[],
  throughLogId?: number,
): BattlePlanLog[] {
  const ordered = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  if (throughLogId == null) return ordered;
  const index = ordered.findIndex((log) => log.id === throughLogId);
  if (index < 0) return ordered;
  return ordered.slice(0, index + 1);
}

export function transcriptLines(logs: BattlePlanLog[]): TranscriptLine[] {
  return logs
    .map((log) => ({
      speaker: isSkyLog(log) ? "Sky" : log.senderName?.trim() || "Owner",
      text: (log.messageText || "").trim(),
    }))
    .filter((line) => line.text);
}

export function formatTranscript(title: string, lines: TranscriptLine[]) {
  const heading = title.trim() || "Battle Plan";
  if (!lines.length) return heading;
  return `${heading}\n\n${lines.map((line) => `${line.speaker}:\n${line.text}`).join("\n\n")}`;
}

export function fileStem(title: string) {
  return (
    title
      .trim()
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "battle-plan"
  );
}
