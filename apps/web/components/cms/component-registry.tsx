import React from "react";
import { TextBlock } from "./components/text-block";
import { LayoutBlock } from "./components/layout-block";
import { InlineEditViewBlock } from "./components/mycard/inline-edit-view-block";
import { LiveViewBlock } from "./components/mycard/live-view-block";
import { MediaCardBlock } from "./components/mycard/media-card-block";
import { QRCodeBlock } from "./components/mycard/qr-code-block";
import type { PageBlock, BlockStyles, ResponsiveValue } from "@/lib/services/cms";

// Component registry - maps Payload block types to React components
export const ComponentRegistry: Record<
  string,
  React.ComponentType<any>
> = {
  "text-block": TextBlock,
  "layout-block": LayoutBlock,
  "inline-edit-view-block": InlineEditViewBlock,
  "live-view-block": LiveViewBlock,
  "media-card-block": MediaCardBlock,
  "qr-code-block": QRCodeBlock,
};

/**
 * Convert BlockStyles to inline CSS
 */
function blockStylesToCSS(styles?: BlockStyles): React.CSSProperties {
  if (!styles) return {};

  const css: React.CSSProperties = {};

  // Direct values (not responsive)
  if (styles.backgroundColor) css.backgroundColor = styles.backgroundColor;
  if (styles.textColor) css.color = styles.textColor;
  if (styles.borderRadius) css.borderRadius = styles.borderRadius;
  if (styles.border) css.border = styles.border;

  // Responsive values - use desktop as default for now
  // In production, you'd use CSS media queries or a responsive utility
  const getResponsiveValue = <T,>(value: T | ResponsiveValue<T> | undefined): T | undefined => {
    if (!value) return undefined;
    if (typeof value === "object" && !Array.isArray(value) && ("desktop" in value || "tablet" in value || "mobile" in value)) {
      return (value as ResponsiveValue<T>).desktop || (value as ResponsiveValue<T>).tablet || (value as ResponsiveValue<T>).mobile;
    }
    return value as T;
  };

  const padding = getResponsiveValue(styles.padding);
  if (padding) css.padding = padding;

  const margin = getResponsiveValue(styles.margin);
  if (margin) css.margin = margin;

  const width = getResponsiveValue(styles.width);
  if (width) css.width = width;

  const maxWidth = getResponsiveValue(styles.maxWidth);
  if (maxWidth) css.maxWidth = maxWidth;

  const minHeight = getResponsiveValue(styles.minHeight);
  if (minHeight) css.minHeight = minHeight;

  const display = getResponsiveValue(styles.display);
  if (display) css.display = display as any;

  const flexDirection = getResponsiveValue(styles.flexDirection);
  if (flexDirection) css.flexDirection = flexDirection as any;

  const alignItems = getResponsiveValue(styles.alignItems);
  if (alignItems) css.alignItems = alignItems as any;

  const justifyContent = getResponsiveValue(styles.justifyContent);
  if (justifyContent) css.justifyContent = justifyContent as any;

  const gap = getResponsiveValue(styles.gap);
  if (gap) css.gap = gap;

  return css;
}

/**
 * Get grid layout styles
 */
function getGridStyles(layout?: PageBlock["layout"]): React.CSSProperties {
  if (!layout?.grid) return {};

  const grid = layout.grid;
  const css: React.CSSProperties = {};

  const getResponsiveValue = <T,>(value: T | ResponsiveValue<T> | undefined): T | undefined => {
    if (!value) return undefined;
    if (typeof value === "object" && !Array.isArray(value) && ("desktop" in value || "tablet" in value || "mobile" in value)) {
      return (value as ResponsiveValue<T>).desktop || (value as ResponsiveValue<T>).tablet || (value as ResponsiveValue<T>).mobile;
    }
    return value as T;
  };

  const columns = getResponsiveValue(grid.columns);
  if (columns) {
    css.display = "grid";
    css.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }

  const gap = getResponsiveValue(grid.gap);
  if (gap) css.gap = gap;

  const autoRows = getResponsiveValue(grid.autoRows);
  if (autoRows) css.gridAutoRows = autoRows;

  return css;
}

/**
 * Get container wrapper classes and styles based on layout type
 */
function getContainerWrapper(layout?: PageBlock["layout"]) {
  const layoutType = layout?.type || "container";
  const maxWidth = layout?.maxWidth;
  const padding = layout?.padding;

  const getResponsiveValue = <T,>(value: T | ResponsiveValue<T> | undefined): T | undefined => {
    if (!value) return undefined;
    if (typeof value === "object" && !Array.isArray(value) && ("desktop" in value || "tablet" in value || "mobile" in value)) {
      return (value as ResponsiveValue<T>).desktop || (value as ResponsiveValue<T>).tablet || (value as ResponsiveValue<T>).mobile;
    }
    return value as T;
  };

  const containerStyles: React.CSSProperties = {};
  const containerClasses: string[] = [];

  if (layoutType === "full-width") {
    // Full width - no container constraints
    containerClasses.push("w-full");
  } else if (layoutType === "boxed") {
    // Boxed - constrained container with max-width
    containerClasses.push("w-full mx-auto");
    const maxW = getResponsiveValue(maxWidth);
    if (maxW) {
      containerStyles.maxWidth = maxW;
    } else {
      containerStyles.maxWidth = "1200px"; // Default boxed width
    }
    const pad = getResponsiveValue(padding);
    if (pad) {
      containerStyles.paddingLeft = pad;
      containerStyles.paddingRight = pad;
    } else {
      containerStyles.paddingLeft = "1rem";
      containerStyles.paddingRight = "1rem";
    }
  } else {
    // Container - standard responsive container
    containerClasses.push("w-full mx-auto px-4 sm:px-6 lg:px-8");
    const maxW = getResponsiveValue(maxWidth);
    if (maxW) {
      containerStyles.maxWidth = maxW;
    } else {
      containerStyles.maxWidth = "1280px"; // Default container max-width
    }
  }

  return { containerClasses: containerClasses.join(" "), containerStyles };
}

/**
 * Render a single block
 */
export function BlockRenderer({ block }: { block: PageBlock }) {
  const Component = ComponentRegistry[block.blockType];

  if (!Component) {
    console.warn(`Component type "${block.blockType}" not found in registry`);
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-sm">
        Unknown block type: {block.blockType}
      </div>
    );
  }

  // Layout blocks handle their own rendering and styles
  if (block.blockType === "layout-block") {
    return <Component layout={block.layout} children={block.children} styles={block.styles} />;
  }

  // Component blocks that need the block prop
  const componentBlocks = ["inline-edit-view-block", "live-view-block", "media-card-block", "qr-code-block"];
  const isComponentBlock = componentBlocks.includes(block.blockType);

  // For other blocks, apply container wrapper and styles
  const { containerClasses, containerStyles } = getContainerWrapper(block.layout);
  const styleProps = blockStylesToCSS(block.styles);
  
  return (
    <div className={containerClasses} style={containerStyles}>
      <div style={styleProps}>
        {isComponentBlock ? (
          <Component block={block} />
        ) : (
          <Component {...block} />
        )}
      </div>
    </div>
  );
}
