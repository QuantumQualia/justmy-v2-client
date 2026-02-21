/**
 * Search Store
 * Global state management for the super search bar
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiRequest, ApiClientError } from "../api-client";

export interface SearchResultItem {
  id: string | number;
  title?: string;
  subtitle?: string;
  snippet?: string;
  type?: string;
  // Allow arbitrary extra fields so the UI can be flexible
  [key: string]: any;
}

// DTOs matching the SearchPerplexity API
interface PerplexitySearchResultDto {
  url: string;
  title?: string;
  snippet?: string;
  // Allow additional fields without over-constraining the response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface SearchPerplexityResponseDto {
  summary: string;
  results: PerplexitySearchResultDto[];
}

interface SearchStore {
  // State
  query: string;
  lastQuery: string | null;
  results: SearchResultItem[];
  summary: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setQuery: (query: string) => void;
  clear: () => void;
  runSearch: (query: string) => Promise<void>;
}

export const useSearchStore = create<SearchStore>()(
  devtools(
    (set) => ({
      // Initial state
      query: "",
      lastQuery: null,
      results: [],
      summary: null,
      isLoading: false,
      error: null,

      setQuery: (query) => set({ query }),

      clear: () =>
        set({
          query: "",
          lastQuery: null,
          results: [],
          summary: null,
          isLoading: false,
          error: null,
        }),

      /**
       * Run a search against the API.
       * NOTE: Endpoint and params are generic and can be adjusted to match the backend.
       */
      runSearch: async (query: string) => {
        const trimmed = query.trim();

        if (!trimmed) {
          // Empty query clears results but does not show an error
          set({
            query: "",
            lastQuery: null,
            results: [],
            isLoading: false,
            error: null,
          });
          return;
        }

        set({
          query: trimmed,
          lastQuery: trimmed,
          isLoading: true,
          error: null,
        });

        try {
          // Matches backend DTO: SearchPerplexityDto { query: string }
          const data = await apiRequest<SearchPerplexityResponseDto>(
            "ai/search-perplexity",
            {
              method: "POST",
              body: JSON.stringify({ query: trimmed }),
              // Super search may be public; flip this if it should require auth
              skipAuth: true,
            }
          );

          const mappedResults: SearchResultItem[] = Array.isArray(
            data?.results
          )
            ? data.results.map((item, index) => ({
                // Use URL as a stable id when available
                id: item.url || index,
                title: item.title ?? item.url,
                snippet: item.snippet,
                // Preserve all other fields for flexible UI usage
                ...item,
              }))
            : [];

          set({
            results: mappedResults,
            summary: data?.summary ?? null,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Search failed. Please try again.";

          set({
            results: [],
            isLoading: false,
            error: message,
          });
        }
      },
    }),
    {
      name: "SearchStore",
    }
  )
);

