"use client";

import React, { useState } from "react";
import { Trash2, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock, ResponsiveValue, GridLayout, GridColumn } from "@/lib/services/cms";
import { PageBlockEditor } from "../page-block-editor";
import { BlockSelector } from "../block-selector";

type Breakpoint = "mobile" | "tablet" | "desktop";

// Layout Column Editor Component
interface LayoutColumnEditorProps {
  column: GridColumn;
  colIndex: number;
  block: PageBlock;
  onUpdateLayout: (layout: PageBlock["layout"]) => void;
  activeBreakpoint?: Breakpoint;
}

function LayoutColumnEditor({ column, colIndex, block, onUpdateLayout }: LayoutColumnEditorProps) {
  const handleAddBlock = (blockType: string) => {
    let newBlock: PageBlock;
    if (blockType === "layout-block") {
      newBlock = {
        blockType: "layout-block",
        id: `block-${Date.now()}-${Math.random()}`,
        layout: {
          type: "container",
          grid: {
            columns: { desktop: 2 },
            gap: { desktop: "16px" },
          },
          columns: [
            { id: `col-${Date.now()}-1`, name: "Column 1", blocks: [] },
            { id: `col-${Date.now()}-2`, name: "Column 2", blocks: [] },
          ],
        },
      };
    } else {
      newBlock = {
        blockType,
        id: `block-${Date.now()}-${Math.random()}`,
      };
    }
    
    const updatedColumns = [...(block.layout?.columns || [])];
    updatedColumns[colIndex] = {
      ...column,
      blocks: [...(column.blocks || []), newBlock],
    };
    onUpdateLayout({ ...block.layout, columns: updatedColumns });
  };

  const handleUpdateChildBlock = (childIndex: number, updatedChildBlock: PageBlock) => {
    const updatedColumns = [...(block.layout?.columns || [])];
    updatedColumns[colIndex] = {
      ...column,
      blocks: column.blocks?.map((b, i) => i === childIndex ? updatedChildBlock : b) || [],
    };
    onUpdateLayout({ ...block.layout, columns: updatedColumns });
  };

  const handleDeleteChildBlock = (childIndex: number) => {
    const updatedColumns = [...(block.layout?.columns || [])];
    updatedColumns[colIndex] = {
      ...column,
      blocks: column.blocks?.filter((_, i) => i !== childIndex) || [],
    };
    onUpdateLayout({ ...block.layout, columns: updatedColumns });
  };

  const handleMoveChildBlock = (childIndex: number, direction: "up" | "down") => {
    const updatedColumns = [...(block.layout?.columns || [])];
    const colBlocks = [...(column.blocks || [])];
    const newIdx = direction === "up" ? childIndex - 1 : childIndex + 1;
    if (newIdx >= 0 && newIdx < colBlocks.length) {
      const temp = colBlocks[childIndex]!;
      colBlocks[childIndex] = colBlocks[newIdx]!;
      colBlocks[newIdx] = temp;
      updatedColumns[colIndex] = { ...column, blocks: colBlocks };
      onUpdateLayout({ ...block.layout, columns: updatedColumns });
    }
  };

  const handleReorderChildBlock = (fromIdx: number, toIdx: number) => {
    const updatedColumns = [...(block.layout?.columns || [])];
    const colBlocks = [...(column.blocks || [])];
    const moved = colBlocks[fromIdx]!;
    colBlocks.splice(fromIdx, 1);
    colBlocks.splice(toIdx, 0, moved);
    updatedColumns[colIndex] = { ...column, blocks: colBlocks };
    onUpdateLayout({ ...block.layout, columns: updatedColumns });
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 min-h-[200px] flex flex-col min-w-[480px] w-full max-w-full overflow-hidden">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
        <input
          type="text"
          value={column.name}
          onChange={(e) => {
            const updatedColumns = [...(block.layout?.columns || [])];
            updatedColumns[colIndex] = { ...column, name: e.target.value };
            onUpdateLayout({ ...block.layout, columns: updatedColumns });
          }}
          className="flex-1 bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const updatedColumns = block.layout?.columns?.filter((_, i) => i !== colIndex) || [];
            const newColumnCount = updatedColumns.length;
            
            // Update both columns array and grid columns value for all breakpoints
            const currentGridColumns = block.layout?.grid?.columns || {};
            const updatedGridColumns = { ...currentGridColumns };
            
            // Update all breakpoints to match the new column count
            (["desktop", "tablet", "mobile"] as Breakpoint[]).forEach((bp) => {
              updatedGridColumns[bp] = newColumnCount;
            });
            
            onUpdateLayout({
              ...block.layout,
              columns: updatedColumns,
              grid: {
                ...block.layout?.grid,
                columns: updatedGridColumns,
              },
            });
          }}
          className="h-6 w-6 p-0 ml-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          title="Delete Column"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Column Content - Blocks */}
      <div className="flex-1 space-y-2 min-h-[100px] overflow-y-auto w-full max-w-full">
        {column.blocks && column.blocks.length > 0 ? (
          column.blocks.map((childBlock, childIndex) => (
            <div key={childBlock.id || childIndex} className="w-full max-w-full">
              <PageBlockEditor
                block={childBlock}
                index={childIndex}
                onUpdate={(updatedChildBlock) => handleUpdateChildBlock(childIndex, updatedChildBlock)}
                onDelete={() => handleDeleteChildBlock(childIndex)}
                onMove={(idx, direction) => handleMoveChildBlock(idx, direction)}
                onReorder={handleReorderChildBlock}
                isFirst={childIndex === 0}
                isLast={childIndex === (column.blocks?.length || 0) - 1}
                isNested={true}
              />
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-700 rounded text-slate-500 text-xs text-center">
            Empty column
          </div>
        )}
      </div>

      {/* Add Block Button */}
      <div className="mt-3 pt-2 border-t border-slate-700">
        <BlockSelector onSelect={handleAddBlock} size="sm" className="w-full" />
      </div>
    </div>
  );
}

interface PageBlockLayoutProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function PageBlockLayout({ block, onUpdate }: PageBlockLayoutProps) {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("desktop");

  const breakpoints: { key: Breakpoint; label: string; icon: React.ReactNode }[] = [
    { key: "mobile", label: "Mobile", icon: <Smartphone className="h-4 w-4" /> },
    { key: "tablet", label: "Tablet", icon: <Tablet className="h-4 w-4" /> },
    { key: "desktop", label: "Desktop", icon: <Monitor className="h-4 w-4" /> },
  ];

  const updateLayout = (layout: PageBlock["layout"]) => {
    onUpdate({
      ...block,
      layout,
    });
  };

  const getGridValue = (key: keyof GridLayout, breakpoint?: Breakpoint): string | number => {
    const layout = block.layout?.grid;
    if (!layout) return "";

    const value = layout[key];
    if (!value) return "";

    if (breakpoint && typeof value === "object" && !Array.isArray(value)) {
      return (value as ResponsiveValue<string | number>)[breakpoint] || "";
    }

    return typeof value === "string" || typeof value === "number" ? value : "";
  };

  const updateGridLayout = (key: keyof GridLayout, value: number | string | ResponsiveValue<string | number>, breakpoint?: Breakpoint) => {
    const currentLayout = block.layout || {};
    const currentGrid = currentLayout.grid || {};
    const updated: GridLayout = { ...currentGrid };

    if (breakpoint) {
      const currentValue = (updated[key] as ResponsiveValue<string | number> | undefined) || {};
      (updated as any)[key] = {
        ...currentValue,
        [breakpoint]: value,
      };
    } else {
      (updated as any)[key] = value;
    }

    updateLayout({ ...currentLayout, grid: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300 mb-2 block">Layout Type</Label>
        <select
          value={block.layout?.type || "container"}
          onChange={(e) => {
            updateLayout({
              ...block.layout,
              type: e.target.value as "container" | "full-width" | "boxed",
            });
          }}
          className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="container">Container</option>
          <option value="full-width">Full Width</option>
          <option value="boxed">Boxed</option>
        </select>
      </div>

      {/* Grid Layout Configuration */}
      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-slate-300">Grid Layout</Label>
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
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500">Columns ({activeBreakpoint})</Label>
            <input
              type="number"
              min="1"
              max="12"
              value={(block.layout?.columns?.length || getGridValue("columns", activeBreakpoint) || 2).toString()}
              onChange={(e) => {
                const raw = parseInt(e.target.value, 10);
                const cols = Math.max(1, Math.min(12, Number.isNaN(raw) ? 1 : raw));
                const currentCols = block.layout?.columns || [];
                
                // Update grid layout
                updateGridLayout("columns", cols, activeBreakpoint);
                
                // Auto-create or adjust columns
                let newColumns: GridColumn[];
                if (cols > currentCols.length) {
                  // Add new columns
                  newColumns = [...currentCols];
                  for (let i = currentCols.length; i < cols; i++) {
                    newColumns.push({
                      id: `col-${Date.now()}-${i}`,
                      name: `Column ${i + 1}`,
                      blocks: [],
                    });
                  }
                } else if (cols < currentCols.length) {
                  // Remove excess columns (keep first N)
                  newColumns = currentCols.slice(0, cols);
                } else {
                  // Same number, keep existing
                  newColumns = currentCols;
                }
                
                updateLayout({
                  ...block.layout,
                  grid: { ...block.layout?.grid, columns: { [activeBreakpoint]: cols } },
                  columns: newColumns,
                });
              }}
              className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Gap ({activeBreakpoint})</Label>
            <input
              type="text"
              value={getGridValue("gap", activeBreakpoint).toString()}
              onChange={(e) => updateGridLayout("gap", e.target.value, activeBreakpoint)}
              placeholder="16px"
              className="w-full mt-1 bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Column Management - Horizontal Grid View */}
      {block.layout?.columns && block.layout.columns.length > 0 && (
        <div className="border-t border-slate-700 pt-4 w-full max-w-full">
          <Label className="text-slate-300 mb-3 block">Columns</Label>
          <div className="w-full max-w-full overflow-x-auto pb-2">
            <div
              className="grid mb-4"
              style={{
                gridTemplateColumns: block.layout.columns.length === 1 
                  ? "1fr" 
                  : `repeat(${block.layout.columns.length}, minmax(480px, 1fr))`,
                gap: getGridValue("gap", activeBreakpoint).toString() || "16px",
                width: block.layout.columns.length === 1 ? "100%" : "480px",
                minWidth: block.layout.columns.length === 1 ? "100%" : "480px",
              }}
            >
              {block.layout.columns.map((column, colIndex) => (
                <div key={column.id} className="w-full min-w-[480px] max-w-full">
                  <LayoutColumnEditor
                    column={column}
                    colIndex={colIndex}
                    block={block}
                    onUpdateLayout={updateLayout}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
