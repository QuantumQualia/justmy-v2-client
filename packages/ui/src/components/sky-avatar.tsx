import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type SkyAvatarProps = {
  className?: string
  size?: number
  title?: string
}

export function SkyAvatar({ className, size = 32, title = "Sky" }: SkyAvatarProps) {
  const id = React.useId()
  const gradientId = `sky-avatar-fill-${id}`
  const glowId = `sky-avatar-glow-${id}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradientId} x1="12" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.55" stopColor="#6366f1" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <radialGradient id={glowId} cx="32" cy="22" r="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradientId})`} />
      <circle cx="32" cy="32" r="32" fill={`url(#${glowId})`} />
      <circle cx="24" cy="27" r="3.1" fill="#fff" />
      <path
        d="M38.2 25.2c1.7 0 3.2 1.1 3.6 2.7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M22.5 38.5c3.4 5.4 9.1 8 16.2 7.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SkyPoweredBy({ className }: { className?: string }) {
  return (
    <p className={cn("asksky-sky-powered", className)}>
      Powered by <span className="asksky-sky-brand">AskSKY!</span>
    </p>
  )
}
