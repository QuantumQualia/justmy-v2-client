import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { cmsService } from "@/lib/services/cms";
import { PayloadPostRenderer } from "@/components/cms/payload-post-renderer";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const fetchPostBySlug = cache(async (slug: string) => {
  try {
    return await cmsService.getPostBySlug(slug);
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://justmy.com";
  const postUrl = `${siteUrl}/blog/${slug}`;

  if (!post || !post.isPublished) {
    return {
      title: "Post not found",
    };
  }

  const title = post.seo?.title || post.title;
  const description =
    post.seo?.description || post.excerpt || `Read ${post.title}`;
  const image =
    typeof post.seo?.ogImage === "string"
      ? post.seo.ogImage
      : post.seo?.ogImage?.url;

  return {
    title,
    description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: "article",
      url: postUrl,
      title,
      description,
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
    ...(post.seo?.keywords && {
      keywords: post.seo.keywords.split(",").map((k) => k.trim()),
    }),
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  if (!post.isPublished) {
    notFound();
  }

  return <PayloadPostRenderer post={post} />;
}
