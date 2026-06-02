/** Sent from `/embed/myform` iframe to parent; parent `myform.js` adjusts iframe height. */
export const MYFORM_EMBED_RESIZE_MESSAGE_TYPE = "justmy:myform-embed-resize" as const;

export type MyFormEmbedResizeMessage = {
  type: typeof MYFORM_EMBED_RESIZE_MESSAGE_TYPE;
  /** Total content height in CSS pixels (already clamped in iframe before send). */
  height: number;
};

export function isMyFormEmbedResizeMessage(data: unknown): data is MyFormEmbedResizeMessage {
  if (!data || typeof data !== "object") {
    return false;
  }
  const o = data as Record<string, unknown>;
  return (
    o.type === MYFORM_EMBED_RESIZE_MESSAGE_TYPE &&
    typeof o.height === "number" &&
    Number.isFinite(o.height)
  );
}
