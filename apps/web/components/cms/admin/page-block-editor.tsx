"use client";

import type React from "react";
import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, GripVertical, Minus, Settings, Monitor, Tablet, Smartphone, ChevronRight, Plus, Copy, Maximize2, AlignCenter } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import type { PageBlock, BlockStyles, ResponsiveValue } from "@/lib/services/cms";
import {
  PageBlockText,
  PageBlockLayout,
  InlineEditViewBlockEditor,
  LiveViewBlockEditor,
  MediaCardBlockEditor,
  QRCodeBlockEditor,
  WelcomeMessageBlockEditor,
  DayInHistoryBlockEditor,
  QuickActionBlockEditor,
  AdBannerBlockEditor,
  SuperSearchBarBlockEditor,
  SearchResultsPanelBlockEditor,
  WeatherHeroBlockEditor,
  HourlyScrollBlockEditor,
  LifestyleIndicesBlockEditor,
  SevenDayStrategyBlockEditor,
  RadarPanelBlockEditor,
  TopNewsBriefingBlockEditor,
  MarketEventsBlockEditor,
  LocalDealsBlockEditor,
  PlaceholderPanelBlockEditor,
  NavbarBlockEditor,
  ReferAFriendBlockEditor,
  AppHubBlockEditor,
} from "./blocks";

type Breakpoint = "mobile" | "tablet" | "desktop";

interface PageBlockEditorProps {
  block: PageBlock;
  index: number;
  onUpdate: (block: PageBlock) => void;
  onDelete: () => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDuplicate?: (block: PageBlock) => void;
  isFirst: boolean;
  isLast: boolean;
  // For nested blocks in layout columns
  onAddBlockToColumn?: (blockType: string) => PageBlock;
  onUpdateNestedBlock?: (block: PageBlock) => void;
  onDeleteNestedBlock?: () => void;
  isNested?: boolean;
}

export function PageBlockEditor({
  block,
  index,
  onUpdate,
  onDelete,
  onMove,
  onReorder,
  onDuplicate,
  isFirst,
  isLast,
}: PageBlockEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showStyles, setShowStyles] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("desktop");
  const [isDragOverHere, setIsDragOverHere] = useState(false);

  const breakpoints: { key: Breakpoint; label: string; icon: React.ReactNode }[] = [
    { key: "mobile", label: "Mobile", icon: <Smartphone className="h-4 w-4" /> },
    { key: "tablet", label: "Tablet", icon: <Tablet className="h-4 w-4" /> },
    { key: "desktop", label: "Desktop", icon: <Monitor className="h-4 w-4" /> },
  ];

  const updateField = (field: string, value: any) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const updateStyles = (styles: BlockStyles) => {
    onUpdate({
      ...block,
      styles,
    });
  };

  const updateStyle = (key: keyof BlockStyles, value: string | ResponsiveValue<string>, breakpoint?: Breakpoint) => {
    const currentStyles = block.styles || {};
    const updated: BlockStyles = { ...currentStyles };

    if (breakpoint) {
      // Responsive value
      const currentValue = (updated[key] as ResponsiveValue<string> | undefined) || {};
      (updated as any)[key] = {
        ...currentValue,
        [breakpoint]: value,
      };
    } else {
      // Direct value
      (updated as any)[key] = value;
    }

    updateStyles(updated);
  };

  const containerStyle = block.layout?.type || "container";

  const updateContainerStyle = (type: "container" | "full-width") => {
    onUpdate({
      ...block,
      layout: {
        ...block.layout,
        type,
      },
    });
  };

  const getStyleValue = (key: keyof BlockStyles, breakpoint?: Breakpoint): string => {
    const value = block.styles?.[key];
    if (!value) return "";

    if (breakpoint && typeof value === "object" && !Array.isArray(value)) {
      return (value as ResponsiveValue<string>)[breakpoint] || "";
    }

    return typeof value === "string" ? value : "";
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOverHere) {
      setIsDragOverHere(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverHere(false);
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(fromIndex) && fromIndex !== index) {
      onReorder(fromIndex, index);
    }
  };

  const renderBlockEditor = () => {
    switch (block.blockType) {
      case "text-block":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Content</Label>
              <PageBlockText
                value={(block.content as string) || ""}
                onChange={(html) => updateField("content", html)}
              />
            </div>
          </div>
        );

      case "layout-block":
        return <PageBlockLayout block={block} onUpdate={onUpdate} />;

      case "inline-edit-view-block":
        return <InlineEditViewBlockEditor block={block} onUpdate={onUpdate} />;

      case "live-view-block":
        return <LiveViewBlockEditor block={block} onUpdate={onUpdate} />;

      case "media-card-block":
        return <MediaCardBlockEditor block={block} onUpdate={onUpdate} />;

      case "qr-code-block":
        return <QRCodeBlockEditor block={block} onUpdate={onUpdate} />;

      case "welcome-message-block":
        return <WelcomeMessageBlockEditor block={block} onUpdate={onUpdate} />;

      case "day-in-history-block":
        return <DayInHistoryBlockEditor block={block} onUpdate={onUpdate} />;

      case "quick-action-block":
        return <QuickActionBlockEditor block={block} onUpdate={onUpdate} />;

      case "ad-banner-block":
        return <AdBannerBlockEditor block={block} onUpdate={onUpdate} />;

      case "super-search-bar-block":
        return <SuperSearchBarBlockEditor block={block} onUpdate={onUpdate} />;

      case "search-results-panel-block":
        return <SearchResultsPanelBlockEditor block={block} onUpdate={onUpdate} />;

      case "weather-hero-block":
        return <WeatherHeroBlockEditor block={block} onUpdate={onUpdate} />;

      case "hourly-scroll-block":
        return <HourlyScrollBlockEditor block={block} onUpdate={onUpdate} />;

      case "lifestyle-indices-block":
        return <LifestyleIndicesBlockEditor block={block} onUpdate={onUpdate} />;

      case "seven-day-strategy-block":
        return <SevenDayStrategyBlockEditor block={block} onUpdate={onUpdate} />;

      case "radar-panel-block":
        return <RadarPanelBlockEditor block={block} onUpdate={onUpdate} />;

      case "top-news-briefing-block":
        return <TopNewsBriefingBlockEditor block={block} onUpdate={onUpdate} />;

      case "market-events-block":
        return <MarketEventsBlockEditor block={block} onUpdate={onUpdate} />;

      case "local-deals-block":
        return <LocalDealsBlockEditor block={block} onUpdate={onUpdate} />;

      case "placeholder-panel-block":
        return <PlaceholderPanelBlockEditor block={block} onUpdate={onUpdate} />;

      case "navbar-block":
        return <NavbarBlockEditor block={block} onUpdate={onUpdate} />;

      case "refer-a-friend-block":
        return <ReferAFriendBlockEditor block={block} onUpdate={onUpdate} />;

      case "app-hub-block":
        return <AppHubBlockEditor block={block} onUpdate={onUpdate} />;

      default:
        return (
          <div className="text-slate-400">
            Unknown block type: {block.blockType}
          </div>
        );
    }
  };

  const getBlockTypeLabel = () => {
    const labels: Record<string, string> = {
      "text-block": "Text Block",
      "layout-block": "Layout Block",
      "inline-edit-view-block": "Inline Edit View",
      "live-view-block": "Live View",
      "media-card-block": "Media Card",
      "qr-code-block": "QR Code",
      "welcome-message-block": "Welcome Message",
      "day-in-history-block": "Day in History",
      "quick-action-block": "Quick Action",
      "ad-banner-block": "Ad Banner",
      "super-search-bar-block": "Super Search Bar",
      "search-results-panel-block": "Search Results Panel",
      "weather-hero-block": "Weather Hero",
      "hourly-scroll-block": "Hourly Scroll",
      "lifestyle-indices-block": "Lifestyle Indices",
      "seven-day-strategy-block": "7-Day Strategy",
      "radar-panel-block": "Radar Panel",
      "top-news-briefing-block": "Top News Briefing",
      "market-events-block": "Market Events",
      "local-deals-block": "Local Deals",
      "placeholder-panel-block": "Placeholder Panel",
      "navbar-block": "Navbar",
      "refer-a-friend-block": "Refer a Friend",
      "app-hub-block": "App Hub",
    };
    return labels[block.blockType] || block.blockType;
  };

  return (
    <div
      className={cn(
        "bg-slate-800/50 rounded-lg border border-slate-700 w-full max-w-full transition-all duration-150",
        isDragOverHere && "border-blue-500/70 shadow-[0_0_0_1px_rgba(59,130,246,0.6)] bg-slate-800/80 translate-y-0.5"
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverHere(false);
      }}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 flex items-center justify-center text-slate-500 cursor-move"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={() => setIsDragOverHere(false)}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="font-medium text-white">{getBlockTypeLabel()}</span>
          {/* Container Style Toggle */}
          <div className="flex items-center gap-0.5 ml-2 bg-slate-900/60 rounded-md p-0.5">
            <button
              onClick={() => updateContainerStyle("container")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                containerStyle === "container"
                  ? "bg-blue-600/80 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="Container (centered, max-width)"
            >
              <AlignCenter className="h-3 w-3" />
              Container
            </button>
            <button
              onClick={() => updateContainerStyle("full-width")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                containerStyle === "full-width"
                  ? "bg-blue-600/80 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="Full Width (edge-to-edge)"
            >
              <Maximize2 className="h-3 w-3" />
              Full Width
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStyles(!showStyles)}
            className={`h-8 px-3 rounded-md border text-xs ${
              showStyles
                ? "border-blue-600/70 text-blue-400 bg-blue-600/10"
                : "border-slate-600/60 text-slate-300 hover:text-white hover:bg-slate-700/70"
            }`}
          >
            <Settings className="h-3 w-3 mr-1.5" />
            Styles
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMove(index, "up")}
            disabled={isFirst}
            className="h-8 w-8 p-0 rounded-md border border-slate-600/60 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-40"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMove(index, "down")}
            disabled={isLast}
            className="h-8 w-8 p-0 rounded-md border border-slate-600/60 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-40"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(block)}
              className="h-8 w-8 p-0 rounded-md border border-slate-600/60 text-slate-300 hover:text-white hover:bg-slate-700/70"
              title="Duplicate Block"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 rounded-md border border-slate-600/60 text-slate-300 hover:text-white hover:bg-slate-700/70"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minus className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 rounded-md border border-red-700/70 text-red-400 hover:text-red-200 hover:bg-red-800/40"
            title="Delete Block"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Content Editor */}
          {renderBlockEditor()}

          {/* Styles Section */}
          {showStyles && (
            <div className="border-t border-slate-700 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Block Styles
                </h3>
                <div className="flex gap-1">
                  {breakpoints.map((bp) => (
                    <button
                      key={bp.key}
                      onClick={() => setActiveBreakpoint(bp.key)}
                      className={`p-1.5 rounded text-xs transition-colors ${
                        activeBreakpoint === bp.key
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                      }`}
                      title={bp.label}
                    >
                      {bp.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Spacing */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-slate-400">Spacing</h4>
                  <div>
                    <Label className="text-xs text-slate-500">Padding (per side)</Label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500">Top</Label>
                        <input
                          type="text"
                          value={getStyleValue("paddingTop", activeBreakpoint)}
                          onChange={(e) => updateStyle("paddingTop", e.target.value, activeBreakpoint)}
                          placeholder="16px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Right</Label>
                        <input
                          type="text"
                          value={getStyleValue("paddingRight", activeBreakpoint)}
                          onChange={(e) => updateStyle("paddingRight", e.target.value, activeBreakpoint)}
                          placeholder="16px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Bottom</Label>
                        <input
                          type="text"
                          value={getStyleValue("paddingBottom", activeBreakpoint)}
                          onChange={(e) => updateStyle("paddingBottom", e.target.value, activeBreakpoint)}
                          placeholder="16px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Left</Label>
                        <input
                          type="text"
                          value={getStyleValue("paddingLeft", activeBreakpoint)}
                          onChange={(e) => updateStyle("paddingLeft", e.target.value, activeBreakpoint)}
                          placeholder="16px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Margin (per side)</Label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500">Top</Label>
                        <input
                          type="text"
                          value={getStyleValue("marginTop", activeBreakpoint)}
                          onChange={(e) => updateStyle("marginTop", e.target.value, activeBreakpoint)}
                          placeholder="24px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Right</Label>
                        <input
                          type="text"
                          value={getStyleValue("marginRight", activeBreakpoint)}
                          onChange={(e) => updateStyle("marginRight", e.target.value, activeBreakpoint)}
                          placeholder="24px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Bottom</Label>
                        <input
                          type="text"
                          value={getStyleValue("marginBottom", activeBreakpoint)}
                          onChange={(e) => updateStyle("marginBottom", e.target.value, activeBreakpoint)}
                          placeholder="24px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Left</Label>
                        <input
                          type="text"
                          value={getStyleValue("marginLeft", activeBreakpoint)}
                          onChange={(e) => updateStyle("marginLeft", e.target.value, activeBreakpoint)}
                          placeholder="24px"
                          className="w-full mt-0.5 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Gap</Label>
                    <input
                      type="text"
                      value={getStyleValue("gap", activeBreakpoint)}
                      onChange={(e) => updateStyle("gap", e.target.value, activeBreakpoint)}
                      placeholder="16px"
                      className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-slate-400">Colors</h4>
                  <div>
                    <Label className="text-xs text-slate-500">Background</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={getStyleValue("backgroundColor") || "#000000"}
                        onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                        className="h-9 w-12 rounded border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={getStyleValue("backgroundColor")}
                        onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                        placeholder="#000000"
                        className="flex-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={getStyleValue("textColor") || "#ffffff"}
                        onChange={(e) => updateStyle("textColor", e.target.value)}
                        className="h-9 w-12 rounded border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={getStyleValue("textColor")}
                        onChange={(e) => updateStyle("textColor", e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Layout */}
                {/* Max Width, Border & Radius */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-slate-400">Layout & Border</h4>
                  <div>
                    <Label className="text-xs text-slate-500">
                      Max Width ({activeBreakpoint})
                    </Label>
                    <input
                      type="text"
                      value={getStyleValue("maxWidth", activeBreakpoint)}
                      onChange={(e) => updateStyle("maxWidth", e.target.value, activeBreakpoint)}
                      placeholder="e.g. 800px or 100%"
                      className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Border</Label>
                    <input
                      type="text"
                      value={getStyleValue("border")}
                      onChange={(e) => updateStyle("border", e.target.value)}
                      placeholder="1px solid #333"
                      className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Border Radius</Label>
                    <input
                      type="text"
                      value={getStyleValue("borderRadius")}
                      onChange={(e) => updateStyle("borderRadius", e.target.value)}
                      placeholder="8px"
                      className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
