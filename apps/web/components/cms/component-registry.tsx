import React from "react";
import { TextBlock } from "./components/text-block";
import { LayoutBlock } from "./components/layout-block";
import { WelcomeMessageBlock } from "./components/welcome-message-block";
import { DayInHistoryBlock } from "./components/day-in-history-block";
import { QuickActionBlock } from "./components/quick-action-block";
import { AdBannerBlock } from "./components/ad-banner-block";
import { ImageBlock } from "./components/image-block";
import { VideoBlock } from "./components/video-block";
import { LookBookBlock } from "./components/lookbook-block";
import { SuperSearchBarBlock } from "./components/super-search-bar-block";
import { SearchResultsPanelBlock } from "./components/search-results-panel-block";
import { WeatherHeroBlock } from "./components/weather-hero-block";
import { HourlyScrollBlock } from "./components/hourly-scroll-block";
import { LifestyleIndicesBlock } from "./components/lifestyle-indices-block";
import { SevenDayStrategyBlock } from "./components/seven-day-strategy-block";
import { RadarPanelBlock } from "./components/radar-panel-block";
import { TopNewsBriefingBlock } from "./components/top-news-briefing-block";
import { MarketEventsBlock } from "./components/market-events-block";
import { LocalDealsBlock } from "./components/local-deals-block";
import { PlaceholderPanelBlock } from "./components/placeholder-panel-block";
import { InlineEditViewBlock } from "./components/mycard/inline-edit-view-block";
import { LiveViewBlock } from "./components/mycard/live-view-block";
import { MediaCardBlock } from "./components/mycard/media-card-block";
import { QRCodeBlock } from "./components/mycard/qr-code-block";
import { NavbarBlock } from "./components/navbar-block";
import { ReferAFriendBlock } from "./components/refer-a-friend-block";
import { AppHubBlock } from "./components/app-hub-block";
import type { PageBlock, BlockStyles, ResponsiveValue } from "@/lib/services/cms";

// Component registry - maps Payload block types to React components
export const ComponentRegistry: Record<
  string,
  React.ComponentType<any>
> = {
  "text-block": TextBlock,
  "layout-block": LayoutBlock,
  "welcome-message-block": WelcomeMessageBlock,
  "day-in-history-block": DayInHistoryBlock,
  "quick-action-block": QuickActionBlock,
  "ad-banner-block": AdBannerBlock,
  "image-block": ImageBlock,
  "video-block": VideoBlock,
  "lookbook-block": LookBookBlock,
  "super-search-bar-block": SuperSearchBarBlock,
  "search-results-panel-block": SearchResultsPanelBlock,
  "weather-hero-block": WeatherHeroBlock,
  "hourly-scroll-block": HourlyScrollBlock,
  "lifestyle-indices-block": LifestyleIndicesBlock,
  "seven-day-strategy-block": SevenDayStrategyBlock,
  "radar-panel-block": RadarPanelBlock,
  "top-news-briefing-block": TopNewsBriefingBlock,
  "market-events-block": MarketEventsBlock,
  "local-deals-block": LocalDealsBlock,
  "placeholder-panel-block": PlaceholderPanelBlock,
  "inline-edit-view-block": InlineEditViewBlock,
  "live-view-block": LiveViewBlock,
  "media-card-block": MediaCardBlock,
  "qr-code-block": QRCodeBlock,
  "navbar-block": NavbarBlock,
  "refer-a-friend-block": ReferAFriendBlock,
  "app-hub-block": AppHubBlock,
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

  // Padding (shorthand + per-side)
  const padding = getResponsiveValue(styles.padding);
  if (padding) css.padding = padding;
  const paddingTop = getResponsiveValue(styles.paddingTop);
  if (paddingTop) css.paddingTop = paddingTop;
  const paddingRight = getResponsiveValue(styles.paddingRight);
  if (paddingRight) css.paddingRight = paddingRight;
  const paddingBottom = getResponsiveValue(styles.paddingBottom);
  if (paddingBottom) css.paddingBottom = paddingBottom;
  const paddingLeft = getResponsiveValue(styles.paddingLeft);
  if (paddingLeft) css.paddingLeft = paddingLeft;

  // Margin (shorthand + per-side)
  const margin = getResponsiveValue(styles.margin);
  if (margin) css.margin = margin;
  const marginTop = getResponsiveValue(styles.marginTop);
  if (marginTop) css.marginTop = marginTop;
  const marginRight = getResponsiveValue(styles.marginRight);
  if (marginRight) css.marginRight = marginRight;
  const marginBottom = getResponsiveValue(styles.marginBottom);
  if (marginBottom) css.marginBottom = marginBottom;
  const marginLeft = getResponsiveValue(styles.marginLeft);
  if (marginLeft) css.marginLeft = marginLeft;

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
 *
 * When disableContainer is true, we skip the outer layout container wrapper
 * (used for nested blocks inside layout-block columns).
 */
export function BlockRenderer({
  block,
  disableContainer,
}: {
  block: PageBlock;
  disableContainer?: boolean;
}) {
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
  const componentBlocks = [
    "inline-edit-view-block",
    "live-view-block",
    "media-card-block",
    "qr-code-block",
    "welcome-message-block",
    "day-in-history-block",
    "quick-action-block",
    "ad-banner-block",
    "super-search-bar-block",
    "search-results-panel-block",
    "weather-hero-block",
    "hourly-scroll-block",
    "lifestyle-indices-block",
    "seven-day-strategy-block",
    "radar-panel-block",
    "top-news-briefing-block",
    "market-events-block",
    "local-deals-block",
    "placeholder-panel-block",
    "navbar-block",
    "refer-a-friend-block",
    "app-hub-block",
  ];
  const isComponentBlock = componentBlocks.includes(block.blockType);

  const styleProps = blockStylesToCSS(block.styles);

  // When nested inside another layout (e.g. layout-block columns), don't add another container
  if (disableContainer) {
    return (
      <div style={styleProps}>
        {isComponentBlock ? (
          <Component block={block} />
        ) : (
          <Component {...block} />
        )}
      </div>
    );
  }

  // Determine container style: "full-width" or "container" (default)
  const containerStyle = block.layout?.type || "container";

  // Full-width blocks render edge-to-edge with no container wrapper.
  // No wrapper div is added so that sticky/fixed positioning works correctly
  // (sticky is bounded by its parent — a tight wrapper would kill it).
  if (containerStyle === "full-width") {
    return isComponentBlock ? (
      <Component block={block} />
    ) : (
      <Component {...block} />
    );
  }

  // Container blocks get a centered wrapper with max-width and padding
  const { containerClasses, containerStyles } = getContainerWrapper(block.layout);

  return (
    <div className={containerClasses} style={containerStyles}>
      <div style={styleProps} className="mx-auto">
        {isComponentBlock ? (
          <Component block={block} />
        ) : (
          <Component {...block} />
        )}
      </div>
    </div>
  );
}
