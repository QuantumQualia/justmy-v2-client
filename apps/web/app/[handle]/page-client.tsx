"use client";

import { useEffect, useState } from "react";
import MyCardLive from "@/components/mycard/mycard-live";
import type { ProfileData } from "@/lib/store";
import { profilesService } from "@/lib/services/profiles";
import { mapApiProfileToProfileData } from "@/lib/store/profile-mapper";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface MyCardPageClientProps {
  params: {
    handle: string;
  };
  initialData?: ProfileData | null;
}

export default function MyCardPageClient({ params, initialData }: MyCardPageClientProps) {
  const { handle } = params;
  const [profileData, setProfileData] = useState<ProfileData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Fetch profile data for the handle (client-side fallback if server-side fetch failed)
  useEffect(() => {
    if (initialData) {
      return; // Use server-side data if available
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await profilesService.getProfileBySlug(handle);
        if (response?.profile) {
          const mappedData = mapApiProfileToProfileData(response.profile);
          setProfileData(mappedData);
        } else {
          setError("Profile not found");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [handle, initialData]);

  const data = profileData;

  // Add JSON-LD structured data for SEO
  useEffect(() => {
    if (data) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: data.name,
        description: data.tagline || data.about,
        url: typeof window !== "undefined" ? window.location.href : "",
        image: data.photo || data.banner,
        sameAs: data.socialLinks.map((link) => link.url),
      };

      // Remove existing structured data script if any
      const existingScript = document.getElementById("profile-structured-data");
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data script
      const script = document.createElement("script");
      script.id = "profile-structured-data";
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        const scriptToRemove = document.getElementById("profile-structured-data");
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-slate-400">{error || "The profile you're looking for doesn't exist."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex justify-center">
      <div className={`w-full flex justify-center items-start ${isMobile ? '' : 'max-w-[375px] px-4 py-8'}`}>
        <MyCardLive data={data} />
      </div>
    </div>
  );
}
