/**
 * Weather Dashboard API client.
 * Endpoints: weather/hero, weather/hourly, weather/indices, weather/sevenday, weather/radar.
 * All require JWT; zip is derived from authenticated user profile on the backend.
 */

import { apiRequest } from "@/lib/api-client";
import type { WeatherHeroData, WindDirection } from "@/components/weather/types";
import type { HourlyPoint } from "@/components/weather/types";
import type { LifestyleGauge } from "@/components/weather/types";
import type { DayForecast, WeekendLookahead } from "@/components/weather/types";

/** API response types (mirror backend DTOs) */
export interface WeatherHeroResponseDto {
  zipCode: string;
  hero: {
    tempF: number;
    feelsLikeF: number;
    conditionText: string;
    conditionIconUrl: string;
    strategyLine: string;
    highF: number;
    lowF: number;
    windMph: number;
    windDir: string;
  };
}

export interface WeatherHourSlotDto {
  time: string;
  hour: number;
  tempF: number;
  chanceOfRain: number;
  conditionText: string;
  conditionIconUrl: string;
  isCommuteSlot: boolean;
  isRainBlock: boolean;
}

export interface WeatherHourlyResponseDto {
  zipCode: string;
  slots: WeatherHourSlotDto[];
  astro: { sunrise: string; sunset: string };
}

export interface WeatherHealthGaugeDto {
  index: number;
  colorHint: "green" | "yellow" | "red";
  label: string;
  message: string;
}

export interface WeatherOutdoorsGaugeDto {
  uvIndex: number;
  message: string;
}

export interface WeatherActivityGaugeDto {
  message: string;
  score?: number;
}

export interface WeatherIndicesResponseDto {
  zipCode: string;
  health: WeatherHealthGaugeDto;
  outdoors: WeatherOutdoorsGaugeDto;
  activity: WeatherActivityGaugeDto;
}

export interface WeatherDayDto {
  date: string;
  dayName: string;
  highF: number;
  lowF: number;
  conditionText: string;
  conditionIconUrl: string;
  isWeekend: boolean;
}

export interface WeatherSevenDayResponseDto {
  zipCode: string;
  days: WeatherDayDto[];
  weekendLookahead: string;
}

export interface WeatherRadarResponseDto {
  zipCode: string;
  precipTileUrlTemplate: string;
  lat: number;
  lon: number;
  locationName: string;
}

const WIND_DIRECTIONS: WindDirection[] = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

function normalizeWindDir(dir: string): WindDirection {
  const upper = (dir || "").toUpperCase().replace(/\s/g, "");
  if (WIND_DIRECTIONS.includes(upper as WindDirection)) {
    return upper as WindDirection;
  }
  if (upper === "NNE" || upper === "NNW") return "N";
  if (upper === "ENE" || upper === "WNW") return "NE";
  if (upper === "ESE" || upper === "WSW") return "SE";
  if (upper === "SSE" || upper === "SSW") return "S";
  return "SW";
}

/** Format API time "HH:mm" or ISO to short label like "8 AM" */
function formatTimeLabel(time: string): string {
  if (!time) return "";
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match || !match[1]) return time;
  const h = parseInt(match[1], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12} ${ampm}`;
}

function mapHeroDtoToHeroData(dto: WeatherHeroResponseDto): WeatherHeroData {
  const { zipCode, hero } = dto;
  return {
    location: zipCode,
    temperatureF: hero.tempF,
    condition: hero.conditionText,
    feelsLikeF: hero.feelsLikeF,
    highF: hero.highF,
    lowF: hero.lowF,
    windMph: hero.windMph,
    windDirection: normalizeWindDir(hero.windDir),
    aiStrategyLine: hero.strategyLine,
  };
}

function mapHourlyDtoToPoints(dto: WeatherHourlyResponseDto): HourlyPoint[] {
  return (dto.slots || []).map((slot) => ({
    timeLabel: formatTimeLabel(slot.time),
    temperatureF: slot.tempF,
    condition: slot.conditionText,
    precipChancePercent: slot.chanceOfRain,
    isCommuteHour: slot.isCommuteSlot,
  }));
}

function colorHintToStatus(
  hint: "green" | "yellow" | "red"
): "go" | "caution" | "no-go" {
  if (hint === "green") return "go";
  if (hint === "yellow") return "caution";
  return "no-go";
}

function mapIndicesDtoToGauges(
  dto: WeatherIndicesResponseDto
): LifestyleGauge[] {
  return [
    {
      id: "health",
      label: "Health",
      valueLabel: dto.health?.message ?? "Air Quality",
      summary: dto.health?.label ?? "",
      status: colorHintToStatus(dto.health?.colorHint ?? "green"),
    },
    {
      id: "outdoors",
      label: "Outdoors",
      valueLabel: dto.outdoors?.message ?? "UV",
      summary: `UV Index ${dto.outdoors?.uvIndex ?? 0}`,
      status:
        (dto.outdoors?.uvIndex ?? 0) <= 3
          ? "go"
          : (dto.outdoors?.uvIndex ?? 0) <= 7
            ? "caution"
            : "no-go",
    },
    {
      id: "activity",
      label: "Activity",
      valueLabel: dto.activity?.message ?? "Golf / Sports",
      summary: dto.activity?.score != null ? `Score ${dto.activity.score}/10` : "",
      status: (dto.activity?.score ?? 0) >= 7 ? "go" : (dto.activity?.score ?? 0) >= 4 ? "caution" : "no-go",
    },
  ];
}

function formatDateLabel(isoDate: string): string {
  try {
    return new Date(isoDate + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function mapSevenDayDtoToDaysAndLookahead(
  dto: WeatherSevenDayResponseDto
): { days: DayForecast[]; weekendLookahead: WeekendLookahead } {
  const days: DayForecast[] = (dto.days || []).map((day, i) => ({
    id: `${day.date}-${i}`,
    weekdayLabel: day.dayName,
    dateLabel: formatDateLabel(day.date),
    highF: day.highF,
    lowF: day.lowF,
    condition: day.conditionText,
    isWeekend: day.isWeekend,
  }));
  return {
    days,
    weekendLookahead: {
      title: "The Weekend Lookahead",
      summary: dto.weekendLookahead ?? "",
    },
  };
}

/**
 * GET /weather/hero — Hero "Vibe Check" for current user's profile zip.
 */
export async function fetchWeatherHero(): Promise<WeatherHeroData> {
  const dto = await apiRequest<WeatherHeroResponseDto>("weather/hero");
  return mapHeroDtoToHeroData(dto);
}

/**
 * GET /weather/hourly — Next 12 hours with commute/rain flags.
 */
export async function fetchWeatherHourly(): Promise<{
  points: HourlyPoint[];
  sunrise?: string;
  sunset?: string;
}> {
  const dto = await apiRequest<WeatherHourlyResponseDto>("weather/hourly");
  return {
    points: mapHourlyDtoToPoints(dto),
    sunrise: dto.astro?.sunrise,
    sunset: dto.astro?.sunset,
  };
}

/**
 * GET /weather/indices — Health, Outdoors, Activity gauges.
 */
export async function fetchWeatherIndices(): Promise<LifestyleGauge[]> {
  const dto = await apiRequest<WeatherIndicesResponseDto>("weather/indices");
  return mapIndicesDtoToGauges(dto);
}

/**
 * GET /weather/sevenday — 7-day forecast + weekend lookahead.
 */
export async function fetchWeatherSevenDay(): Promise<{
  days: DayForecast[];
  weekendLookahead: WeekendLookahead;
}> {
  const dto = await apiRequest<WeatherSevenDayResponseDto>("weather/sevenday");
  return mapSevenDayDtoToDaysAndLookahead(dto);
}

/**
 * GET /weather/radar — Precipitation map tile template and center.
 */
export async function fetchWeatherRadar(): Promise<WeatherRadarResponseDto> {
  return apiRequest<WeatherRadarResponseDto>("weather/radar");
}
