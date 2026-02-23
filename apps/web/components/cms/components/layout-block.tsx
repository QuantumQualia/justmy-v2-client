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

  // Get responsive values (using desktop as default for now)
  const getResponsiveValue = <T,>(value: T | ResponsiveValue<T> | undefined): T | undefined => {
    if (!value) return undefined;
    if (typeof value === "object" && !Array.isArray(value) && ("desktop" in value || "tablet" in value || "mobile" in value)) {
      return (value as ResponsiveValue<T>).desktop || (value as ResponsiveValue<T>).tablet || (value as ResponsiveValue<T>).mobile;
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
  if (styles?.padding) {
    const padding = getResponsiveValue(styles.padding);
    if (padding) blockStyles.padding = padding;
  }
  if (styles?.margin) {
    const margin = getResponsiveValue(styles.margin);
    if (margin) blockStyles.margin = margin;
  }
  if (styles?.borderRadius) blockStyles.borderRadius = styles.borderRadius;
  if (styles?.border) blockStyles.border = styles.border;

  // Grid layout
  if (layout.grid) {
    const gridStyles: React.CSSProperties = {
      display: "grid",
      ...blockStyles,
    };

    const columns = getResponsiveValue(layout.grid.columns);
    if (columns) {
      gridStyles.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }

    const gap = getResponsiveValue(layout.grid.gap);
    if (gap) gridStyles.gap = gap;

    const autoRows = getResponsiveValue(layout.grid.autoRows);
    if (autoRows) gridStyles.gridAutoRows = autoRows;

    // If columns are defined, render each column with its blocks
    if (layout.columns && layout.columns.length > 0) {
      return (
        <div className={containerClasses} style={wrapperStyles}>
          <div style={gridStyles}>
            {layout.columns.map((column) => (
              <div key={column.id} className="min-h-[100px]">
                {column.blocks && column.blocks.length > 0 ? (
                  <div className="space-y-4">
                    {column.blocks.map((block, index) => (
                      <BlockRenderer key={block.id || index} block={block} />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-slate-700 rounded text-slate-500 text-sm text-center">
                    {column.name} (empty)
                  </div>
                )}
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
          <div style={gridStyles}>
            {children.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={containerClasses} style={wrapperStyles}>
        <div style={gridStyles} className="p-4 border-2 border-dashed border-slate-700 rounded text-slate-500 text-sm text-center">
          Grid Layout (empty)
        </div>
      </div>
    );
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
        <div style={flexStyles}>
          {children && children.length > 0 ? (
            children.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} />
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
      <div style={blockStyles}>
        {children && children.length > 0 ? (
          <div className="space-y-4">
            {children.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} />
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
