"use client";

import React, { useState, useMemo } from "react";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { PAGE_BLOCK_TYPES, type BlockTypeConfig } from "./block-types";

interface BlockSelectorProps {
  onSelect: (blockType: string) => void;
  className?: string;
  size?: "sm" | "default";
  blockTypes?: BlockTypeConfig[];
}

export function BlockSelector({
  onSelect,
  className,
  size = "default",
  blockTypes = PAGE_BLOCK_TYPES,
}: BlockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and group blocks by category
  const filteredAndGroupedBlocks = useMemo(() => {
    const filtered = blockTypes.filter((block) => {
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
        className={`${className || ""} bg-muted hover:bg-accent border-border text-foreground hover:text-accent-foreground`}
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
        className="bg-gradient-to-br from-slate-800 to-muted p-6 rounded-2xl border border-border shadow-2xl w-full max-w-4xl animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Plus className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Add Block</h3>
              <p className="text-xs text-muted-foreground">Choose a block type to add to your page</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>

        {/* Blocks Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {Object.keys(filteredAndGroupedBlocks).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blocks found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredAndGroupedBlocks).map(([category, blocks]) => (
                <div key={category}>
                  {Object.keys(filteredAndGroupedBlocks).length > 1 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {category}
                      </h4>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {blocks.map((block) => (
                      <button
                        key={block.value}
                        onClick={() => handleSelect(block.value)}
                        className="p-4 bg-card hover:bg-accent border border-border hover:border-blue-500 rounded-lg transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-blue-400 transition-colors flex-shrink-0">
                            {block.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground group-hover:text-accent-foreground mb-1">
                              {block.label}
                            </div>
                            {block.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
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
