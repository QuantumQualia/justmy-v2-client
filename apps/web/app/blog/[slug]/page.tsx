import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cmsService } from "@/lib/services/cms";
import { PayloadPostRenderer } from "@/components/cms/payload-post-renderer";
import { SharedPostRedirector } from "@/components/cms/shared-post-redirector";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

const fetchPostBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () => {
      try {
        return await cmsService.getPostBySlug(slug);
      } catch {
        return null;
      }
    },
    ["cms-post-by-slug", slug],
    {
      revalidate,
      tags: [`cms-post:${slug}`],
    }
  )();
});

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://justmy.com";
  const postUrl = `${siteUrl}/blog/${slug}`;

  if (!post || post.status !== "publish") {
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
      canonical: postUrl, // Keep SEO on your domain.
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

  if (post.status !== "publish") {
    notFound();
  }

  // For SHARED posts, keep HTML/metadata on your domain for SEO,
  // but navigate users to the external URL on the client immediately.
  if (post.type === "SHARED" && post.externalUrl) {
    return (
      <>
        <SharedPostRedirector externalUrl={post.externalUrl} />
        <div className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground flex items-center justify-center p-8">
          <div className="max-w-3xl text-center">
            <h1 className="text-3xl font-bold">{post.seo?.title || post.title}</h1>
            {post.excerpt && (
              <p className="mt-4 text-muted-foreground">{post.excerpt}</p>
            )}
            <a
              href={post.externalUrl}
              className="mt-8 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Continue to source
            </a>
          </div>
        </div>
      </>
    );
  }

  return <PayloadPostRenderer post={post} />;
}
