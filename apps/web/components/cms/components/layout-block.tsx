"use client";

import React from "react";
import { BlockRenderer } from "../component-registry";
import type { PageBlock, ResponsiveValue } from "@/lib/services/cms";

interface LayoutBlockProps {
  layout?: PageBlock["layout"];
  children?: PageBlock[];
  styles?: PageBlock["styles"];
}

export function LayoutBlock({ layout, children, styles }: LayoutBlockProps) {
  if (!layout) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-sm">
        Layout block missing layout configuration
      </div>
    );
  }

  // Get responsive values (desktop as primary, with tablet/mobile fallback)
  const getResponsiveValue = <T,>(value: T | ResponsiveValue<T> | undefined): T | undefined => {
    if (!value) return undefined;
    if (typeof value === "object" && !Array.isArray(value) && ("desktop" in value || "tablet" in value || "mobile" in value)) {
      const v = value as ResponsiveValue<T>;
      return v.desktop || v.tablet || v.mobile;
    }
    return value as T;
  };

  // Determine layout type (default to container)
  const layoutType = layout.type || "container";

  // Apply container wrapper based on layout type
  const getContainerWrapper = () => {
    const containerStyles: React.CSSProperties = {};
    const containerClasses: string[] = [];

    if (layoutType === "full-width") {
      // Full width - no container constraints
      containerClasses.push("w-full");
    } else if (layoutType === "boxed") {
      // Boxed - constrained container with max-width
      containerClasses.push("w-full mx-auto");
      const maxWidth = getResponsiveValue(layout.maxWidth);
      if (maxWidth) {
        containerStyles.maxWidth = maxWidth;
      } else {
        containerStyles.maxWidth = "1200px"; // Default boxed width
      }
      const padding = getResponsiveValue(layout.padding);
      if (padding) {
        containerStyles.paddingLeft = padding;
        containerStyles.paddingRight = padding;
      } else {
        containerStyles.paddingLeft = "1rem";
        containerStyles.paddingRight = "1rem";
      }
    } else {
      // Container - standard responsive container
      containerClasses.push("w-full mx-auto px-4 sm:px-6 lg:px-8");
      const maxWidth = getResponsiveValue(layout.maxWidth);
      if (maxWidth) {
        containerStyles.maxWidth = maxWidth;
      } else {
        containerStyles.maxWidth = "1280px"; // Default container max-width
      }
    }

    return { containerClasses: containerClasses.join(" "), containerStyles };
  };

  const { containerClasses, containerStyles: wrapperStyles } = getContainerWrapper();

  // Apply block styles
  const blockStyles: React.CSSProperties = {};
  if (styles?.backgroundColor) blockStyles.backgroundColor = styles.backgroundColor;
  // Padding (shorthand + per-side)
  if (styles?.padding) {
    const padding = getResponsiveValue(styles.padding);
    if (padding) blockStyles.padding = padding;
  }
  if (styles?.paddingTop) {
    const paddingTop = getResponsiveValue(styles.paddingTop);
    if (paddingTop) blockStyles.paddingTop = paddingTop;
  }
  if (styles?.paddingRight) {
    const paddingRight = getResponsiveValue(styles.paddingRight);
    if (paddingRight) blockStyles.paddingRight = paddingRight;
  }
  if (styles?.paddingBottom) {
    const paddingBottom = getResponsiveValue(styles.paddingBottom);
    if (paddingBottom) blockStyles.paddingBottom = paddingBottom;
  }
  if (styles?.paddingLeft) {
    const paddingLeft = getResponsiveValue(styles.paddingLeft);
    if (paddingLeft) blockStyles.paddingLeft = paddingLeft;
  }
  // Margin (shorthand + per-side)
  if (styles?.margin) {
    const margin = getResponsiveValue(styles.margin);
    if (margin) blockStyles.margin = margin;
  }
  if (styles?.marginTop) {
    const marginTop = getResponsiveValue(styles.marginTop);
    if (marginTop) blockStyles.marginTop = marginTop;
  }
  if (styles?.marginRight) {
    const marginRight = getResponsiveValue(styles.marginRight);
    if (marginRight) blockStyles.marginRight = marginRight;
  }
  if (styles?.marginBottom) {
    const marginBottom = getResponsiveValue(styles.marginBottom);
    if (marginBottom) blockStyles.marginBottom = marginBottom;
  }
  if (styles?.marginLeft) {
    const marginLeft = getResponsiveValue(styles.marginLeft);
    if (marginLeft) blockStyles.marginLeft = marginLeft;
  }
  // Max width
  if (styles?.maxWidth) {
    const maxWidth = getResponsiveValue(styles.maxWidth);
    if (maxWidth) blockStyles.maxWidth = maxWidth;
  }
  if (styles?.borderRadius) blockStyles.borderRadius = styles.borderRadius;
  if (styles?.border) blockStyles.border = styles.border;

  // Grid layout
  if (layout.grid) {
    const gridStyles: React.CSSProperties = {
      ...blockStyles,
    };

    // Map responsive column config to Tailwind grid classes (mobile / tablet / desktop)
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
      if (!n || Number.isNaN(n)) return 1;
      return Math.min(12, Math.max(1, n));
    };

    const toColsClass = (n: number) => {
      const cols = clampCols(n);
      switch (cols) {
        case 1: return "grid-cols-1";
        case 2: return "grid-cols-2";
        case 3: return "grid-cols-3";
        case 4: return "grid-cols-4";
        case 5: return "grid-cols-5";
        case 6: return "grid-cols-6";
        case 7: return "grid-cols-7";
        case 8: return "grid-cols-8";
        case 9: return "grid-cols-9";
        case 10: return "grid-cols-10";
        case 11: return "grid-cols-11";
        case 12: return "grid-cols-12";
        default: return "grid-cols-1";
      }
    };

    const mobileCols = clampCols(resolveColumnsFor("mobile") ?? 1);
    const tabletCols = resolveColumnsFor("tablet");
    const desktopCols = resolveColumnsFor("desktop");

    const baseClass = toColsClass(mobileCols);
    const tabletClass = tabletCols ? `sm:${toColsClass(tabletCols)}` : "";
    const desktopClass = desktopCols ? `lg:${toColsClass(desktopCols)}` : "";

    const columnClasses = ["grid", baseClass, tabletClass, desktopClass].filter(Boolean).join(" ");

    const gap = getResponsiveValue(layout.grid.gap);
    if (gap) gridStyles.gap = gap;

    const autoRows = getResponsiveValue(layout.grid.autoRows);
    if (autoRows) gridStyles.gridAutoRows = autoRows;

    // If columns are defined, render each column with its blocks
    if (layout.columns && layout.columns.length > 0) {
      return (
        <div className={containerClasses} style={wrapperStyles}>
          <div style={gridStyles} className={`${columnClasses} mx-auto`}>
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
      );
    }

    // If no columns defined but children exist, render children in grid
    if (children && children.length > 0) {
      return (
        <div className={containerClasses} style={wrapperStyles}>
          <div style={gridStyles} className={`${columnClasses} mx-auto`}>
            {children.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} disableContainer />
            ))}
          </div>
        </div>
      );
    }

    return null;
  }

  // Flex or simple container
  const display = getResponsiveValue(styles?.display);
  if (display === "flex") {
    const flexStyles: React.CSSProperties = {
      display: "flex",
      ...blockStyles,
    };

    const flexDirection = getResponsiveValue(styles?.flexDirection);
    if (flexDirection) flexStyles.flexDirection = flexDirection as any;

    const alignItems = getResponsiveValue(styles?.alignItems);
    if (alignItems) flexStyles.alignItems = alignItems as any;

    const justifyContent = getResponsiveValue(styles?.justifyContent);
    if (justifyContent) flexStyles.justifyContent = justifyContent as any;

    const gap = getResponsiveValue(styles?.gap);
    if (gap) flexStyles.gap = gap;

    return (
      <div className={containerClasses} style={wrapperStyles}>
        <div style={flexStyles} className="mx-auto">
          {children && children.length > 0 ? (
            children.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} disableContainer />
            ))
          ) : (
            <div className="p-4 border-2 border-dashed border-slate-700 rounded text-slate-500 text-sm text-center">
              Container (empty)
            </div>
          )}
        </div>
      </div>
    );
  }

  // Simple container
  return (
    <div className={containerClasses} style={wrapperStyles}>
      <div style={blockStyles} className="mx-auto">
        {children && children.length > 0 ? (
          <div className="space-y-4">
            {children.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} disableContainer />
            ))}
          </div>
        ) : (
          <div className="p-4 border-2 border-dashed border-slate-700 rounded text-slate-500 text-sm text-center">
            Container (empty)
          </div>
        )}
      </div>
    </div>
  );
}
