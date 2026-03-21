"use client";

import * as React from "react";
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
import { ContentHubViewBlock } from "./components/content-hub-view-block";
import { SubProfilesBlock } from "./components/sub-profiles-block";
import { ProfileSpotlightBlock } from "./components/profile-spotlight-block";
import { compileBlockStyles, compileContainerWrapper } from "./block-responsive-styles";
import type { PageBlock } from "@/lib/services/cms";

// Component registry - maps Payload block types to React components
export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
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
  "content-hub-view-block": ContentHubViewBlock,
  "sub-profiles-block": SubProfilesBlock,
  "profile-spotlight-block": ProfileSpotlightBlock,
};

const componentBlocks = new Set([
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
  "content-hub-view-block",
  "sub-profiles-block",
  "profile-spotlight-block",
]);

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

  const innerStyleId = React.useId().replace(/:/g, "");
  const wrapStyleId = React.useId().replace(/:/g, "");
  const innerSelector = `[data-cms-style="${innerStyleId}"]`;
  const wrapSelector = `[data-cms-wrap="${wrapStyleId}"]`;

  const { inline: blockInline, responsiveCss: blockResponsiveCss } = React.useMemo(
    () => compileBlockStyles(block.styles, innerSelector),
    [block.styles, innerSelector]
  );

  const containerLayoutType = block.layout?.type || "container";

  const { containerClasses, inline: wrapInline, responsiveCss: wrapResponsiveCss } = React.useMemo(() => {
    if (disableContainer || containerLayoutType === "full-width") {
      return { containerClasses: "", inline: {}, responsiveCss: "" };
    }
    return compileContainerWrapper(block.layout, wrapSelector);
  }, [disableContainer, containerLayoutType, block.layout, wrapSelector]);

  const mergedResponsiveCss = React.useMemo(() => {
    if (disableContainer || containerLayoutType === "full-width") return blockResponsiveCss;
    return blockResponsiveCss + wrapResponsiveCss;
  }, [blockResponsiveCss, wrapResponsiveCss, disableContainer, containerLayoutType]);

  if (!Component) {
    console.warn(`Component type "${block.blockType}" not found in registry`);
    return (
      <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
        Unknown block type: {block.blockType}
      </div>
    );
  }

  // Layout blocks handle their own rendering and styles
  if (block.blockType === "layout-block") {
    return <Component layout={block.layout} children={block.children} styles={block.styles} />;
  }

  const isComponentBlock = componentBlocks.has(block.blockType);

  const styleTag =
    mergedResponsiveCss.length > 0 ? (
      <style dangerouslySetInnerHTML={{ __html: mergedResponsiveCss }} />
    ) : null;

  // When nested inside another layout (e.g. layout-block columns), don't add another container
  if (disableContainer) {
    return (
      <>
        {styleTag}
        <div data-cms-style={innerStyleId} style={blockInline}>
          {isComponentBlock ? <Component block={block} /> : <Component {...block} />}
        </div>
      </>
    );
  }

  // Full-width blocks render edge-to-edge with no container wrapper.
  // No wrapper div is added so that sticky/fixed positioning works correctly
  // (sticky is bounded by its parent — a tight wrapper would kill it).
  if (containerLayoutType === "full-width") {
    return (
      <>
        {styleTag}
        <div data-cms-style={innerStyleId} style={blockInline}>
          {isComponentBlock ? (
            <Component block={block} style={blockInline} />
          ) : (
            <Component {...block} style={blockInline} />
          )}
        </div>
      </>
    );
  }

  // Container blocks get a centered wrapper with max-width and padding
  return (
    <>
      {styleTag}
      <div data-cms-wrap={wrapStyleId} className={containerClasses} style={wrapInline}>
        <div data-cms-style={innerStyleId} style={blockInline} className="mx-auto">
          {isComponentBlock ? <Component block={block} /> : <Component {...block} />}
        </div>
      </div>
    </>
  );
}
