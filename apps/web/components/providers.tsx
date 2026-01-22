"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { tokenStorage } from "@/lib/storage/token-storage"

/**
 * Sync localStorage tokens to cookies on app load
 * This ensures middleware can read tokens even if they were set before cookie support
 * Runs immediately on mount, before any navigation
 */
function AuthSync() {
  // No longer needed - tokenStorage now uses cookies directly
  // This component is kept for potential future auth-related initialization
  React.useEffect(() => {
    // Tokens are stored in cookies via tokenStorage, so no sync needed
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <AuthSync />
      {children}
    </NextThemesProvider>
  )
}
