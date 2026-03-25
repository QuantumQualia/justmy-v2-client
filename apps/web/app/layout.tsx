import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"
import { cookies, headers } from "next/headers"

import { fetchPublicProfileByHandle } from "@/lib/mycard/fetch-public-profile-by-handle"
import { firstPathSegment, isLikelyHandlePath } from "@/lib/mycard/handle-route"
import { registerTypeFromProfile } from "@/lib/mycard/register-type-from-profile"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/common/navbar/navbar"
import { SearchResultsPanel } from "@/components/common/search/search-results-panel"

// Configure fonts with fallback to handle network issues during build
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
  fallback: ["monospace"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://justmy.com"),
  title: {
    default: "Personal Operating System",
    template: "%s | JustMy.com",
  },
  description: "The first Personal Operating System for your life, business, and community. Manage your digital identity, connect with your local market, and grow your business.",
  keywords: ["personal operating system", "city OS", "business management", "digital identity", "community platform", "local business"],
  authors: [{ name: "JustMy" }],
  creator: "JustMy",
  publisher: "JustMy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "JustMy.com",
    title: "JustMy.com - Personal Operating System",
    description: "The first Personal Operating System for your life, business, and community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JustMy.com - Personal Operating System",
    description: "The first Personal Operating System for your life, business, and community.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialIsAuthed = !!cookieStore.get("auth_access_token")?.value

  const headerList = await headers()
  const pathname = headerList.get("x-pathname") ?? ""
  let initialMycardPublicNav = false
  let initialMycardRegisterType = "personal"
  let initialMycardProfileSlug = ""
  if (isLikelyHandlePath(pathname)) {
    const handle = firstPathSegment(pathname)
    if (handle) {
      const profile = await fetchPublicProfileByHandle(handle)
      if (profile != null) {
        initialMycardPublicNav = true
        initialMycardRegisterType = registerTypeFromProfile(profile)
        initialMycardProfileSlug = profile.slug || handle
      }
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <a
            href="#site-main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[300] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-neutral-900 focus:shadow-lg"
          >
            Skip to content
          </a>
          <Navbar
            initialIsAuthed={initialIsAuthed}
            initialMycardPublicNav={initialMycardPublicNav}
            initialMycardRegisterType={initialMycardRegisterType}
            initialMycardProfileSlug={initialMycardProfileSlug}
          />
          <SearchResultsPanel />
          <div id="site-main" className="min-h-0">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
