"use client";

import type React from "react";
import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, GripVertical, Minus, Settings, Monitor, Tablet, Smartphone, ChevronRight, Plus, Copy } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock, BlockStyles, ResponsiveValue } from "@/lib/services/cms";
import { PageBlockText } from "./page-blocks/text";
import { PageBlockLayout } from "./page-blocks/layout";
import { InlineEditViewBlockEditor } from "./page-blocks/mycard/inline-edit-view";
import { LiveViewBlockEditor } from "./page-blocks/mycard/live-view";
import { MediaCardBlockEditor } from "./page-blocks/mycard/media-card";
import { QRCodeBlockEditor } from "./page-blocks/mycard/qr-code";

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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    };
    return labels[block.blockType] || block.blockType;
  };

  return (
    <div
      className="bg-slate-800/50 rounded-lg border border-slate-700 w-full max-w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 flex items-center justify-center text-slate-500 cursor-move"
            draggable
            onDragStart={handleDragStart}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="font-medium text-white">{getBlockTypeLabel()}</span>
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
                    <Label className="text-xs text-slate-500">Padding</Label>
                    <input
                      type="text"
                      value={getStyleValue("padding", activeBreakpoint)}
                      onChange={(e) => updateStyle("padding", e.target.value, activeBreakpoint)}
                      placeholder="16px"
                      className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Margin</Label>
                    <input
                      type="text"
                      value={getStyleValue("margin", activeBreakpoint)}
                      onChange={(e) => updateStyle("margin", e.target.value, activeBreakpoint)}
                      placeholder="24px"
                      className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                {/* Border & Radius */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-slate-400">Border</h4>
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
