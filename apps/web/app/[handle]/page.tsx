import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import MyCardPageClient from "./page-client";
import { PayloadPageRenderer } from "@/components/cms/payload-page-renderer";
import type { ProfileData } from "@/lib/store";
import { profilesService } from "@/lib/services/profiles";
import { cmsService, ApiClientError } from "@/lib/services/cms";
import { mapApiProfileToProfileData } from "@/lib/store/profile-mapper";

interface MyCardPageProps {
  params: Promise<{
    handle: string;
  }>;
}

// Cached helper function to fetch profile data (server-side)
// Using cache() to deduplicate requests within the same render
const fetchProfileByHandle = cache(async (handle: string): Promise<ProfileData | null> => {
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
});

// Cached helper function to fetch page data (server-side)
// Using cache() to deduplicate requests within the same render
const fetchPageByHandle = cache(async (handle: string) => {
  try {
    return await cmsService.getPageByHandle(handle);
  } catch (error) {
    // If 401, rethrow it
    if (error instanceof ApiClientError && error.statusCode === 401) {
      throw error;
    }
    // For other errors, return null
    return null;
  }
});

// Generate SEO metadata based on profile or page data
// Check profile first, then page if profile doesn't exist
export async function generateMetadata({ params }: MyCardPageProps): Promise<Metadata> {
  const { handle } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://justmy.com";
  const pageUrl = `${siteUrl}/${handle}`;

  // First, check profile
  const profile = await fetchProfileByHandle(handle);

  if (profile) {
    // Profile exists, use profile metadata
    const profileUrl = `${siteUrl}/${handle}`;
    const title = profile.name
      ? `${profile.name}${profile.tagline ? ` - ${profile.tagline}` : ""} | JustMy.com`
      : `${handle} | JustMy.com`;
    
    const description = profile.about || profile.tagline || `View ${handle}'s profile on JustMy.com - Connect and discover their digital identity.`;
    
    const image = profile.banner || profile.photo || `${siteUrl}/og-image.png`;

    const twitterHandle = profile.socialLinks?.find(
      (link) => link.type === "x" && link.url
    )?.url?.split("/").pop()?.replace("@", "");

    return {
      title,
      description,
      authors: profile.name ? [{ name: profile.name }] : undefined,
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
            alt: profile.name || handle,
          },
        ],
        ...(profile.name && {
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
      keywords: [
        profile.name,
        ...(profile.tagline ? [profile.tagline] : []),
        "JustMy",
        "profile",
        "digital identity",
        "business card",
        "contact",
      ],
      category: "Profile",
    };
  }

  // Profile doesn't exist, check page
  let payloadPage = null;
  try {
    payloadPage = await fetchPageByHandle(handle);
  } catch (error) {
    // If 401 or other error, return generic metadata
    // Don't expose auth requirements in metadata
  }

  if (payloadPage && payloadPage.isPublished) {
    const title = payloadPage.seo?.title || payloadPage.title;
    const description = payloadPage.seo?.description || payloadPage.description || "";
    const image = payloadPage.seo?.ogImage 
      ? (typeof payloadPage.seo.ogImage === "string" 
          ? payloadPage.seo.ogImage 
          : payloadPage.seo.ogImage.url)
      : `${siteUrl}/og-image.png`;

    return {
      title: `${title} | JustMy.com`,
      description,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        type: "website",
        url: pageUrl,
        siteName: "JustMy.com",
        title,
        description,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      robots: {
        index: true,
        follow: true,
      },
      keywords: payloadPage.seo?.keywords?.split(",").map(k => k.trim()),
    };
  }

  // Neither profile nor page exists, return generic metadata
  return {
    title: `${handle} | JustMy.com`,
    description: `View ${handle} on JustMy.com`,
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function MyCardPage({ params }: MyCardPageProps) {
  const resolvedParams = await params;
  const { handle } = resolvedParams;

  // First, check profile (using cached function to avoid duplicate calls)
  const profileData = await fetchProfileByHandle(handle);
  
  if (profileData) {
    // Profile exists, render profile page
    return <MyCardPageClient params={resolvedParams} initialData={profileData} />;
  }

  // Profile doesn't exist, check page (using cached function to avoid duplicate calls)
  try {
    const payloadPage = await fetchPageByHandle(handle);
    
    // If page is null (200 response with null body), page doesn't exist
    if (payloadPage === null) {
      notFound();
    }
    
    if (payloadPage && payloadPage.isPublished) {
      // Render Payload CMS page
      return <PayloadPageRenderer page={payloadPage} />;
    }
    
    // Page exists but not published, show not found
    notFound();
  } catch (error) {
    // If 401, redirect to login
    if (error instanceof ApiClientError && error.statusCode === 401) {
      redirect(`/login?redirect=/${handle}`);
    }
    // If other error, show not found
    notFound();
  }
}
