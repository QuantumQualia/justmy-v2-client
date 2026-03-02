"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface NavbarBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function NavbarBlockEditor({ block, onUpdate }: NavbarBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the full Navbar with profile switcher, super search bar, and hamburger menu.
            It sticks to the top of the page with a blurred background.
          </p>
          <p className="text-xs text-slate-500">
            No configuration needed. The navbar automatically adapts to the current user's session and navigation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
