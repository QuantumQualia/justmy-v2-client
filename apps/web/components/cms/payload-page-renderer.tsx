"use client";

import { BlocksRenderer } from "./blocks-renderer";
import type { PayloadPage } from "@/lib/services/cms";

interface PayloadPageRendererProps {
  page: PayloadPage;
}

/**
 * Renders a CMS page. Handles page-specific logic (e.g. published check);
 * block rendering is delegated to BlocksRenderer.
 */
export function PayloadPageRenderer({ page }: PayloadPageRendererProps) {
  if (!page.isPublished) {
    return (
      <div className="min-h-[calc(100vh-4.1rem)] bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Published</h1>
          <p className="text-muted-foreground">
            This page is not yet published and is not publicly accessible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BlocksRenderer
      blocks={page.content || []}
      className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground"
      emptyMessage="No content available for this page."
    />
  );
}
