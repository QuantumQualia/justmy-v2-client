export type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export interface WeatherHeroData {
  location: string;
  temperatureF: number;
  condition: string;
  feelsLikeF: number;
  highF: number;
  lowF: number;
  windMph: number;
  windDirection: WindDirection;
  aiStrategyLine: string;
}

export interface HourlyPoint {
  timeLabel: string;
  temperatureF: number;
  condition: string;
  precipChancePercent: number;
  isCommuteHour: boolean;
}

export interface LifestyleGauge {
  id: "health" | "outdoors" | "activity";
  label: string;
  valueLabel: string;
  summary: string;
  status: "go" | "caution" | "no-go";
}

export interface DayForecast {
  id: string;
  weekdayLabel: string;
  dateLabel: string;
  highF: number;
  lowF: number;
  condition: string;
  isWeekend: boolean;
}

export interface WeekendLookahead {
  title: string;
  summary: string;
}

