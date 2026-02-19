"use client";

import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Play, Plus, Minus } from "lucide-react";

type AppRecord = {
  id: string;
  name: string;
  icon: string;
  description: string;
  video_preview_url: string;
  is_installed: boolean;
  url: string;
};

const MOCK_APPS: AppRecord[] = [
  {
    id: "app_001",
    name: "myCITY",
    icon: "icon_city_os.svg",
    description:
      "Your connection to the local pulse. Get the Daily Drop, local news, and community alerts specific to your zip code.",
    video_preview_url: "https://player.vimeo.com/video/347119375",
    is_installed: false,
    url: "/apps/my-city",
  },
  {
    id: "app_002",
    name: "myACCOUNT",
    icon: "icon_user_settings.svg",
    description:
      "The command center for your data. Manage your J-Credits, profile settings, and privacy preferences.",
    video_preview_url: "https://player.vimeo.com/video/347119375",
    is_installed: true,
    url: "/apps/my-account",
  },
  {
    id: "app_003",
    name: "myLIFE",
    icon: "icon_life_pulse.svg",
    description:
      "Your AI-powered life coach. Plan your weekend, set goals, and track your 'Winning' streak.",
    video_preview_url: "https://player.vimeo.com/video/347119375",
    is_installed: false,
    url: "/apps/my-life",
  },
];

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  app?: AppRecord | null;
}

const overlayBase =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4";
const panelBase =
  "bg-slate-950 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800";

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  app,
}) => {
  if (!isOpen || !app) return null;

  return (
    <div className={overlayBase} onClick={onClose}>
      <div
        className={panelBase}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
              <span className="text-xs text-slate-400">{app.name[0]}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {app.name} Preview
              </div>
              <div className="text-xs text-slate-400">
                Personal OS &middot; App Demo
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        <div className="relative bg-black aspect-video w-full">
          <iframe
            src={app.video_preview_url}
            title={`${app.name} preview`}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800">
          <div className="text-sm text-slate-200 mb-2">{app.description}</div>
          <div className="text-xs text-slate-500">
            You&apos;re viewing a promo inside the OS. Installing will not
            reload this page.
          </div>
        </div>
      </div>
    </div>
  );
};

interface AppHubProps {
  initialApps?: AppRecord[];
}

export const AppHub: React.FC<AppHubProps> = ({ initialApps }) => {
  const [apps, setApps] = useState<AppRecord[]>(initialApps ?? MOCK_APPS);
  const [expandedId, setExpandedId] = useState<string | undefined>();
  const [previewApp, setPreviewApp] = useState<AppRecord | null>(null);
  const [justInstalledId, setJustInstalledId] = useState<string | null>(null);

  const activeApps = useMemo(
    () => apps.filter((a) => a.is_installed),
    [apps]
  );
  const availableApps = useMemo(
    () => apps.filter((a) => !a.is_installed),
    [apps]
  );

  const handleToggle = (id: string) => {
    setExpandedId((current) => (current === id ? undefined : id));
  };

  const handlePreview = (app: AppRecord) => {
    setPreviewApp(app);
  };

  const handleInstall = (id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, is_installed: true } : app
      )
    );
    setJustInstalledId(id);
    setTimeout(() => {
      setJustInstalledId((current) => (current === id ? null : current));
    }, 900);

    // NOTE: API integration goes here later:
    // await apiClient.post("/api/user/apps/install", { appId: id });
  };

  const handleUninstall = (id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, is_installed: false } : app
      )
    );
    if (expandedId === id) setExpandedId(undefined);

    // NOTE: API integration goes here later:
    // await apiClient.post("/api/user/apps/uninstall", { appId: id });
  };

  const handleOpen = (url: string) => {
    console.log("Open app url:", url);
  };

  const renderAppBar = (app: AppRecord, area: "active" | "available") => {
    const isExpanded = expandedId === app.id;
    const isNewlyInstalled = justInstalledId === app.id;

    return (
      <AccordionItem
        key={app.id}
        value={app.id}
        className={[
          "border border-slate-800 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 mb-2 last:border-b",
          "bg-gradient-to-r from-slate-900/60 to-slate-900/30",
          "hover:border-emerald-500/60 transition-all duration-200 cursor-pointer",
          isNewlyInstalled ? "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-black" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <AccordionTrigger
          className="flex items-center gap-3 sm:gap-4 text-left w-full !py-1 hover:no-underline cursor-pointer"
          onClick={() => handleToggle(app.id)}
        >
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
              <span className="text-sm font-semibold text-slate-200">
                {app.name[0]}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-semibold text-white tracking-tight">
                {app.name}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-[0.16em]">
                {area === "active" ? "Installed" : "Available"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:underline">
            <span className="hidden sm:inline">View details</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 sm:pt-3 pb-2">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              {app.description}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="cursor-pointer border-slate-600 bg-slate-800/50 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-700/80 hover:text-white inline-flex items-center gap-2 rounded-full px-4 transition-colors"
                  onClick={() => handlePreview(app)}
                >
                  <Play className="h-3 w-3" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                    App Preview
                  </span>
                </Button>
              </div>
              <div className="flex items-center gap-2">

                {!app.is_installed && (
                  <Button
                    variant="default"
                    size="sm"
                    type="button"
                    className="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-black inline-flex items-center gap-2 rounded-full px-4"
                    onClick={() => handleInstall(app.id)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Install App
                    </span>
                  </Button>
                )}

                {app.is_installed && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      type="button"
                      className="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-black inline-flex items-center gap-2 rounded-full px-4"
                      onClick={() => handleOpen(app.url)}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                        Open App
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="cursor-pointer border-slate-600 bg-slate-800/50 text-slate-300 hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-300 inline-flex items-center gap-2 rounded-full px-4 transition-colors"
                      onClick={() => handleUninstall(app.id)}
                    >
                      <Minus className="h-3 w-3" />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                        Uninstall App
                      </span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6 sm:px-6 sm:py-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
        <header className="space-y-2 sm:space-y-3">
          <div className="text-xs sm:text-sm font-semibold tracking-[0.22em] text-emerald-400 uppercase">
            Personal OS
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
            APPs
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl">
            Curate your personal operating system. Pin the tools you rely on
            every day and explore new ones below.
          </p>
        </header>

        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight">
              My Active Apps
            </h2>
            <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-[0.18em]">
              DOCK
            </span>
          </div>
          <div
            className={[
              "rounded-2xl border border-slate-900 bg-gradient-to-b from-slate-950 to-slate-950/60",
              "px-3 sm:px-4 py-3 sm:py-4 shadow-[0_0_40px_rgba(0,0,0,0.75)]",
            ].join(" ")}
          >
            {activeApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-10 px-4 text-center">
                <div className="text-slate-500 text-sm font-medium mb-1">
                  No active apps
                </div>
                <p className="text-slate-600 text-xs max-w-xs mx-auto">
                  Install apps from the discovery library below to add them here.
                </p>
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                value={expandedId}
                onValueChange={setExpandedId}
              >
                {activeApps.map((app) => renderAppBar(app, "active"))}
              </Accordion>
            )}
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4 pb-10">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight">
              Available Apps
            </h2>
            <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-[0.18em]">
              DISCOVERY LIBRARY
            </span>
          </div>
          <div
            className={[
              "rounded-2xl border border-slate-900 bg-gradient-to-b from-slate-950/80 to-slate-950",
              "px-3 sm:px-4 py-3 sm:py-4 shadow-[0_0_50px_rgba(0,0,0,0.9)]",
            ].join(" ")}
          >
            {availableApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-10 px-4 text-center">
                <div className="text-slate-500 text-sm font-medium mb-1">
                  No available apps
                </div>
                <p className="text-slate-600 text-xs max-w-xs mx-auto">
                  You’ve installed everything from the library. New apps will show up here when they’re added.
                </p>
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                value={expandedId}
                onValueChange={setExpandedId}
              >
                {availableApps.map((app) => renderAppBar(app, "available"))}
              </Accordion>
            )}
          </div>
        </section>
      </div>

      <VideoPreviewModal
        isOpen={!!previewApp}
        onClose={() => setPreviewApp(null)}
        app={previewApp}
      />
    </div>
  );
};

