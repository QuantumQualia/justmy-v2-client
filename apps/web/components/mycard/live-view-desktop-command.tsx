"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MyCardContentDesktopView } from "@/components/mycard/mycard-content-desktop-view";
import type { ProfileData } from "@/lib/store";
import { contentQueryKeys } from "@/lib/query/content-query-keys";
import { contentService } from "@/lib/services/content";
import { PROFILE_KIND } from "@/lib/os-types";

interface MyCardDesktopDefaultViewProps {
  data: ProfileData;
  usePublicNavbar: boolean;
  outerTextClass: string;
  avatarOuterClass: string;
  avatarPlaceholderBgClass: string;
  avatarPlaceholderTextClass: string;
  ctaButtonClassName: string;
  registerHref: string;
  contactActions: React.ReactNode;
}

export function MyCardDesktopCommandView({
  data,
  usePublicNavbar,
  outerTextClass,
  avatarOuterClass,
  avatarPlaceholderBgClass,
  avatarPlaceholderTextClass,
  ctaButtonClassName,
  registerHref,
  contactActions,
}: MyCardDesktopDefaultViewProps) {
  const [activeTab, setActiveTab] = useState<string>("about");
  const variant = usePublicNavbar ? "light" : "dark";

  const hubQuery = useQuery({
    queryKey: contentQueryKeys.hubPublic(data.slug),
    queryFn: () => contentService.getPublicHubsBySlug(data.slug),
    enabled: data.slug.trim().length > 0,
  });

  const dynamicContentTabs = useMemo(() => {
    const hubs = hubQuery.data ?? [];
    const tabs = hubs[0]?.tabs ?? [];
    return [...tabs].sort(
      (a, b) =>
        (a.position ?? Number.MAX_SAFE_INTEGER) -
        (b.position ?? Number.MAX_SAFE_INTEGER)
    );
  }, [hubQuery.data]);

  const selectedDynamicTabId = activeTab.startsWith("tab:") ? Number(activeTab.slice(4)) : null;
  const selectedDynamicTab = dynamicContentTabs.find((tab) => tab.id === selectedDynamicTabId) ?? null;
  const desktopTabs = useMemo(
    () => [
      { key: "about", label: "About" },
      ...dynamicContentTabs.filter((tab) => tab.postCount > 0).map((tab) => ({
        key: `tab:${tab.id}`,
        label: tab.title,
      })),
    ],
    [dynamicContentTabs]
  );

  return (
    <div className={`${outerTextClass} w-full mt-6`}>
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside
            className="h-full overflow-y-auto p-5 justmy-corners !rounded-tr-none space-y-5 max-h-[500px]"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <div className="relative">
              <div className="relative flex justify-center">
                <div className={`h-24 w-24 overflow-hidden rounded-full ${avatarOuterClass}`}>
                  {data.photo ? (
                    <img src={data.photo} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center ${avatarPlaceholderBgClass}`}>
                      <span className={`text-2xl font-bold ${avatarPlaceholderTextClass}`}>
                        {data.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">{contactActions}</div>

            <div className="flex flex-col gap-2">
              {data.hotlinks.map((hotlink) => (
                <a
                  key={hotlink.id}
                  href={hotlink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={hotlink.url ? `${hotlink.title} — ${hotlink.url}` : hotlink.title}
                  className={ctaButtonClassName}
                >
                  <span className="min-w-0 truncate">{hotlink.title}</span>
                </a>
              ))}
              <button type="button" className={ctaButtonClassName}>
                Save to Contacts
              </button>
              <button type="button" className={ctaButtonClassName}>
                Send myCARD
              </button>

              <a
                href={registerHref}
                title="Get myCARD Free"
                className={ctaButtonClassName}
              >
                <span className="min-w-0 truncate">Get myCARD Free</span>
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-center text-lg font-bold text-foreground font-serif">About</h2>
              <p className="text-center text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {data.about}
              </p>
            </div>
          </aside>

          <section className="overflow-hidden justmy-corners relative min-h-[410px]">
            <img
              src={data.banner || "/images/banner.jpg"}
              alt="Banner"
              className="h-full min-h-[410px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-white font-serif md:text-4xl">
                {data.name}
              </h1>
              <p className="mt-2 text-sm text-white/85 md:text-base">{data.tagline}</p>
            </div>
          </section>
        </div>

        <div className="mt-8 border-b border-border">
          <div
            className="grid w-full text-sm"
            style={{
              gridTemplateColumns: `repeat(${Math.max(desktopTabs.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {desktopTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`w-full min-w-0 px-3 py-3 text-center transition-colors cursor-pointer ${activeTab === tab.key ? "text-foreground border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"}`}
                title={tab.label}
              >
                <span className="block truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          {activeTab === "about" && data.about ? (
            <div className="max-w-5xl space-y-4">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {data.about}
              </p>
            </div>
          ) : null}

          {selectedDynamicTab && data.type === PROFILE_KIND.COMMAND ? (
            <MyCardContentDesktopView
              profileType={data.type}
              profileSlug={data.slug}
              profileName={data.name}
              profilePhoto={data.photo}
              variant={variant}
              selectedTabId={selectedDynamicTab.id}
              selectedTabTitle={selectedDynamicTab.title}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

