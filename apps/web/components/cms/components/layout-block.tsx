"use client";

import React from "react";
import { BlockRenderer } from "../component-registry";
import {
  buildResponsivePropertyCSS,
  compileBlockStyles,
  compileContainerWrapper,
} from "../block-responsive-styles";
import type { BlockStyles, PageBlock, ResponsiveValue } from "@/lib/services/cms";

interface LayoutBlockProps {
  layout?: PageBlock["layout"];
  children?: PageBlock[];
  styles?: PageBlock["styles"];
}

function displaySpecifiesFlex(display: BlockStyles["display"] | undefined): boolean {
  if (!display) return false;
  if (typeof display === "string") return display === "flex";
  const o = display as ResponsiveValue<string>;
  return o.mobile === "flex" || o.tablet === "flex" || o.desktop === "flex";
}

export function LayoutBlock({ layout, children, styles }: LayoutBlockProps) {
  if (!layout) {
    return (
      <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
        Layout block missing layout configuration
      </div>
    );
  }

  const wrapId = React.useId().replace(/:/g, "");
  const innerId = React.useId().replace(/:/g, "");
  const wrapSel = `[data-cms-lw="${wrapId}"]`;
  const innerSel = `[data-cms-lbi="${innerId}"]`;

  const { containerClasses, inline: wrapInline, responsiveCss: wrapCss } =
    compileContainerWrapper(layout, wrapSel);

  const { inline: innerInline, responsiveCss: innerCss } = compileBlockStyles(styles, innerSel);

  // Grid layout
  if (layout.grid) {
    const columnsConfig = layout.grid.columns;

    const resolveColumnsFor = (bp: "mobile" | "tablet" | "desktop"): number | undefined => {
      if (!columnsConfig) return undefined;
      if (typeof columnsConfig === "number") return columnsConfig;
      const v = columnsConfig as ResponsiveValue<number>;
      if (bp === "mobile") return v.mobile;
      if (bp === "tablet") return v.tablet;
      return v.desktop;
    };

    const clampCols = (n: number | undefined): number => {
      if (n == null || Number.isNaN(n)) return 1;
      return Math.min(12, Math.max(1, n));
    };

    const toColsClass = (n: number) => {
      const cols = clampCols(n);
      switch (cols) {
        case 1:
          return "grid-cols-1";
        case 2:
          return "grid-cols-2";
        case 3:
          return "grid-cols-3";
        case 4:
          return "grid-cols-4";
        case 5:
          return "grid-cols-5";
        case 6:
          return "grid-cols-6";
        case 7:
          return "grid-cols-7";
        case 8:
          return "grid-cols-8";
        case 9:
          return "grid-cols-9";
        case 10:
          return "grid-cols-10";
        case 11:
          return "grid-cols-11";
        case 12:
          return "grid-cols-12";
        default:
          return "grid-cols-1";
      }
    };

    const mobileCols = clampCols(resolveColumnsFor("mobile") ?? 1);
    const tabletCols = resolveColumnsFor("tablet");
    const desktopCols = resolveColumnsFor("desktop");

    const baseClass = toColsClass(mobileCols);
    // md/lg align with CMS responsive CSS (768px / 1024px)
    const tabletClass = tabletCols != null ? `md:${toColsClass(tabletCols)}` : "";
    const desktopClass = desktopCols != null ? `lg:${toColsClass(desktopCols)}` : "";

    const columnClasses = ["grid", baseClass, tabletClass, desktopClass].filter(Boolean).join(" ");

    const gridGapCss = buildResponsivePropertyCSS(innerSel, "gap", layout.grid.gap);
    const gridAutoRowsCss = buildResponsivePropertyCSS(
      innerSel,
      "grid-auto-rows",
      layout.grid.autoRows
    );

    const gridCss = wrapCss + innerCss + gridGapCss + gridAutoRowsCss;
    const styleTag =
      gridCss.length > 0 ? <style dangerouslySetInnerHTML={{ __html: gridCss }} /> : null;

    // If columns are defined, render each column with its blocks
    if (layout.columns && layout.columns.length > 0) {
      return (
        <>
          {styleTag}
          <div data-cms-lw={wrapId} className={containerClasses} style={wrapInline}>
            <div data-cms-lbi={innerId} style={innerInline} className={`${columnClasses} mx-auto`}>
              {layout.columns.map((column) => (
                <div key={column.id}>
                  {column.blocks && column.blocks.length > 0 ? (
                    <div className="space-y-4">
                      {column.blocks.map((block, index) => (
                        <BlockRenderer key={block.id || index} block={block} disableContainer />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    // If no columns defined but children exist, render children in grid
    if (children && children.length > 0) {
      return (
        <>
          {styleTag}
          <div data-cms-lw={wrapId} className={containerClasses} style={wrapInline}>
            <div data-cms-lbi={innerId} style={innerInline} className={`${columnClasses} mx-auto`}>
              {children.map((block, index) => (
                <BlockRenderer key={block.id || index} block={block} disableContainer />
              ))}
            </div>
          </div>
        </>
      );
    }

    return null;
  }

  const baseCss = wrapCss + innerCss;
  const styleTag =
    baseCss.length > 0 ? <style dangerouslySetInnerHTML={{ __html: baseCss }} /> : null;

  // Flex container (display flex at one or more breakpoints)
  if (displaySpecifiesFlex(styles?.display)) {
    return (
      <>
        {styleTag}
        <div data-cms-lw={wrapId} className={containerClasses} style={wrapInline}>
          <div data-cms-lbi={innerId} style={innerInline} className="mx-auto">
            {children && children.length > 0 ? (
              children.map((block, index) => (
                <BlockRenderer key={block.id || index} block={block} disableContainer />
              ))
            ) : (
              <div className="rounded border-2 border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
                Container (empty)
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Simple container
  return (
    <>
      {styleTag}
      <div data-cms-lw={wrapId} className={containerClasses} style={wrapInline}>
        <div data-cms-lbi={innerId} style={innerInline} className="mx-auto">
          {children && children.length > 0 ? (
            <div className="space-y-4">
              {children.map((block, index) => (
                <BlockRenderer key={block.id || index} block={block} disableContainer />
              ))}
            </div>
          ) : (
            <div className="rounded border-2 border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
              Container (empty)
            </div>
          )}
        </div>
      </div>
    </>
  );
}
