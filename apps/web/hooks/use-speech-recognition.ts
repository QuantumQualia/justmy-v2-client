"use client";

import { useEffect, useRef, useState } from "react";

// Lightweight TypeScript definitions for the Web Speech API
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

export interface UseSpeechRecognitionOptions {
  /**
   * Language code, e.g. "en-US"
   */
  lang?: string;
  /**
   * When true, new speech segments are appended to the existing transcript.
   * When false, each recording session replaces the transcript.
   */
  append?: boolean;
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isRecording: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Shared hook for microphone / speech-to-text behavior.
 * Uses the browser Web Speech API when available.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionResult {
  const { lang = "en-US", append = false } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Accumulates all finalized speech for the current (or appended) session
  const finalizedRef = useRef<string>("");

  // Initialize recognition instance on the client
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const anyWindow = window as any;
    const SpeechRecognitionClass =
      anyWindow.webkitSpeechRecognition || anyWindow.SpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const alternative = result[0];
        if (!alternative) continue;

        if (result.isFinal) {
          finalText += alternative.transcript + " ";
        } else {
          interimText += alternative.transcript;
        }
      }

      if (!finalText && !interimText) {
        return;
      }

      // Persist all finalized segments across events
      if (finalText) {
        finalizedRef.current = (finalizedRef.current + " " + finalText).trim();
      }

      // Expose "final so far" + most recent interim
      const combined = (finalizedRef.current + " " + interimText).trim();
      setTranscript(combined);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't surface "no-speech" as a hard error, it's a soft UX case
      if (event.error === "no-speech" || event.error === "aborted") {
        setIsRecording(false);
        return;
      }

      let message = "We hit a hiccup with the mic. Please try again.";
      if (event.error === "not-allowed") {
        message =
          "Microphone permission was blocked. Please allow access in your browser settings.";
      }

      setError(message);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
      finalizedRef.current = "";
    };
  }, [lang, append]);

  const start = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not available in this browser.");
      return;
    }

    try {
      setError(null);
      // When not appending, clear old transcript and finalized buffer
      if (!append) {
        setTranscript("");
        finalizedRef.current = "";
      }
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start the microphone. Please try again.");
    }
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsRecording(false);
  };

  const reset = () => {
    setTranscript("");
    setError(null);
  };

  return {
    isSupported,
    isRecording,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}

