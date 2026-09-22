"use client";

import { AskSkyGrowTextarea } from "@/components/asksky/asksky-grow-textarea";
import { AskSkyUserAvatar } from "@/components/asksky/asksky-user-avatar";
import { SkyAvatar } from "@workspace/ui/components/sky-avatar";
import { useEffect, useMemo, useState, type ReactNode, type Ref } from "react";

function rotatorLines(city?: string | null, questions?: string[]) {
  const extras = (questions || []).map((q) => q.trim()).filter(Boolean).slice(0, 4);
  if (extras.length) return extras.map((q) => ({ q, brand: "AskSKY!" }));
  const place = city?.trim();
  return [
    {
      q: place ? `What's happening in ${place} this weekend?` : "What's happening nearby this weekend?",
      brand: "AskSKY!",
    },
    { q: "Any deals near me right now?", brand: "AskSKY!" },
    { q: "Best patio for dinner tonight?", brand: "AskSKY!" },
    {
      q: place ? `What's open late in ${place}?` : "What's open late in my neighborhood?",
      brand: "AskSKY!",
    },
  ];
}

export function TryFreeHero({
  city,
  questions,
}: {
  city?: string | null;
  questions?: string[];
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const rotator = useMemo(
    () => rotatorLines(ready ? city : null, ready ? questions : []),
    [ready, city, questions],
  );
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % rotator.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [rotator]);
  const item = rotator[index] ?? rotator[0] ?? {
    q: "What's happening nearby this weekend?",
    brand: "AskSKY!",
  };

  return (
    <div className="mb-2 w-full shrink-0 text-center">
      <h1 className="m-0 mb-2 text-[32px] font-extrabold tracking-[-0.02em] text-[#1f1f29]">
        Got Questions?
      </h1>
      <p
        key={item.q}
        className="try-free-rotator-line m-0 w-full px-2 text-center text-[15px] font-medium leading-snug text-[#55536a] sm:text-base"
      >
        “{item.q}”{" "}
        <b className="bg-[linear-gradient(90deg,#7c6cf6,#5fa8ef)] bg-clip-text font-bold text-transparent">
          {item.brand}
        </b>
      </p>
    </div>
  );
}

export function SkyBubble({ children }: { children: ReactNode }) {
  return (
    <div className="asksky-msg-in flex w-full items-start gap-3 pr-1">
      <SkyAvatar size={40} className="mt-0.5" />
      <div className="min-w-0 rounded-[4px_18px_18px_18px] bg-[linear-gradient(135deg,#7c6cf6,#5fa8ef)] px-5 py-3.5 text-[15px] font-medium leading-relaxed text-white">
        {children}
      </div>
    </div>
  );
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="asksky-msg-in flex w-full items-start justify-end gap-3.5">
      <div className="min-w-0 max-w-[min(85%,calc(100%-3.75rem))] rounded-[18px_4px_18px_18px] border-[1.5px] border-[#e6e4f0] bg-white px-5 py-3.5 text-[15px] font-medium leading-relaxed text-[#1f1f29]">
        {children}
      </div>
      <AskSkyUserAvatar size={42} />
    </div>
  );
}

export function SkyTyping() {
  return (
    <SkyBubble>
      <span className="inline-flex items-center gap-1.5" role="status" aria-label="Sky is typing">
        <span className="size-1.5 rounded-full bg-white/90 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="size-1.5 rounded-full bg-white/90 animate-bounce" style={{ animationDelay: "160ms" }} />
        <span className="size-1.5 rounded-full bg-white/90 animate-bounce" style={{ animationDelay: "320ms" }} />
      </span>
    </SkyBubble>
  );
}

export function TryFreeInputBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  inputRef,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
  autoFocus?: boolean;
}) {
  return (
    <form
      className="w-full shrink-0"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-end gap-3 rounded-[1.375rem] border-[1.5px] border-[#e6e4f0] bg-white py-2 pr-2 pl-[22px] shadow-[0_2px_10px_rgba(31,31,41,0.04)]">
        <AskSkyGrowTextarea
          chrome={false}
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-busy={disabled}
          disabled={disabled}
          className="min-h-10 border-0 bg-transparent px-0 py-2 text-base font-medium text-[#1f1f29] shadow-none placeholder:text-[#9a97ac] md:text-[15px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={disabled}
          aria-label="Send"
          onMouseDown={(e) => e.preventDefault()}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c6cf6,#5fa8ef)] disabled:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 12h15M13 6l6 6-6 6"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}

export const TRY_FREE_CATEGORY_PILLS = [
  { id: "personal" as const, label: "I'm just looking around" },
  { id: "business" as const, label: "I run a business" },
  {
    id: "nonprofit" as const,
    label: "I'm with a nonprofit, government office, or local service",
  },
] as const;

export function tryFreeCategoryLabel(id: "personal" | "business" | "nonprofit") {
  return TRY_FREE_CATEGORY_PILLS.find((pill) => pill.id === id)?.label ?? id;
}

export function CategoryPills({
  onSelect,
  disabled,
}: {
  onSelect: (id: "personal" | "business" | "nonprofit") => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex w-full flex-wrap justify-center gap-2.5">
      {TRY_FREE_CATEGORY_PILLS.map((pill) => (
        <button
          key={pill.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(pill.id)}
          onMouseDown={(e) => e.preventDefault()}
          className="cursor-pointer whitespace-nowrap rounded-full border-[1.5px] border-[#e6e4f0] bg-white px-4 py-2 text-sm font-semibold text-[#3a3947] hover:border-[#b9aef7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}
