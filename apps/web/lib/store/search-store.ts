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

interface AlgoliaSearchResultDto {
  hits: any[];
  nbHits: number;
}
interface SearchResponseDto {
  aiResults: {
    summary: string;
    results: PerplexitySearchResultDto[];
  };
  profiles?: AlgoliaSearchResultDto[];
  pages?: AlgoliaSearchResultDto[];
  posts?: AlgoliaSearchResultDto[];
  vectorResults?: any[];
}

/** Business search API response (GET /search/businesses) */
interface BusinessCardDto {
  name: string;
  brief?: string; // Tagline or short description
  url?: string; // JustMy profile link (e.g. /slug)
  website?: string; // External website URL
  photo?: string; // Logo or profile photo URL
  rating?: number; // Google star rating
  isVerified?: boolean;
  location?: string; // Market name or address
  phone?: string; // Primary phone number
  osName?: string; // OS name when this business is a JustMy Partner (e.g. "Founder")
  /** Per-item source: 'local' = internal directory, 'external' = Gemini/external recommendations */
  source: "local" | "external";
}
interface BusinessSearchResponseDto {
  businesses: BusinessCardDto[];
  source: "local" | "gemini";
  totalLocal: number;
}

/** Map BusinessCategory ID to label for the businesses API */
const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  "eats-drinks": "Eats & Drinks",
  "home-services": "Home Services",
  "health-wellness": "Health & Wellness",
  "shopping-retail": "Shopping & Retail",
  professional: "Professional",
  "auto-travel": "Auto & Travel",
  "things-to-do": "Things to Do",
  community: "Community",
};

export type BusinessCategory = 
  | "eats-drinks"
  | "home-services"
  | "health-wellness"
  | "shopping-retail"
  | "professional"
  | "auto-travel"
  | "things-to-do"
  | "community";

export interface CategoryConfig {
  id: BusinessCategory;
  label: string;
  icon: string;
  hasFoundingPartner?: boolean;
}

interface SearchStore {
  // State
  query: string;
  lastQuery: string | null;
  results: SearchResultItem[];
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Business search state
  isBusinessSearchMode: boolean;
  selectedCategories: BusinessCategory[]; // Max 3
  /** When set, results are from business search: first N are JustMy Partners, rest are Local Results */
  businessSearchTotalLocal: number | null;

  // Actions
  setQuery: (query: string) => void;
  setBusinessSearchMode: (enabled: boolean) => void;
  toggleCategory: (category: BusinessCategory) => void;
  removeCategory: (category: BusinessCategory) => void;
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
      isBusinessSearchMode: false,
      selectedCategories: [],
      businessSearchTotalLocal: null,

      setQuery: (query) => set({ query }),
      
      setBusinessSearchMode: (enabled) => set({ isBusinessSearchMode: enabled }),
      
      toggleCategory: (category) =>
        set((state) => {
          const isSelected = state.selectedCategories.includes(category);
          if (isSelected) {
            // Remove category
            return {
              selectedCategories: state.selectedCategories.filter((c) => c !== category),
            };
          } else {
            // Add category (max 3)
            if (state.selectedCategories.length >= 3) {
              return state; // Don't add if already at max
            }
            return {
              selectedCategories: [...state.selectedCategories, category],
            };
          }
        }),
      
      removeCategory: (category) =>
        set((state) => ({
          selectedCategories: state.selectedCategories.filter((c) => c !== category),
        })),

      clear: () =>
        set({
          query: "",
          lastQuery: null,
          results: [],
          summary: null,
          isLoading: false,
          error: null,
          selectedCategories: [],
          businessSearchTotalLocal: null,
        }),

      /**
       * Run a search against the API.
       * Standard mode: GET search/hybrid (hybrid search).
       * Business mode: GET businesses (business search with optional categories).
       */
      runSearch: async (query: string) => {
        const trimmed = query.trim();

        if (!trimmed) {
          set({
            query: "",
            lastQuery: null,
            results: [],
            summary: null,
            isLoading: false,
            error: null,
            businessSearchTotalLocal: null,
          });
          return;
        }

        set({
          query: trimmed,
          lastQuery: trimmed,
          isLoading: true,
          error: null,
        });

        const state = useSearchStore.getState();
        const isBusinessMode = state.isBusinessSearchMode;
        const selectedCategories = state.selectedCategories;

        try {
          if (isBusinessMode) {
            // Business search: GET /businesses (SearchRequestDto: query, categories?)
            const params: Record<string, string> = { query: trimmed };
            if (selectedCategories.length > 0) {
              const categoryLabels = selectedCategories.map(
                (id) => BUSINESS_CATEGORY_LABELS[id]
              );
              params.categories = categoryLabels.join(",");
            }
            const data = await apiRequest<BusinessSearchResponseDto>("search/businesses", {
              method: "GET",
              params,
            });

            const mappedResults: SearchResultItem[] = Array.isArray(data?.businesses)
              ? data.businesses.map((b, index) => ({
                  id: b.url || b.website || b.name || index,
                  title: b.name,
                  subtitle: b.location,
                  snippet: b.brief,
                  // Prefer internal profile link; fall back to external website
                  url: b.url ?? b.website,
                  type: "business",
                  ...b,
                }))
              : [];

            set({
              results: mappedResults,
              summary: null,
              isLoading: false,
              error: null,
              businessSearchTotalLocal: data?.totalLocal ?? 0,
            });
          } else {
            // Standard search: GET search/hybrid
            const data = await apiRequest<SearchResponseDto>("search/hybrid", {
              method: "GET",
              params: { query: trimmed },
            });

            const mappedResults: SearchResultItem[] = Array.isArray(
              data?.aiResults?.results
            )
              ? data.aiResults.results.map((item, index) => ({
                  id: item.url || index,
                  title: item.title ?? item.url,
                  snippet: item.snippet,
                  ...item,
                }))
              : [];

            set({
              results: mappedResults,
              summary: data?.aiResults?.summary ?? null,
              isLoading: false,
              error: null,
              businessSearchTotalLocal: null,
            });
          }
        } catch (err: unknown) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Search failed. Please try again.";
          set({
            results: [],
            isLoading: false,
            error: message,
            businessSearchTotalLocal: null,
          });
        }
      },
    }),
    {
      name: "SearchStore",
    }
  )
);

