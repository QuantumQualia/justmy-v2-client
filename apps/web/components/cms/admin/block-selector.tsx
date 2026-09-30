"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, X, Search, CircleHelp } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { PAGE_BLOCK_TYPES, type BlockTypeConfig } from "./block-types";

interface BlockSelectorProps {
  onSelect: (blockType: string) => void;
  className?: string;
  size?: "sm" | "default";
  blockTypes?: BlockTypeConfig[];
  appearance?: "default" | "light";
  /** When false, only the close button dismisses the picker. */
  closeOnOutsideClick?: boolean;
}

export function BlockSelector({
  onSelect,
  className,
  size = "default",
  blockTypes = PAGE_BLOCK_TYPES,
  appearance = "default",
  closeOnOutsideClick = true,
}: BlockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [helpValue, setHelpValue] = useState<string | null>(null);

  useEffect(() => {
    if (!helpValue) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-block-help]")) return;
      setHelpValue(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpValue(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [helpValue]);

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
    setHelpValue(null);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery("");
    setHelpValue(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    setHelpValue(null);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleOpen}
        className={cn(
          appearance === "light"
            ? undefined
            : "bg-muted hover:bg-accent border-border text-foreground hover:text-accent-foreground",
          className,
        )}
      >
        <Plus className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-2`} />
        <span className={size === "sm" ? "text-xs" : ""}>Add Block</span>
      </Button>
    );
  }

  const light = appearance === "light";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in",
        light ? "bg-foreground/40" : "bg-black/70 backdrop-blur-sm",
      )}
      onClick={closeOnOutsideClick ? handleClose : undefined}
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full max-w-4xl animate-in flex-col overflow-hidden border p-6 shadow-2xl zoom-in-95",
          light
            ? "rounded-3xl border-border bg-background text-foreground"
            : "rounded-2xl border-border bg-gradient-to-br from-slate-800 to-muted",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                light ? "bg-primary" : "bg-gradient-to-br from-blue-600 to-purple-600",
              )}
            >
              <Plus className={cn("h-5 w-5", light ? "text-primary-foreground" : "text-foreground")} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Add Block</h3>
              <p className="text-xs text-muted-foreground">
                Choose a block type to add to your page
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors",
              light ? "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground" : "bg-muted hover:bg-secondary",
            )}
          >
            <X className={cn("h-4 w-4", light ? "" : "text-muted-foreground")} />
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </h4>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {blocks.map((block) => (
                      <div
                        key={block.value}
                        className={cn(
                          "group rounded-2xl border transition-all",
                          light
                            ? "border-border bg-card hover:border-primary/30 hover:bg-secondary"
                            : "border-border bg-card hover:border-primary/30 hover:bg-secondary",
                        )}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <button
                            type="button"
                            onClick={() => handleSelect(block.value)}
                            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                                light
                                  ? "bg-muted text-primary group-hover:bg-background"
                                  : "bg-muted text-primary",
                              )}
                            >
                              {block.icon}
                            </div>
                            <div className="min-w-0 flex-1 pt-2 text-sm font-semibold text-foreground">
                              {block.label}
                            </div>
                          </button>
                          {block.description ? (
                            <button
                              type="button"
                              data-block-help=""
                              aria-label={`About ${block.label}`}
                              aria-expanded={helpValue === block.value}
                              onClick={() =>
                                setHelpValue((current) =>
                                  current === block.value ? null : block.value,
                                )
                              }
                              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <CircleHelp className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                        {helpValue === block.value && block.description ? (
                          <p data-block-help="" className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground">
                            {block.description}
                          </p>
                        ) : null}
                      </div>
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
