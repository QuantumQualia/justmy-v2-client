"use client";

import * as React from "react";
import { Card, CardContent, CardDescription } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
import type { PageBlock } from "@/lib/services/cms";

interface CityOsEventsBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function CityOsEventsBlockEditor({ block, onUpdate }: CityOsEventsBlockEditorProps) {
  const limitRaw = block.cityOsEventsLimit;
  const limit =
    typeof limitRaw === "number" && Number.isFinite(limitRaw)
      ? limitRaw
      : Number.parseInt(String(limitRaw ?? "25"), 10) || 25;

  const [copied, setCopied] = React.useState<false | "iframe" | "script">(false);

  const domainRaw = typeof block.cityOsEventsDomain === "string" ? block.cityOsEventsDomain.trim() : "";
  const domainAttr = React.useMemo(
    () => (domainRaw ? ` data-domain="${escapeHtmlAttr(domainRaw)}"` : ""),
    [domainRaw],
  );

  const iframeSnippet = React.useMemo(() => {
    const lim = String(Math.min(100, Math.max(1, limit)));
    if (typeof window === "undefined") {
      return `<iframe src="/embed/cityos-events?eventsLimit=${lim}" width="100%" height="280" style="border:0;" loading="lazy" title="CityOS events"></iframe>`;
    }
    const origin = window.location.origin;
    return `<iframe src="${origin}/embed/cityos-events?eventsLimit=${lim}" width="100%" height="280" style="border:0;" loading="lazy" title="CityOS events"></iframe>`;
  }, [limit]);

  const scriptSnippet = React.useMemo(() => {
    const lim = String(Math.min(100, Math.max(1, limit)));
    if (typeof window === "undefined") {
      return `<script src="/embed/cityos.js?v=1"${domainAttr} data-events-limit="${lim}" async></script>`;
    }
    const origin = window.location.origin;
    return `<script src="${origin}/embed/cityos.js?v=1"${domainAttr} data-events-limit="${lim}" async></script>`;
  }, [domainAttr, limit]);

  const updateField = (field: string, value: string | number) => {
    onUpdate({ ...block, [field]: value });
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 text-slate-200">
        <CardContent className="space-y-4 p-4 pt-4">
          <p className="text-sm text-slate-400">
            Tag cloud of Ticketmaster on-sale events for a market, resolved by the market&apos;s site domain.
          </p>
          <div className="space-y-2">
            <Label className="text-slate-300">Market site domain (this app / CMS page only)</Label>
            <Input
              className="border-slate-600 bg-slate-900 text-slate-100"
              placeholder="justmymemphis.com"
              value={block.cityOsEventsDomain ?? ""}
              onChange={(e) => updateField("cityOsEventsDomain", e.target.value.trim())}
            />
            <CardDescription className="text-xs text-slate-500">
              Required for blocks inside JustMy. Must match <code className="text-slate-400">Market.site</code> on the
              backend (no https://). For <strong>script</strong> and <strong>iframe</strong> snippets on external
              pages, fill this so we can emit <code className="text-slate-400">data-domain</code> / query override; on
              a normal newsstand the script infers the market from <code className="text-slate-400">window.location</code>{" "}
              when you omit it from the snippet.
            </CardDescription>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Events limit</Label>
            <Input
              type="number"
              min={1}
              max={100}
              className="border-slate-600 bg-slate-900 text-slate-100"
              value={Number.isFinite(limit) ? limit : 25}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                updateField("cityOsEventsLimit", Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : 25);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Script embed (recommended)</Label>
            <Textarea
              readOnly
              rows={3}
              className="font-mono text-xs border-slate-600 bg-slate-950 text-slate-300"
              value={scriptSnippet}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(scriptSnippet);
                    setCopied("script");
                    window.setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied === "script" ? "Copied" : "Copy script HTML"}
              </Button>
              <CardDescription className="flex-1 self-center text-xs text-slate-500">
                Mounts after the tag in a shadow root (no iframe sandbox limits). Wrap in a sized container if you
                need a minimum height. Set <code className="text-slate-400">data-domain</code> when the page hostname is
                not the market site (e.g. partner page); the script otherwise uses <code className="text-slate-400">window.location</code>.
              </CardDescription>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Newsstand / legacy embed (iframe)</Label>
            <Textarea
              readOnly
              rows={4}
              className="font-mono text-xs border-slate-600 bg-slate-950 text-slate-300"
              value={iframeSnippet}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(iframeSnippet);
                    setCopied("iframe");
                    window.setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied === "iframe" ? "Copied" : "Copy iframe HTML"}
              </Button>
              <CardDescription className="flex-1 self-center text-xs text-slate-500">
                Same snippet on every newsstand: the widget resolves the parent page hostname (referrer). If a site
                strips referrers, append <code className="text-slate-400">&amp;domain=marketsite.com</code> to the
                iframe <code className="text-slate-400">src</code>. Adjust <code className="text-slate-400">height</code>{" "}
                as needed.
              </CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
