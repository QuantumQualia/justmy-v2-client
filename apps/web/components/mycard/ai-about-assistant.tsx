"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Mic, Sparkles, Loader2, Check, Wand2, Send } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { aiService, ApiClientError } from "@/lib/services/ai";
import type { ProfileData } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

interface AIAboutAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (text: string) => void;
  profileData: ProfileData;
  appearance?: "light" | "dark";
}

type ModalState = "prompting" | "suggesting" | "refining";
type RefinePreset = "punchier" | "add-education" | "add-experience" | "add-passion";

const PRESET_LABELS: Record<RefinePreset, string> = {
  punchier: "Make it punchier",
  "add-education": "Add education",
  "add-experience": "Add experience",
  "add-passion": "Add passion",
};

interface AboutSuggestions {
  professional: string;
  neighbor: string;
  visionary: string;
}

// Rotating prompt suggestions
const PROMPT_SUGGESTIONS = [
  "Tell me about your Memphis roots...",
  "What is your 'Big Dream'?",
  "What drives you every day?",
  "What makes you unique?",
  "Share your story...",
  "What are you passionate about?",
];

const LIGHT_SCROLL =
  "[scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300";

const lightSecondaryBtn =
  "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 hover:text-slate-900";
const lightChipBtn =
  "bg-white text-slate-700 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800";
const lightStyleCard =
  "w-full p-4 rounded-xl border text-left transition-all cursor-pointer bg-slate-50 border-slate-200 hover:bg-violet-50 hover:border-violet-400";
const skyPrimaryBtn =
  "text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";

export function AIAboutAssistant({
  isOpen,
  onClose,
  onAccept,
  profileData,
  appearance = "light",
}: AIAboutAssistantProps) {
  const isLight = appearance === "light";
  const [state, setState] = useState<ModalState>("prompting");
  const [rawInput, setRawInput] = useState("");
  const [suggestions, setSuggestions] = useState<AboutSuggestions | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<keyof AboutSuggestions | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [refineTurns, setRefineTurns] = useState<Array<{ role: "user"; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Voice recording state
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const baseInputRef = useRef<string>("");

  // Shared speech recognition hook
  const {
    isSupported: micSupported,
    isRecording,
    transcript,
    error: micError,
    start: startMic,
    stop: stopMic,
    reset: resetMic,
  } = useSpeechRecognition({ lang: "en-US", append: false });

  // When recording, stream transcript into the active composer.
  useEffect(() => {
    if (!isRecording) return;
    const spoken = (baseInputRef.current + (transcript ? " " + transcript : "")).trim();
    if (state === "refining") setRefineInput(spoken);
    else setRawInput(spoken);
  }, [transcript, isRecording, state]);

  // Surface mic-specific errors through the existing error banner
  useEffect(() => {
    if (micError) {
      setError(micError);
    }
  }, [micError]);

  // Rotate prompt suggestions
  useEffect(() => {
    if (state === "prompting" && isOpen) {
      const interval = setInterval(() => {
        setCurrentPromptIndex((prev) => (prev + 1) % PROMPT_SUGGESTIONS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [state, isOpen]);

  // Simulate progress bar during AI processing
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isLoading]);

  // Handle pre-recording countdown
  useEffect(() => {
    if (!isPreparing || prepCountdown === null) {
      return;
    }

    if (prepCountdown <= 0) {
      // Countdown finished – start actual recording
      setIsPreparing(false);
      setPrepCountdown(null);

      startMic();
      return;
    }

    const timer = setTimeout(() => {
      setPrepCountdown((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPreparing, prepCountdown, startMic]);

  // Reset state when modal closes
  useEffect(() => {
    if (isOpen) return;
    setState("prompting");
    setRawInput("");
    setSuggestions(null);
    setSelectedSuggestion(null);
    setSelectedText("");
    setRefineInput("");
    setRefineTurns([]);
    setIsLoading(false);
    setError(null);
    setProgress(0);
    setIsPreparing(false);
    setPrepCountdown(null);
    stopMic();
    resetMic();
  }, [isOpen, resetMic, stopMic]);

  const startRecording = () => {
    if (!micSupported) {
      setError("Speech recognition not available. Please use a modern browser.");
      return;
    }

    // Avoid re-triggering while already recording/preparing
    if (isRecording || isPreparing) {
      return;
    }

    // Capture the current text as the base for this recording session
    baseInputRef.current = state === "refining" ? refineInput : rawInput;
    resetMic();

    // Start a short countdown before beginning actual recording
    setError(null);
    setPrepCountdown(3);
    setIsPreparing(true);
  };

  const stopRecording = () => {
    // Cancel any countdown
    setIsPreparing(false);
    setPrepCountdown(null);

    stopMic();
  };

  const handleMagicStart = async () => {
    if (!rawInput.trim()) {
      setError("Please enter some information about yourself first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await aiService.generateAboutSuggestions({
        rawInput: rawInput.trim(),
        name: profileData.name,
        tagline: profileData.tagline,
        location: profileData.addresses?.[0]?.address,
      });

      setSuggestions(result);
      setState("suggesting");
    } catch (err) {
      console.error("Failed to generate suggestions:", err);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to generate suggestions. Please try again."
      );
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const handleSelectSuggestion = (type: keyof AboutSuggestions) => {
    if (!suggestions) return;
    setSelectedSuggestion(type);
    setSelectedText(suggestions[type]);
    setRefineInput("");
    setRefineTurns([]);
    setState("refining");
  };

  const runRefine = async (
    refinementType: RefinePreset | "custom",
    customInstruction?: string,
  ) => {
    if (!selectedText || !selectedText.trim()) return;
    const instruction = customInstruction?.trim();
    if (refinementType === "custom" && !instruction) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const profileBits = [
        profileData.name && `Name: ${profileData.name}`,
        profileData.tagline && `Tagline: ${profileData.tagline}`,
        profileData.addresses?.[0]?.address && `Address: ${profileData.addresses[0].address}`,
      ]
        .filter(Boolean)
        .join("\n");
      const result = await aiService.refineAbout({
        selectedText,
        refinementType,
        customInstruction:
          refinementType === "custom" && instruction
            ? `${instruction}${profileBits ? `\n\nProfile context:\n${profileBits}` : ""}`
            : instruction,
      });

      setSelectedText(result.refinedText);
      setRefineTurns((turns) => [
        ...turns,
        { role: "user", text: instruction || PRESET_LABELS[refinementType as RefinePreset] },
      ]);
      if (refinementType === "custom") setRefineInput("");
    } catch (err) {
      console.error("Failed to refine:", err);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to refine text. Please try again."
      );
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const handleRefine = (refinementType: RefinePreset) => {
    void runRefine(refinementType);
  };

  const handleCustomRefine = () => {
    void runRefine("custom", refineInput);
  };

  const handleAccept = () => {
    const text = selectedText ? selectedText.trim() : "";
    if (text) {
      onAccept(text);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in",
        isLight ? "bg-slate-900/40 backdrop-blur-sm" : "bg-black/70 backdrop-blur-sm",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "p-6 rounded-2xl border shadow-2xl w-full max-w-lg animate-in zoom-in-95 max-h-[90vh] overflow-y-auto",
          isLight
            ? `bg-white border-slate-200 text-slate-900 ${LIGHT_SCROLL}`
            : "bg-card border-border",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className={cn("text-lg font-bold", isLight ? "text-slate-900" : "text-foreground")}>AskSKY!</h3>
              <p className={cn("text-xs", isLight ? "text-slate-500" : "text-muted-foreground")}>Draft and refine your About</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
              isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-muted hover:bg-accent",
            )}
          >
            <X className={cn("h-4 w-4", isLight ? "text-slate-500" : "text-muted-foreground")} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className={cn("text-sm", isLight ? "text-red-600" : "text-red-400")}>{error}</p>
          </div>
        )}

        {/* State 1: Prompting Stage */}
        {state === "prompting" && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div
                  className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording || isPreparing
                      ? "bg-red-500/20 animate-pulse"
                      : "bg-gradient-to-br from-blue-600/20 to-purple-600/20"
                  }`}
                >
                  <Mic
                    className={cn(
                      "h-10 w-10",
                      isRecording || isPreparing
                        ? isLight
                          ? "text-red-600"
                          : "text-red-400"
                        : isLight
                          ? "text-violet-600"
                          : "text-blue-400",
                    )}
                  />
                </div>
              </div>
              <div>
                <p className={cn("text-sm mb-2", isLight ? "text-slate-500" : "text-muted-foreground")}>
                  Don't worry about being perfect. Just brain dump who you are, what you do, and why you love it.
                </p>
                {isPreparing && prepCountdown !== null ? (
                  <p className={cn("text-xs font-semibold", isLight ? "text-red-600" : "text-red-300")}>
                    Starting in {prepCountdown}...
                  </p>
                ) : (
                  <p className={cn("text-xs animate-pulse", isLight ? "text-slate-400" : "text-muted-foreground")}>
                    {PROMPT_SUGGESTIONS[currentPromptIndex]}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={rawInput}
                onChange={(e) => {
                  setRawInput(e.target.value);
                }}
                placeholder="Start typing or use voice input..."
                className={cn(
                  "w-full min-h-[150px] p-4 text-sm rounded-xl focus:outline-none focus:ring-2 resize-none overflow-y-auto",
                  LIGHT_SCROLL,
                  isLight
                    ? "text-slate-900 bg-white border border-slate-200 placeholder:text-slate-400 focus:ring-violet-200 focus:border-violet-400"
                    : "text-foreground bg-background border border-input placeholder:text-muted-foreground focus:ring-blue-500/40 focus:border-blue-500",
                )}
                autoFocus
              />
              <div className="flex gap-2">
                {micSupported && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isPreparing}
                    className={cn(
                      "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2",
                      isRecording || isPreparing
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : isLight
                          ? lightSecondaryBtn
                          : "bg-muted hover:bg-accent text-foreground",
                    )}
                  >
                    <Mic className="h-4 w-4" />
                    {isRecording
                      ? "Stop Recording"
                      : isPreparing
                        ? "Preparing..."
                        : "Start Recording"}
                  </button>
                )}
                <button
                  onClick={handleMagicStart}
                  disabled={!rawInput.trim() || isLoading}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2",
                    skyPrimaryBtn,
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Magic Start
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className={cn("w-full rounded-full h-2 overflow-hidden", isLight ? "bg-slate-100" : "bg-muted")}>
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={cn("text-xs text-center", isLight ? "text-slate-500" : "text-muted-foreground")}>Synthesizing your greatness...</p>
              </div>
            )}
          </div>
        )}

        {/* State 2: Suggestion Stage */}
        {state === "suggesting" && suggestions && (
          <div className="space-y-4">
            <p className={cn("text-sm text-center mb-4", isLight ? "text-slate-500" : "text-muted-foreground")}>
              Choose the style that best represents you:
            </p>

            <div className="space-y-3">
              {(
                [
                  ["professional", "The Professional", "Credential-heavy and authoritative"],
                  ["neighbor", "The Neighbor", "Warm, community-focused, and approachable"],
                  ["visionary", "The Visionary", "Bold, high-energy, and mission-driven"],
                ] as const
              ).map(([key, title, blurb]) => (
                <button
                  key={key}
                  onClick={() => handleSelectSuggestion(key)}
                  className={cn(
                    "group w-full p-4 rounded-xl border text-left transition-all cursor-pointer",
                    isLight
                      ? lightStyleCard
                      : "bg-muted/50 hover:bg-accent border-border hover:border-blue-500",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-foreground")}>
                      {title}
                    </h4>
                    <Check
                      className={cn(
                        "h-4 w-4 opacity-0 group-hover:opacity-100",
                        isLight ? "text-violet-600" : "text-blue-400",
                      )}
                    />
                  </div>
                  <p className={cn("text-xs mb-2", isLight ? "text-slate-500" : "text-muted-foreground")}>{blurb}</p>
                  <p className={cn("text-xs line-clamp-3", isLight ? "text-slate-700" : "text-muted-foreground")}>
                    {suggestions[key]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* State 3: Refinement Stage */}
        {state === "refining" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={cn("block text-xs font-semibold uppercase tracking-wide", isLight ? "text-slate-500" : "text-foreground")}>
                Your About Text
              </label>
              <textarea
                value={selectedText || ""}
                onChange={(e) => setSelectedText(e.target.value)}
                className={cn(
                  "w-full min-h-[200px] p-4 text-sm rounded-xl focus:outline-none focus:ring-2 resize-y overflow-y-auto",
                  LIGHT_SCROLL,
                  isLight
                    ? "text-slate-900 bg-white border border-slate-200 focus:ring-violet-200 focus:border-violet-400"
                    : "text-foreground bg-background border border-input focus:ring-blue-500/40 focus:border-blue-500",
                )}
              />
              <p className={cn("text-[11px]", isLight ? "text-slate-500" : "text-muted-foreground")}>
                {selectedText.trim().length.toLocaleString()} characters
                {selectedText.trim()
                  ? ` · ${selectedText.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words`
                  : ""}
              </p>
            </div>

            {refineTurns.length ? (
              <div className={cn(
                "max-h-28 space-y-1.5 overflow-y-auto rounded-xl border p-2",
                isLight ? "border-slate-200 bg-slate-50" : "border-border bg-muted/40",
              )}>
                {refineTurns.map((turn, index) => (
                  <p key={`${turn.text}-${index}`} className="text-xs text-foreground">
                    <span className="font-semibold text-violet-700">You: </span>
                    {turn.text}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <p className={cn("text-xs font-semibold uppercase tracking-wide", isLight ? "text-slate-500" : "text-foreground")}>
                Keep talking to AskSKY
              </p>
              <p className={cn("text-xs", isLight ? "text-slate-500" : "text-muted-foreground")}>
                Example: “Make it 500 words, add our weekend hours, and mention our veteran discount.”
              </p>
              <textarea
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCustomRefine();
                  }
                }}
                placeholder="Tell AskSKY what to change…"
                disabled={isLoading}
                className={cn(
                  "w-full min-h-[72px] p-3 text-sm rounded-xl focus:outline-none focus:ring-2 resize-none overflow-y-auto disabled:opacity-60",
                  LIGHT_SCROLL,
                  isLight
                    ? "text-slate-900 bg-white border border-slate-200 placeholder:text-slate-400 focus:ring-violet-200 focus:border-violet-400"
                    : "text-foreground bg-background border border-input placeholder:text-muted-foreground focus:ring-blue-500/40 focus:border-blue-500",
                )}
              />
              <div className="flex gap-2">
                {micSupported && (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isPreparing || isLoading}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                      isRecording || isPreparing
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : isLight
                          ? lightSecondaryBtn
                          : "bg-muted hover:bg-accent text-foreground",
                    )}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {isRecording ? "Stop" : isPreparing ? "Starting…" : "Speak"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCustomRefine}
                  disabled={!refineInput.trim() || isLoading}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                    skyPrimaryBtn,
                  )}
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  AskSKY!
                </button>
              </div>
            </div>

            {/* Refinement Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PRESET_LABELS) as RefinePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleRefine(preset)}
                  disabled={isLoading}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:cursor-not-allowed",
                    isLight
                      ? `${lightChipBtn} disabled:bg-slate-50 disabled:text-slate-400`
                      : "bg-muted text-foreground hover:bg-accent disabled:bg-muted/50",
                  )}
                >
                  <Wand2 className="h-3 w-3" />
                  {PRESET_LABELS[preset]}
                </button>
              ))}
            </div>

            {/* Progress Bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className={cn("w-full rounded-full h-2 overflow-hidden", isLight ? "bg-slate-100" : "bg-muted")}>
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={cn("text-xs text-center", isLight ? "text-slate-500" : "text-muted-foreground")}>Refining your text...</p>
              </div>
            )}

            {/* Accept Button */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAccept}
                disabled={!selectedText || !selectedText.trim()}
                className={cn(
                  "flex-1 text-white text-sm font-medium cursor-pointer shadow-md shadow-violet-500/20",
                  skyPrimaryBtn,
                )}
              >
                Accept & Populate
              </Button>
              <Button
                onClick={() => setState("suggesting")}
                variant="outline"
                className={cn(
                  "px-4 text-sm font-medium cursor-pointer",
                  isLight
                    ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    : "bg-muted hover:bg-accent border-border text-foreground hover:text-foreground",
                )}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
