"use client";

import { createContext, useContext, type ReactNode } from "react";

const NewsHostContext = createContext(false);

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
