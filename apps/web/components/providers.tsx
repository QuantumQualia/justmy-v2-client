"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Toaster } from "@workspace/ui/components/sonner"
import { GlobalShareHost } from "@/components/common/share/share-host"
import { AIChatbot } from "@/components/common/chatbot/ai-chatbot"
import { ChatbotButton } from "@/components/common/chatbot/chatbot-button"
import { QueryProvider } from "@/components/providers/query-provider"
import { ImpersonationBanner } from "@/components/auth/impersonation-banner"

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
      defaultTheme="light"
      enableSystem={false}
      storageKey="justmy-color-theme"
      disableTransitionOnChange
      enableColorScheme
    >
      <QueryProvider>
        <AuthSync />
        <ImpersonationBanner />
        {children}
        <GlobalShareHost />
        <AIChatbot />
        <ChatbotButton />
        <Toaster
          position="top-right"
          richColors
          expand={true}
          toastOptions={{
            duration: 3000,
          }}
        />
      </QueryProvider>
    </NextThemesProvider>
  )
}
