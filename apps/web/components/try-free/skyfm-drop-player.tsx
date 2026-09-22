"use client";

import { useEffect, useState } from "react";
import { useProfileStore } from "@/lib/store/profile-store";
import { fetchDailyAudioBriefing } from "@/lib/news/fetch-daily-audio-briefing";

export function SkyFmDropPlayer() {
  const zip = useProfileStore((s) => s.data.zipCode);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const cleaned = (zip || "").replace(/\D/g, "").slice(0, 5);
    if (cleaned.length !== 5) return;
    let cancelled = false;
    void fetchDailyAudioBriefing({ zipCode: cleaned })
      .then((row) => {
        if (cancelled) return;
        setAudioUrl(row.audioUrl);
        setLabel(row.marketName ? `SkyFM for ${row.marketName}` : "SkyFM Daily Drop");
      })
      .catch(() => {
        if (!cancelled) setAudioUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [zip]);

  if (!audioUrl) return null;

  return (
    <div className="rounded-2xl border border-[#e6e4f0] bg-white px-4 py-3">
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <audio controls src={audioUrl} className="w-full" preload="none">
        Your browser does not support audio.
      </audio>
    </div>
  );
}
