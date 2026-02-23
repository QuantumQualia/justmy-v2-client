"use client";

import { BlockRenderer } from "./component-registry";
import type { PayloadPage, PageBlock } from "@/lib/services/cms";

interface PayloadPageRendererProps {
  page: PayloadPage;
}

export function PayloadPageRenderer({ page }: PayloadPageRendererProps) {
  if (!page.isPublished) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Page Not Published</h1>
          <p className="text-slate-400">
            This page is not yet published and is not publicly accessible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Page Content */}
      <main className="w-full">
        {page.content && page.content.length > 0 ? (
          page.content.map((block: PageBlock, index: number) => (
            <BlockRenderer key={block.id || index} block={block} />
          ))
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>No content available for this page.</p>
          </div>
        )}
      </main>
    </div>
  );
}
