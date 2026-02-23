"use client";

import React, { useState, useMemo } from "react";
import { Plus, X, Type, Layout, Search, Edit, Eye, Image, QrCode } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

export interface BlockTypeConfig {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  category?: string;
}

// Centralized block registry - easy to extend
export const BLOCK_TYPES: BlockTypeConfig[] = [
  {
    value: "text-block",
    label: "Text Block",
    icon: <Type className="h-5 w-5" />,
    description: "Rich text content with formatting options",
    category: "Content",
  },
  {
    value: "layout-block",
    label: "Layout Block",
    icon: <Layout className="h-5 w-5" />,
    description: "Grid layout container for organizing blocks",
    category: "Layout",
  },
  {
    value: "inline-edit-view-block",
    label: "Inline Edit View",
    icon: <Edit className="h-5 w-5" />,
    description: "Profile inline edit view component",
    category: "Components",
  },
  {
    value: "live-view-block",
    label: "Live View",
    icon: <Eye className="h-5 w-5" />,
    description: "Profile live view card component",
    category: "Components",
  },
  {
    value: "media-card-block",
    label: "Media Card",
    icon: <Image className="h-5 w-5" />,
    description: "Profile media card with QR code",
    category: "Components",
  },
  {
    value: "qr-code-block",
    label: "QR Code",
    icon: <QrCode className="h-5 w-5" />,
    description: "QR code component for profile sharing",
    category: "Components",
  },
];

interface BlockSelectorProps {
  onSelect: (blockType: string) => void;
  className?: string;
  size?: "sm" | "default";
}

export function BlockSelector({ onSelect, className, size = "default" }: BlockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and group blocks by category
  const filteredAndGroupedBlocks = useMemo(() => {
    const filtered = BLOCK_TYPES.filter((block) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        block.label.toLowerCase().includes(query) ||
        block.description?.toLowerCase().includes(query) ||
        block.category?.toLowerCase().includes(query)
      );
    });

    return filtered.reduce((acc, block) => {
      const category = block.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(block);
      return acc;
    }, {} as Record<string, BlockTypeConfig[]>);
  }, [searchQuery]);

  const handleSelect = (blockType: string) => {
    onSelect(blockType);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleOpen}
        className={`${className || ""} bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white`}
      >
        <Plus className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-2`} />
        <span className={size === "sm" ? "text-xs" : ""}>Add Block</span>
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Block</h3>
              <p className="text-xs text-slate-400">Choose a block type to add to your page</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-slate-700 text-white placeholder-slate-500"
              autoFocus
            />
          </div>
        </div>

        {/* Blocks Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {Object.keys(filteredAndGroupedBlocks).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No blocks found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredAndGroupedBlocks).map(([category, blocks]) => (
                <div key={category}>
                  {Object.keys(filteredAndGroupedBlocks).length > 1 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {category}
                      </h4>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {blocks.map((block) => (
                      <button
                        key={block.value}
                        onClick={() => handleSelect(block.value)}
                        className="p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0">
                            {block.icon || <Type className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-200 group-hover:text-white mb-1">
                              {block.label}
                            </div>
                            {block.description && (
                              <div className="text-xs text-slate-400 line-clamp-2">
                                {block.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
