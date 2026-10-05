"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { SkyAvatar } from "@workspace/ui/components/sky-avatar";
import { cn } from "@workspace/ui/lib/utils";

import { AskSkyGrowTextarea } from "@/components/asksky/asksky-grow-textarea";

const DEFAULT_INTRO =
  "Hey, I'm Sky - ask me anything about this business, or what's going on nearby.";

/**
 * Compact "text Sky" card for any page (myCards, footers, nonprofit pages,
 * empty states). Questions open AskSKY on the NewsSTAND, or go to `onAsk`.
 */
export function AskSkyTextCard({
  intro = DEFAULT_INTRO,
  sampleQuestion = "Are y'all open on Sundays?",
  placeholder = "Text Sky a question…",
  about,
  onAsk,
  className,
}: {
  intro?: string;
  sampleQuestion?: string;
  placeholder?: string;
  /** Business, nonprofit, or event the question is about; added to the search. */
  about?: string;
  onAsk?: (question: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [draft, setDraft] = useState("");

  function submit(text: string) {
    const question = text.trim();
    if (!question) return;
    if (onAsk) {
      onAsk(question);
      setDraft("");
      return;
    }
    const query = about?.trim() ? `${question} (${about.trim()})` : question;
    router.push(`/news?ask=${encodeURIComponent(query)}`);
  }

  return (
    <Card className={cn("gap-0 p-5 sm:p-6", className)}>
      <div className="flex items-center gap-3">
        <SkyAvatar size={44} />
        <div className="min-w-0">
          <p className="font-serif text-sm italic text-muted-foreground">
            Got <span className="font-sans text-xs font-bold not-italic tracking-[0.14em]">QUESTIONS?</span>
          </p>
          <p className="asksky-sky-brand text-2xl leading-tight tracking-tight">AskSKY!</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          Online
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        <div className="flex items-end gap-2">
          <SkyAvatar size={28} className="mb-0.5" />
          <p className="asksky-sky-bubble-assistant text-sm leading-relaxed">{intro}</p>
        </div>
        {sampleQuestion ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDraft(sampleQuestion)}
              className="asksky-sky-bubble-user text-left text-sm transition hover:opacity-80"
            >
              {sampleQuestion}
            </button>
          </div>
        ) : null}
      </div>

      <form
        className="mt-5 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask Sky a question
        </label>
        <AskSkyGrowTextarea
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="asksky-sky-send mb-0.5 h-11 w-11 shrink-0 rounded-full"
          disabled={!draft.trim()}
          aria-label="Send to AskSKY!"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </Card>
  );
}
