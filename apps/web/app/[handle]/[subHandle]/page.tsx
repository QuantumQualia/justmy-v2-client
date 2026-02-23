import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PayloadPageRenderer } from "@/components/cms/payload-page-renderer";
import { cmsService, ApiClientError } from "@/lib/services/cms";

interface NestedHandlePageProps {
  params: Promise<{
    handle: string;
    subHandle: string;
  }>;
}

export async function generateMetadata({
  params,
}: NestedHandlePageProps): Promise<Metadata> {
  const { handle, subHandle } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://justmy.com";
  const pageUrl = `${siteUrl}/${handle}/${subHandle}`;

  // Fetch Payload page
  let payloadPage = null;
  try {
    payloadPage = await cmsService.getPageByNestedHandle(handle, subHandle);
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

export default async function NestedHandlePage({
  params,
}: NestedHandlePageProps) {
  const resolvedParams = await params;
  const { handle, subHandle } = resolvedParams;

  try {
    const payloadPage = await cmsService.getPageByNestedHandle(
      handle,
      subHandle
    );

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
      redirect(`/login?redirect=/${handle}/${subHandle}`);
    }
    // If other error, show not found
    console.error("Failed to fetch nested page:", error);
  }

  // If we get here, page doesn't exist
  notFound();
}
