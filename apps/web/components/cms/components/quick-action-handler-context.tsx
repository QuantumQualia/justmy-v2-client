"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type QuickActionHandler = () => void;

export interface QuickActionHandlerContextValue {
  getHandler: (actionId: string) => QuickActionHandler | undefined;
  /** Register a handler for any action ID (dynamic). Use when action IDs come from CMS/config/text input. */
  registerHandler: (actionId: string, handler: QuickActionHandler) => void;
}

const QuickActionHandlerContext = createContext<QuickActionHandlerContextValue | null>(null);

export function QuickActionHandlerProvider({
  handlers: initialHandlers,
  children,
}: {
  /** Optional initial handlers. You can also register handlers dynamically via registerHandler from context. */
  handlers?: Record<string, QuickActionHandler>;
  children: React.ReactNode;
}) {
  const [handlers, setHandlers] = useState<Record<string, QuickActionHandler>>(() => initialHandlers ?? {});

  const registerHandler = useCallback((actionId: string, handler: QuickActionHandler) => {
    setHandlers((prev) => (prev[actionId] === handler ? prev : { ...prev, [actionId]: handler }));
  }, []);

  const value = useMemo<QuickActionHandlerContextValue>(
    () => ({
      getHandler: (actionId: string) => handlers[actionId],
      registerHandler,
    }),
    [handlers, registerHandler]
  );

  return (
    <QuickActionHandlerContext.Provider value={value}>
      {children}
    </QuickActionHandlerContext.Provider>
  );
}

export function useQuickActionHandler(): QuickActionHandlerContextValue | null {
  return useContext(QuickActionHandlerContext);
}
