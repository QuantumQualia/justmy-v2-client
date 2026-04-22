import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PayloadPageRenderer } from "@/components/cms/payload-page-renderer";
import { cmsService, ApiClientError } from "@/lib/services/cms";

interface ParentHandlePageProps {
  params: Promise<{
    handle: string;
    parentHandle: string;
  }>;
}

export const revalidate = 300;

const fetchNestedPage = cache(async (handle: string, parentHandle: string) => {
  return unstable_cache(
    async () => {
      try {
        return await cmsService.getPageByNestedHandle(handle, parentHandle);
      } catch (error) {
        if (error instanceof ApiClientError && error.statusCode === 401) {
          throw error;
        }
        return null;
      }
    },
    ["cms-page-by-nested-handle", handle, parentHandle],
    {
      revalidate,
      tags: [`cms-page:${handle}/${parentHandle}`],
    }
  )();
});

const fetchNestedPageAuthed = async (handle: string, parentHandle: string) => {
  try {
    return await cmsService.getPageByNestedHandle(handle, parentHandle, {
      includeAuth: true,
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 401) {
      throw error;
    }
    return null;
  }
};

async function shouldIncludeAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("auth_access_token")?.value);
}

export async function generateMetadata({
  params,
}: ParentHandlePageProps): Promise<Metadata> {
  const { handle, parentHandle } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://justmy.com";
  const pageUrl = `${siteUrl}/${handle}/${parentHandle}`;

  // Fetch Payload page
  let payloadPage = null;
  try {
    const includeAuth = await shouldIncludeAuth();
    payloadPage = includeAuth
      ? await fetchNestedPageAuthed(handle, parentHandle)
      : await fetchNestedPage(handle, parentHandle);
  } catch (error) {
    // If 401 or other error, return not found metadata
    // Don't expose auth requirements in metadata
  }

  if (!payloadPage || !payloadPage.isPublished) {
    return {
      title: "Page Not Found | JustMy.com",
      description: "The requested page could not be found.",
    };
  }

  const title = payloadPage.seo?.title || payloadPage.title;
  const description =
    payloadPage.seo?.description || payloadPage.description || "";
  const image = payloadPage.seo?.ogImage
    ? typeof payloadPage.seo.ogImage === "string"
      ? payloadPage.seo.ogImage
      : payloadPage.seo.ogImage.url
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
    keywords: payloadPage.seo?.keywords?.split(",").map((k) => k.trim()),
  };
}

export default async function ParentHandlePage({
  params,
}: ParentHandlePageProps) {
  const resolvedParams = await params;
  const { handle, parentHandle } = resolvedParams;

  try {
    const includeAuth = await shouldIncludeAuth();
    const payloadPage = includeAuth
      ? await fetchNestedPageAuthed(handle, parentHandle)
      : await fetchNestedPage(handle, parentHandle);

    // If page is null (200 response with null body), page doesn't exist
    if (payloadPage === null) {
      notFound();
    }

    if (payloadPage && payloadPage.isPublished) {
      return <PayloadPageRenderer page={payloadPage} />;
    }
  } catch (error) {
    // If 401, redirect to login
    if (error instanceof ApiClientError && error.statusCode === 401) {
      redirect(`/login?redirect=/${handle}/${parentHandle}`);
    }
    // If other error, show not found
    console.error("Failed to fetch nested page:", error);
  }

  // If we get here, page doesn't exist
  notFound();
}

