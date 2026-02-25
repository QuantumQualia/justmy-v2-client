"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface RadarMapProps {
  lat: number;
  lon: number;
  /** Template with {date}, {hour}, {z}, {x}, {y} placeholders */
  precipTileUrlTemplate: string;
  locationName: string;
  className?: string;
}

/**
 * Build precipitation tile URL for Leaflet from WeatherAPI template.
 *
 * Matches WeatherAPI.com docs (weatherapi.com/docs → Weather Maps) and demo:
 * https://weathermaps.weatherapi.com/precip/tiles/map.html
 *
 * Path: .../precip/tiles/{0}{1}/{z}/{x}/{y}.png
 * - {0} = UTC date in yyyyMMdd (e.g. 1 Nov 2025 → 20251101)
 * - {1} = UTC hour in 24h with leading zero (e.g. 1 am → 01, 6 pm → 18)
 * - {z},{x},{y} = zoom and tile coords (left for Leaflet to fill)
 *
 * We also support {date}/{hour} if the backend sends those instead of {0}/{1}.
 */
export function buildPrecipTileUrl(template: string): string {
  // Use the last *complete* UTC hour so tiles are more likely to exist.
  const now = new Date();
  const lastHour = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours() - 1,
      0,
      0,
      0,
    ),
  );

  const yyyyMMdd =
    String(lastHour.getUTCFullYear()) +
    String(lastHour.getUTCMonth() + 1).padStart(2, "0") +
    String(lastHour.getUTCDate()).padStart(2, "0");
  const hour = String(lastHour.getUTCHours()).padStart(2, "0");

  // Replace both the official {0}/{1} tokens and our backend's {date}/{hour}.
  let url = template
    .replace(/\{0\}/g, yyyyMMdd)
    .replace(/\{1\}/g, hour)
    .replace(/\{date\}/gi, yyyyMMdd)
    .replace(/\{hour\}/gi, hour);

  return url;
}

export function RadarMap({
  lat,
  lon,
  precipTileUrlTemplate,
  locationName,
  className = "",
}: RadarMapProps) {
  const center: [number, number] = useMemo(() => [lat, lon], [lat, lon]);
  const containerRef = useRef<HTMLDivElement>(null);
  const precipTileUrl = useMemo(
    () => buildPrecipTileUrl(precipTileUrlTemplate),
    [precipTileUrlTemplate],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 4,
      minZoom: 0,
      maxZoom: 6, // WeatherAPI tiles are documented for 0–6
      worldCopyJump: false,
    });
    map.setMaxBounds([
      [-85.05112878, -180],
      [85.05112878, 180],
    ]);

    // Base map (dark theme)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap, &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Match WeatherAPI demo overlay behaviour:
    // - zoom 0–6
    // - noWrap so we don't repeat the world
    // - explicit zIndex so it sits above the basemap
    const precipLayer = L.tileLayer(precipTileUrl, {
      minZoom: 0,
      maxZoom: 6,
      maxNativeZoom: 6,
      attribution: "© WeatherAPI.com precipitation",
      opacity: 0.85,
      noWrap: true,
      tms: false,
      zIndex: 500,
    });
    precipLayer.addTo(map).bringToFront();

    L.circleMarker(center, {
      radius: 8,
      fillColor: "#38bdf8",
      color: "#0ea5e9",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindTooltip(locationName, { permanent: false, direction: "top" });

    return () => {
      map.remove();
    };
  }, [center, precipTileUrl, locationName]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: "100%", minHeight: 224 }}
    />
  );
}
