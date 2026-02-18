/**
 * AI API Service
 * Handles all AI-related API calls for the About assistant feature
 */

import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

/**
 * Request to generate AI suggestions from raw input
 */
export interface GenerateAboutSuggestionsRequest {
  rawInput: string; // The user's raw story/input
  name?: string;
  tagline?: string;
  location?: string;
}

/**
 * Response containing three persona-based suggestions
 */
export interface AboutSuggestionsResponse {
  professional: string; // Credential-heavy and authoritative
  neighbor: string; // Warm, community-focused, and approachable
  visionary: string; // Bold, high-energy, and mission-driven
}

/**
 * Request to refine a selected suggestion
 */
export interface RefineAboutRequest {
  selectedText: string; // The currently selected/about text
  refinementType: "punchier" | "add-education" | "add-experience" | "add-passion" | "custom";
  customInstruction?: string; // For custom refinement type
}

/**
 * Response with refined text
 */
export interface RefinedAboutResponse {
  refinedText: string;
}

/**
 * Request to transcribe audio (if backend handles STT)
 * Note: We'll primarily use Web Speech API on frontend, but this is for fallback
 */
export interface TranscribeAudioRequest {
  audioData: string; // Base64 encoded audio or blob URL
  format?: "base64" | "blob";
}

/**
 * Response with transcription
 */
export interface TranscriptionResponse {
  transcript: string;
}

/**
 * Response for welcome message generation
 */
export interface GenerateWelcomeResponse {
  message: string; // Two-sentence hero greeting without the weather link line
}

/**
 * AI Service
 */
export const aiService = {
  /**
   * Generate three persona-based About suggestions from raw input
   */
  async generateAboutSuggestions(
    request: GenerateAboutSuggestionsRequest
  ): Promise<AboutSuggestionsResponse> {
    try {
      return await apiRequest<AboutSuggestionsResponse>("ai/generate-about", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to generate AI suggestions.");
    }
  },

  /**
   * Refine an existing About text based on user feedback
   */
  async refineAbout(request: RefineAboutRequest): Promise<RefinedAboutResponse> {
    try {
      return await apiRequest<RefinedAboutResponse>("ai/refine-about", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to refine About text.");
    }
  },

  /**
   * Transcribe audio to text (fallback if Web Speech API fails)
   * Note: Primary STT should be done via Web Speech API on frontend
   */
  async transcribeAudio(request: TranscribeAudioRequest): Promise<TranscriptionResponse> {
    try {
      return await apiRequest<TranscriptionResponse>("ai/transcribe", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to transcribe audio.");
    }
  },

  /**
   * Generate personalized welcome message
   */
  async generateWelcome(): Promise<GenerateWelcomeResponse> {
    try {
      return await apiRequest<GenerateWelcomeResponse>("ai/generate-welcome", {
        method: "GET",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to generate welcome message.");
    }
  },
};
