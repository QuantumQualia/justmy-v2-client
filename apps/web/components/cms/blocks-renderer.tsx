"use client";

import { useMemo } from "react";
import { BlockRenderer } from "./component-registry";
import { QuickActionHandlerProvider } from "./components/quick-action-handler-context";
import { useChatbotStore } from "@/lib/store/chatbot-store";
import type { ContentBlock } from "@/lib/services/cms";

export interface BlocksRendererProps {
  /** Content blocks to render (page or post content) */
  blocks: ContentBlock[];
  /** Optional wrapper class for the main element */
  className?: string;
  /** Optional empty state message when blocks are empty */
  emptyMessage?: string;
}

/**
 * Shared renderer for CMS content blocks.
 * Used by both PayloadPageRenderer and PayloadPostRenderer to keep
 * page and post rendering logic separate while sharing block rendering.
 */
export function BlocksRenderer({
  blocks,
  className = "min-h-screen bg-background text-foreground",
  emptyMessage = "No content available.",
}: BlocksRendererProps) {
  const openChatbot = useChatbotStore((s) => s.open);

  const actionHandlers = useMemo(
    () => ({
      openChatbot,
    }),
    [openChatbot]
  );

  return (
    <QuickActionHandlerProvider handlers={actionHandlers}>
      <div className={className}>
        <main className="w-full">
          {blocks && blocks.length > 0 ? (
            blocks.map((block: ContentBlock, index: number) => (
              <BlockRenderer key={block.id || index} block={block} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>{emptyMessage}</p>
            </div>
          )}
        </main>
      </div>
    </QuickActionHandlerProvider>
  );
}
