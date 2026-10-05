"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])
  return reduced
}

/** IDs added after the first snapshot — plus a lone opening line. */
export function useAskSkyFreshMessageIds(ids: Array<string | number>) {
  const seenRef = React.useRef<Set<string> | null>(null)
  const key = ids.map(String).join("\0")
  return React.useMemo(() => {
    const next = key ? key.split("\0") : []
    if (seenRef.current === null) {
      seenRef.current = new Set(next)
      return next.length === 1 ? new Set(next) : new Set<string>()
    }
    const added = new Set<string>()
    for (const id of next) {
      if (!seenRef.current.has(id)) {
        added.add(id)
        seenRef.current.add(id)
      }
    }
    return added
  }, [key])
}

export function askSkyMsgInClass(animate: boolean | undefined) {
  return animate ? "asksky-msg-in" : undefined
}

/** Pulsing dots shown while Sky is drafting a reply. */
export function AskSkyTypingDots({
  label = "Sky is typing",
}: {
  label?: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-white"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="asksky-typing-dot" />
      <span className="asksky-typing-dot" />
      <span className="asksky-typing-dot" />
    </span>
  )
}

/**
 * Types Sky's text in once. Later edits snap in. Pass `children` to swap in
 * rich content (links, highlights) after the type-in finishes.
 */
export function AskSkyTypedText({
  text,
  animate = true,
  onTick,
  onDone,
  className,
  children,
}: {
  text: string
  animate?: boolean
  onTick?: () => void
  /** Fires once, when the text is fully shown. */
  onDone?: () => void
  className?: string
  children?: React.ReactNode
}) {
  const reduced = usePrefersReducedMotion()
  const skip = !animate || reduced
  const [shown, setShown] = React.useState(skip ? text : "")
  const finished = React.useRef(skip)
  const onTickRef = React.useRef(onTick)
  onTickRef.current = onTick
  const onDoneRef = React.useRef(onDone)
  onDoneRef.current = onDone
  const doneFired = React.useRef(false)

  React.useEffect(() => {
    if (skip || finished.current) {
      finished.current = true
      setShown(text)
      if (!doneFired.current) {
        doneFired.current = true
        onDoneRef.current?.()
      }
      return
    }

    let index = 0
    const step = Math.max(1, Math.ceil(text.length / 52))
    const id = window.setInterval(() => {
      index = Math.min(text.length, index + step)
      setShown(text.slice(0, index))
      onTickRef.current?.()
      if (index >= text.length) {
        finished.current = true
        window.clearInterval(id)
        if (!doneFired.current) {
          doneFired.current = true
          onDoneRef.current?.()
        }
      }
    }, 16)
    return () => window.clearInterval(id)
  }, [text, skip])

  const done = shown.length >= text.length
  if (done && children) {
    return <>{children}</>
  }

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{shown}</span>
      {done ? null : (
        <span
          className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-current align-[-0.12em] opacity-80"
          aria-hidden
        />
      )}
    </span>
  )
}
