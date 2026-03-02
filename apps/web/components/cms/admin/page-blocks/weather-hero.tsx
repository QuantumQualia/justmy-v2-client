"use client";

import React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface WeatherHeroBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function WeatherHeroBlockEditor({}: WeatherHeroBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-slate-400">
            Renders the Strategic Weather hero (location, temperature, vibe check, today&apos;s
            highs and lows, and wind details) for the signed-in user&apos;s profile zip.
          </p>
          <CardDescription className="text-xs text-slate-500">
            No configuration needed. Data comes from the weather/hero API and the user&apos;s saved
            market/zip.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

