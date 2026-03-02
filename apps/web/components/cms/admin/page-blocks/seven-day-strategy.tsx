"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface SevenDayStrategyBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function SevenDayStrategyBlockEditor({}: SevenDayStrategyBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the 7-Day Strategy panel, splitting work week vs weekend and summarizing the
            weekend lookahead.
          </p>
          <CardDescription className="text-xs text-slate-500">
            No configuration needed. Data comes from the weather/sevenday API.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

