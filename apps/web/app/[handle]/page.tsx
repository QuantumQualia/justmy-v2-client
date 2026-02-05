import { Metadata } from "next";
import MyCardPageClient from "./page-client";
import type { ProfileData } from "@/lib/store";
import { profilesService } from "@/lib/services/profiles";
import { mapApiProfileToProfileData } from "@/lib/store/profile-mapper";

interface MyCardPageProps {
  params: Promise<{
    handle: string;
  }>;
}

// Helper function to fetch profile data (server-side)
async function fetchProfileByHandle(handle: string): Promise<ProfileData | null> {
  try {
    const response = await profilesService.getProfileBySlug(handle);
    if (!response?.profile) {
      return null;
    }
    return mapApiProfileToProfileData(response.profile);
  } catch (error) {
    console.error("Failed to fetch profile by handle:", error);
    return null;
  }
}

// Generate SEO metadata based on profile data
export async function generateMetadata({ params }: MyCardPageProps): Promise<Metadata> {
  const { handle } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://justmy.com";
  const profileUrl = `${siteUrl}/${handle}`;

  // Try to fetch profile data
  const profile = await fetchProfileByHandle(handle);

  // Use profile data if available, otherwise use defaults
  const title = profile?.name
    ? `${profile.name}${profile.tagline ? ` - ${profile.tagline}` : ""} | JustMy.com`
    : `${handle} | JustMy.com`;
  
  const description = profile?.about || profile?.tagline || `View ${handle}'s profile on JustMy.com - Connect and discover their digital identity.`;
  
  const image = profile?.banner || profile?.photo || `${siteUrl}/og-image.png`;

  // Get Twitter/X handle if available
  const twitterHandle = profile?.socialLinks?.find(
    (link) => link.type === "x" && link.url
  )?.url?.split("/").pop()?.replace("@", "");

  return {
    title,
    description,
    authors: profile?.name ? [{ name: profile.name }] : undefined,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      type: "profile",
      url: profileUrl,
      siteName: "JustMy.com",
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: profile?.name || handle,
        },
      ],
      ...(profile?.name && {
        firstName: profile.name.split(" ")[0],
        lastName: profile.name.split(" ").slice(1).join(" ") || "",
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      ...(twitterHandle && { creator: `@${twitterHandle}` }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    keywords: profile
      ? [
          profile.name,
          ...(profile.tagline ? [profile.tagline] : []),
          "JustMy",
          "profile",
          "digital identity",
          "business card",
          "contact",
        ]
      : [handle, "JustMy", "profile", "digital identity"],
    category: "Profile",
  };
}

export default async function MyCardPage({ params }: MyCardPageProps) {
  const resolvedParams = await params;
  const profileData = await fetchProfileByHandle(resolvedParams.handle);
  return <MyCardPageClient params={resolvedParams} initialData={profileData} />;
}
