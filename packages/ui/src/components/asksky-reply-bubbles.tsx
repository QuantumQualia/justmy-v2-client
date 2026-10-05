"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import {
  AskSkyTypedText,
  AskSkyTypingDots,
  askSkyMsgInClass,
  usePrefersReducedMotion,
} from "@workspace/ui/components/asksky-typed-text"
import { SkyAvatar } from "@workspace/ui/components/sky-avatar"

const SHORT_REPLY = 220
const BUBBLE_TARGET = 200
const NEXT_BUBBLE_DELAY_MS = 450

/**
 * Breaks one long Sky reply into at most `max` short bubbles, like a text
 * thread. Splits on paragraphs first, then on sentence ends. Never splits a
 * sentence, so links and list items stay whole.
 */
export function splitSkyReply(text: string, max = 3): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim()
  if (!clean) return []
  if (clean.length <= SHORT_REPLY || max <= 1) return [clean]

  let pieces = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (pieces.length === 1) {
    pieces = clean
      .split(/(?<=[.!?])\s+(?=["“(]?[A-Z0-9])/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (pieces.length <= 1) return [clean]

  const count = Math.min(max, pieces.length, Math.ceil(clean.length / BUBBLE_TARGET))
  if (count <= 1) return [clean]
  if (pieces.length <= count) return pieces

  const joiner = clean.includes("\n\n") ? "\n\n" : " "
  const target = clean.length / count
  const groups: string[][] = [[]]
  let size = 0
  pieces.forEach((piece, i) => {
    const current = groups[groups.length - 1]!
    const left = pieces.length - i
    const groupsLeft = count - groups.length
    if (current.length > 0 && groupsLeft > 0 && (size >= target || left <= groupsLeft)) {
      groups.push([piece])
      size = piece.length
      return
    }
    current.push(piece)
    size += piece.length
  })
  return groups.map((g) => g.join(joiner))
}

export function formatSkyTime(at: Date | number | string) {
  const date = at instanceof Date ? at : new Date(at)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

/**
 * Sky's reply as 2–3 short stacked bubbles beside her avatar. With `animate`,
 * each bubble types in after the previous one, with a beat of typing dots.
 */
export function AskSkyReplyBubbles({
  text,
  animate = false,
  max = 3,
  at,
  renderPart,
  footer,
  onTick,
  avatarSize = 32,
  avatarClassName,
  className,
  bubbleClassName,
}: {
  text: string
  animate?: boolean
  max?: number
  /** When Sky replied; shown under the last bubble. */
  at?: Date | number | string | null
  /** Rich content (links, highlights) for a part, shown once it has typed in. */
  renderPart?: (part: string, index: number) => React.ReactNode
  /** Extra content (actions, citations) inside the last bubble. */
  footer?: React.ReactNode
  onTick?: () => void
  avatarSize?: number
  avatarClassName?: string
  className?: string
  bubbleClassName?: string
}) {
  const parts = React.useMemo(() => splitSkyReply(text, max), [text, max])
  const reduced = usePrefersReducedMotion()
  const stagger = animate && !reduced
  const [visible, setVisible] = React.useState(stagger ? 1 : parts.length)
  const [pausing, setPausing] = React.useState(false)
  const [time, setTime] = React.useState<string | null>(null)
  const onTickRef = React.useRef(onTick)
  onTickRef.current = onTick

  React.useEffect(() => {
    if (!stagger) setVisible(parts.length)
  }, [stagger, parts.length])

  React.useEffect(() => {
    setTime(at == null ? null : formatSkyTime(at))
  }, [at])

  React.useEffect(() => {
    if (!pausing) return
    const id = window.setTimeout(() => {
      setPausing(false)
      setVisible((v) => Math.min(parts.length, v + 1))
      onTickRef.current?.()
    }, NEXT_BUBBLE_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [pausing, parts.length])

  const shownParts = parts.slice(0, visible)
  const allShown = visible >= parts.length && !pausing

  return (
    <div className={cn("flex min-w-0 items-end gap-2 sm:gap-3", className)}>
      <SkyAvatar size={avatarSize} className={cn("mb-5", avatarClassName)} />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        {shownParts.map((part, i) => {
          const last = i === parts.length - 1
          return (
            <div
              key={i}
              className={cn(
                "asksky-sky-bubble-assistant min-w-0 break-words text-sm leading-relaxed sm:text-[15px]",
                !last && "asksky-sky-bubble-stacked",
                askSkyMsgInClass(stagger),
                bubbleClassName,
              )}
            >
              <p className="whitespace-pre-wrap">
                <AskSkyTypedText
                  text={part}
                  animate={stagger}
                  onTick={onTick}
                  onDone={
                    stagger && i === visible - 1 && i < parts.length - 1
                      ? () => setPausing(true)
                      : undefined
                  }
                >
                  {renderPart ? renderPart(part, i) : undefined}
                </AskSkyTypedText>
              </p>
              {last && allShown ? footer : null}
            </div>
          )
        })}
        {pausing ? (
          <div
            className={cn(
              "asksky-sky-bubble-assistant asksky-sky-bubble-stacked inline-flex items-center px-4 py-3",
              askSkyMsgInClass(true),
            )}
          >
            <AskSkyTypingDots />
          </div>
        ) : null}
        <p
          className={cn(
            "asksky-sky-meta h-4 pl-1 transition-opacity",
            allShown ? "opacity-100" : "opacity-0",
          )}
        >
          Sky{time ? ` · ${time}` : ""}
        </p>
      </div>
    </div>
  )
}
