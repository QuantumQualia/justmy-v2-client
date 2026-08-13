import { ApiClientError } from "@/lib/api-client";

export type TodayWeather = {
  zipCode: string;
  condition: string;
  tempF: number;
  forecastHigh: number;
  localtime?: string | null;
};

/** In-flight + short-lived cache so remounts (e.g. Strict Mode) share one request. */
const inFlight = new Map<string, Promise<TodayWeather>>();
const cache = new Map<string, TodayWeather>();

/**
 * Client-side today's weather by ZIP via Next BFF (no JWT required).
 */
export async function fetchTodayWeather(zipCode: string): Promise<TodayWeather> {
  const cleaned = zipCode.trim().slice(0, 5);
  const cached = cache.get(cleaned);
  if (cached) return cached;

  const existing = inFlight.get(cleaned);
  if (existing) return existing;

  const request = (async () => {
    const search = new URLSearchParams({ zipCode: cleaned });
    const res = await fetch(`/api/news/today-weather?${search.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as
      | TodayWeather
      | { message?: string };

    if (!res.ok) {
      const message =
        data && typeof data === "object" && "message" in data && data.message
          ? String(data.message)
          : "Failed to load today's weather.";
      throw new ApiClientError(message, res.status);
    }

    if (
      !data ||
      typeof data !== "object" ||
      !("tempF" in data) ||
      !("condition" in data) ||
      typeof data.tempF !== "number" ||
      typeof data.condition !== "string"
    ) {
      throw new ApiClientError("Unexpected weather response.");
    }

    const weather = data as TodayWeather;
    cache.set(cleaned, weather);
    return weather;
  })().finally(() => {
    inFlight.delete(cleaned);
  });

  inFlight.set(cleaned, request);
  return request;
}
