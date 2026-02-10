"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Mic, Sparkles, Loader2, Check, Wand2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { aiService, ApiClientError } from "@/lib/services/ai";
import type { ProfileData } from "@/lib/store";

// TypeScript definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface AIAboutAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (text: string) => void;
  profileData: ProfileData;
}

type ModalState = "prompting" | "suggesting" | "refining";

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

export function AIAboutAssistant({
  isOpen,
  onClose,
  onAccept,
  profileData,
}: AIAboutAssistantProps) {
  const [state, setState] = useState<ModalState>("prompting");
  const [rawInput, setRawInput] = useState("");
  const [interimTranscript, setInterimTranscript] = useState(""); // Real-time interim transcript
  const [suggestions, setSuggestions] = useState<AboutSuggestions | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<keyof AboutSuggestions | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognitionInstance = new SpeechRecognitionClass();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          let currentInterim = "";
          let currentFinal = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (!result) continue;
            
            const alternative = result[0];
            if (!alternative) continue;
            
            const transcript = alternative.transcript;
            if (result.isFinal) {
              currentFinal += transcript + " ";
            } else {
              currentInterim += transcript;
            }
          }

          // Update final transcript (accumulated)
          if (currentFinal) {
            setRawInput((prev) => {
              const newValue = prev + currentFinal;
              return newValue.trim();
            });
          }

          // Update interim transcript (real-time, word-by-word)
          setInterimTranscript(currentInterim);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);

          // Friendlier, contextual error messages
          switch (event.error) {
            case "not-allowed":
              setError("Microphone permission was blocked. Please allow access in your browser settings to use voice.");
              break;
            case "no-speech":
              // User stayed silent – treat this gently
              setError("We didn't catch anything that time. You can try speaking again or just type your story instead.");
              break;
            case "aborted":
              // User or browser cancelled; no scary error needed
              break;
            default:
              setError("We hit a hiccup with the mic. You can try again or simply type your story.");
              break;
          }
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
        recognitionRef.current = recognitionInstance;
      }
    }
  }, []);

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

      if (!recognitionRef.current) {
        setError("Speech recognition not available. Please use a modern browser.");
        return;
      }

      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch (err) {
        console.error("Failed to start recording:", err);
        setError("Failed to start recording. Please try again.");
      }

      return;
    }

    const timer = setTimeout(() => {
      setPrepCountdown((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPreparing, prepCountdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState("prompting");
      setRawInput("");
      setInterimTranscript("");
      setSuggestions(null);
      setSelectedSuggestion(null);
      setSelectedText("");
      setIsLoading(false);
      setError(null);
      setProgress(0);
      setIsRecording(false);
      setIsPreparing(false);
      setPrepCountdown(null);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [isOpen]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not available. Please use a modern browser.");
      return;
    }

    // Avoid re-triggering while already recording/preparing
    if (isRecording || isPreparing) {
      return;
    }

    // Start a short countdown before beginning actual recording
    setError(null);
    setPrepCountdown(3);
    setIsPreparing(true);
  };

  const stopRecording = () => {
    // Cancel any countdown
    setIsPreparing(false);
    setPrepCountdown(null);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    // Clear interim transcript when stopping
    setInterimTranscript("");
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
    setState("refining");
  };

  const handleRefine = async (refinementType: "punchier" | "add-education" | "add-experience" | "add-passion") => {
    if (!selectedText || !selectedText.trim()) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await aiService.refineAbout({
        selectedText,
        refinementType,
      });

      setSelectedText(result.refinedText);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI About Assistant</h3>
              <p className="text-xs text-slate-400">Let's write your story</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
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
                    className={`h-10 w-10 ${
                      isRecording || isPreparing ? "text-red-400" : "text-blue-400"
                    }`}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-300 mb-2">
                  Don't worry about being perfect. Just brain dump who you are, what you do, and why you love it.
                </p>
                {isPreparing && prepCountdown !== null ? (
                  <p className="text-xs text-red-300 font-semibold">
                    Starting in {prepCountdown}...
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 animate-pulse">
                    {PROMPT_SUGGESTIONS[currentPromptIndex]}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={rawInput + (interimTranscript ? " " + interimTranscript : "")}
                onChange={(e) => {
                  // When user manually types, clear interim and update rawInput
                  setInterimTranscript("");
                  setRawInput(e.target.value);
                }}
                placeholder="Start typing or use voice input..."
                className="w-full min-h-[150px] p-4 text-sm text-slate-100 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none placeholder:text-slate-500"
                autoFocus
              />
              <div className="flex gap-2">
                {recognitionRef.current ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isPreparing}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isRecording || isPreparing
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                    {isRecording
                      ? "Stop Recording"
                      : isPreparing
                        ? "Preparing..."
                        : "Start Recording"}
                  </button>
                ) : null}
                <button
                  onClick={handleMagicStart}
                  disabled={!rawInput.trim() || isLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
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
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-400">Synthesizing your greatness...</p>
              </div>
            )}
          </div>
        )}

        {/* State 2: Suggestion Stage */}
        {state === "suggesting" && suggestions && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300 text-center mb-4">
              Choose the style that best represents you:
            </p>

            <div className="space-y-3">
              {/* Professional */}
              <button
                onClick={() => handleSelectSuggestion("professional")}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">The Professional</h4>
                  <Check className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-xs text-slate-400 mb-2">Credential-heavy and authoritative</p>
                <p className="text-xs text-slate-300 line-clamp-3">{suggestions.professional}</p>
              </button>

              {/* Neighbor */}
              <button
                onClick={() => handleSelectSuggestion("neighbor")}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">The Neighbor</h4>
                  <Check className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-xs text-slate-400 mb-2">Warm, community-focused, and approachable</p>
                <p className="text-xs text-slate-300 line-clamp-3">{suggestions.neighbor}</p>
              </button>

              {/* Visionary */}
              <button
                onClick={() => handleSelectSuggestion("visionary")}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">The Visionary</h4>
                  <Check className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-xs text-slate-400 mb-2">Bold, high-energy, and mission-driven</p>
                <p className="text-xs text-slate-300 line-clamp-3">{suggestions.visionary}</p>
              </button>
            </div>
          </div>
        )}

        {/* State 3: Refinement Stage */}
        {state === "refining" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Your About Text
              </label>
              <textarea
                value={selectedText || ""}
                onChange={(e) => setSelectedText(e.target.value)}
                className="w-full min-h-[200px] p-4 text-sm text-slate-100 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Refinement Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRefine("punchier")}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Make it punchier
              </button>
              <button
                onClick={() => handleRefine("add-education")}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Add education
              </button>
              <button
                onClick={() => handleRefine("add-experience")}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Add experience
              </button>
              <button
                onClick={() => handleRefine("add-passion")}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Add passion
              </button>
            </div>

            {/* Progress Bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-400">Refining your text...</p>
              </div>
            )}

            {/* Accept Button */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAccept}
                disabled={!selectedText || !selectedText.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Accept & Populate
              </Button>
              <Button
                onClick={() => setState("suggesting")}
                variant="outline"
                className="px-4 bg-slate-700/50 hover:bg-slate-700/70 border-slate-600/50 text-slate-300 hover:text-slate-100 text-sm font-medium cursor-pointer"
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
