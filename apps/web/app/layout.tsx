import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://justmy.com"),
  title: {
    default: "JustMy.com - Personal Operating System",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
