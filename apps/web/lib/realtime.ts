import { useEffect, useRef } from "react";
import { buildApiUrl } from "@/lib/config";
import { tokenStorage } from "@/lib/storage/token-storage";

export type RealtimeEvent = {
  v: 1;
  type: string;
  topic: string;
  at: string;
  payload: Record<string, unknown>;
};

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  return { event, data: data.join("\n") };
}

async function* readSse(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() || "";
      for (const block of parts) {
        const parsed = parseSseBlock(block.replace(/\r/g, ""));
        if (parsed) yield parsed;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function useRealtime(input: {
  topics: Array<string | null | undefined>;
  enabled?: boolean;
  onEvent: (event: RealtimeEvent) => void;
  onStatus?: (status: "connecting" | "open" | "closed") => void;
}) {
  const topics = input.topics.filter((topic): topic is string => Boolean(topic));
  const key = topics.slice().sort().join(",");
  const onEventRef = useRef(input.onEvent);
  const onStatusRef = useRef(input.onStatus);
  onEventRef.current = input.onEvent;
  onStatusRef.current = input.onStatus;

  useEffect(() => {
    if (input.enabled === false || !topics.length || typeof window === "undefined") return;
    const abort = new AbortController();
    let attempt = 0;
    let timer: number | null = null;

    const connect = async () => {
      if (abort.signal.aborted) return;
      onStatusRef.current?.("connecting");
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token || abort.signal.aborted) {
          onStatusRef.current?.("closed");
          return;
        }
        const url = `${buildApiUrl("realtime/stream")}?topics=${encodeURIComponent(topics.join(","))}`;
        const origin = window.location.origin;
        const res = await fetch(url, {
          mode: "cors",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
            "X-App-Origin": origin,
          },
          signal: abort.signal,
        });
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
        attempt = 0;
        onStatusRef.current?.("open");
        for await (const block of readSse(res.body)) {
          if (abort.signal.aborted) break;
          if (block.event === "ping" || block.event === "hello") continue;
          try {
            const parsed = JSON.parse(block.data) as RealtimeEvent;
            if (parsed?.v === 1 && parsed.type) onEventRef.current(parsed);
          } catch {
            /* ignore malformed frames */
          }
        }
      } catch (err) {
        if (abort.signal.aborted) return;
        onStatusRef.current?.("closed");
        const wait = Math.min(15_000, 1000 * 2 ** attempt);
        attempt += 1;
        timer = window.setTimeout(() => void connect(), wait);
        if (err) {
          /* reconnect */
        }
      }
    };

    void connect();
    return () => {
      abort.abort();
      if (timer != null) window.clearTimeout(timer);
      onStatusRef.current?.("closed");
    };
    // topics identity is `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, input.enabled]);
}
