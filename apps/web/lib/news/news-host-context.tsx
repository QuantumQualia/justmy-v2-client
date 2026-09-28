"use client";

import { createContext, useContext, type ReactNode } from "react";

const NewsHostContext = createContext(false);
const NewsMarketSiteContext = createContext<string | null>(null);

export function NewsHostProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return <NewsHostContext.Provider value={value}>{children}</NewsHostContext.Provider>;
}

/** True when the request Host is a configured newsstand domain. */
export function useNewsHost(): boolean {
  return useContext(NewsHostContext);
}

export function NewsMarketSiteProvider({
  value,
  children,
}: {
  value: string | null;
  children: ReactNode;
}) {
  return <NewsMarketSiteContext.Provider value={value}>{children}</NewsMarketSiteContext.Provider>;
}

/** Market site hostname when the request host matched Market.site. */
export function useNewsMarketSite(): string | null {
  return useContext(NewsMarketSiteContext);
}
