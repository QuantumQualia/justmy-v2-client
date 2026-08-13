"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

import type { AskSkyBusinessCard } from "./types";

// Next/webpack breaks Leaflet's default marker icon paths.
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export type AskSkyBusinessMapProps = {
  businesses: AskSkyBusinessCard[];
  className?: string;
};

type Pin = {
  id: string;
  name: string;
  /** Location label (e.g. "Office") — shown above the address when present. */
  title?: string;
  /** Full street address for the popup. */
  address?: string;
  url?: string;
  lat: number;
  lng: number;
};

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Drop null-island / clearly invalid coordinates. */
function isPlausibleCoord(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) return false;
  if (lat < -85 || lat > 85 || lng < -180 || lng > 180) return false;
  return true;
}

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const key = address.trim().toLowerCase();
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;

  try {
    const res = await fetch(
      `/api/news/geocode?q=${encodeURIComponent(address.trim())}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      lat?: number | null;
      lng?: number | null;
    };
    const lat = toFiniteNumber(data.lat);
    const lng = toFiniteNumber(data.lng);
    const coords =
      lat != null && lng != null && isPlausibleCoord(lat, lng)
        ? { lat, lng }
        : null;
    // Cache hits only — avoid sticky misses after geocode improvements.
    if (coords) geocodeCache.set(key, coords);
    return coords;
  } catch {
    return null;
  }
}

/**
 * Same building / same geocode stacks markers on one pixel.
 * Fan them out slightly so every location pin is visible + clickable.
 */
function spreadOverlappingPins(pins: Pin[]): Pin[] {
  const groups = new Map<string, Pin[]>();
  for (const pin of pins) {
    const key = `${pin.lat.toFixed(5)}|${pin.lng.toFixed(5)}`;
    const list = groups.get(key) ?? [];
    list.push(pin);
    groups.set(key, list);
  }

  const out: Pin[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      const only = group[0];
      if (only) out.push(only);
      continue;
    }
    const radius = 0.00028; // ~30m
    group.forEach((pin, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
      out.push({
        ...pin,
        lat: pin.lat + radius * Math.cos(angle),
        lng: pin.lng + radius * Math.sin(angle),
      });
    });
  }
  return out;
}

async function resolveOnePin(
  biz: AskSkyBusinessCard,
  loc: AskSkyBusinessCard["locations"][number],
  index: number,
): Promise<Pin | null> {
  let lat = toFiniteNumber(loc.latitude);
  let lng = toFiniteNumber(loc.longitude);

  if (lat == null || lng == null || !isPlausibleCoord(lat, lng)) {
    const address = loc.address?.trim();
    if (!address) return null;
    const coords = await geocodeAddress(address);
    if (!coords) return null;
    lat = coords.lat;
    lng = coords.lng;
  }

  const title = loc.title?.trim() || undefined;
  const address =
    loc.address?.trim() ||
    (!title && biz.locations.length > 1
      ? `Location ${index + 1}`
      : undefined);

  return {
    id: `${biz.id}-loc-${index}`,
    name: biz.name,
    title,
    address,
    url: biz.url,
    lat,
    lng,
  };
}

/** Resolve every business location to a pin (coords first, else geocode address). */
async function resolvePins(businesses: AskSkyBusinessCard[]): Promise<Pin[]> {
  const tasks: Promise<Pin | null>[] = [];
  for (const biz of businesses) {
    biz.locations.forEach((loc, index) => {
      tasks.push(resolveOnePin(biz, loc, index));
    });
  }
  const resolved = (await Promise.all(tasks)).filter(
    (p): p is Pin => p != null,
  );
  return spreadOverlappingPins(resolved);
}

function fitMapToPins(map: L.Map, pins: Pin[]) {
  const first = pins[0];
  if (!first) return;

  if (pins.length === 1) {
    map.setView([first.lat, first.lng], 14);
    return;
  }

  const bounds = L.latLngBounds(
    pins.map((p) => [p.lat, p.lng] as [number, number]),
  );
  map.fitBounds(bounds, {
    padding: [48, 48],
    maxZoom: 15,
  });
}

/** Leaflet pin map for AskSKY myCARD business locations. */
export function AskSkyBusinessMap({
  businesses,
  className = "",
}: AskSkyBusinessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<Pin[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPins(null);
    void resolvePins(businesses).then((resolved) => {
      if (!cancelled) setPins(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [businesses]);

  useEffect(() => {
    if (!containerRef.current || !pins || pins.length === 0) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
      worldCopyJump: true,
      zoomControl: false,
    });

    L.control
      .zoom({
        position: "topright",
        zoomInTitle: "Zoom in",
        zoomOutTitle: "Zoom out",
      })
      .addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng]);
      const nameHtml = pin.url
        ? `<a href="${pin.url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(pin.name)}</strong></a>`
        : `<strong>${escapeHtml(pin.name)}</strong>`;
      const titleHtml = pin.title
        ? `<div style="margin-top:4px;font-size:12px;font-weight:600;color:#334155">${escapeHtml(pin.title)}</div>`
        : "";
      const addressHtml = pin.address
        ? `<div style="margin-top:2px;font-size:12px;color:#64748b;line-height:1.35">${escapeHtml(pin.address)}</div>`
        : "";
      marker.bindPopup(`${nameHtml}${titleHtml}${addressHtml}`);
      marker.addTo(map);
    }

    // Fit only after layout has a real size — early fitBounds zooms to the world.
    const applyView = () => {
      map.invalidateSize();
      fitMapToPins(map, pins);
    };
    const t0 = window.setTimeout(applyView, 0);
    const t1 = window.setTimeout(applyView, 120);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      map.remove();
    };
  }, [pins]);

  if (pins === null) {
    return (
      <div
        className={`flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500 ${className}`}
      >
        Loading map…
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div
        className={`flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500 ${className}`}
      >
        No mapped locations for these businesses yet.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`asksky-business-map min-h-72 w-full overflow-hidden rounded-2xl border border-slate-200 ${className}`}
      style={{ height: 380 }}
      role="region"
      aria-label="Business locations map"
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
