"use client";

import { BlocksRenderer } from "./blocks-renderer";
import type { PayloadPost } from "@/lib/services/cms";

interface PayloadPostRendererProps {
  post: PayloadPost;
}

/**
 * Renders a CMS post. Handles post-specific logic (e.g. published check);
 * block rendering is delegated to BlocksRenderer.
 */
export function PayloadPostRenderer({ post }: PayloadPostRendererProps) {
  if (post.status !== "publish") {
    return (
      <div className="min-h-[calc(100vh-4.1rem)] bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Available</h1>
          <p className="text-muted-foreground">
            This post is not publicly accessible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BlocksRenderer
      blocks={post.content || []}
      className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground"
      emptyMessage="No content available for this post."
    />
  );
}
