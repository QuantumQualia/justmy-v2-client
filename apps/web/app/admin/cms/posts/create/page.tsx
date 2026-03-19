"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cmsService, ApiClientError } from "@/lib/services/cms";
import type { CreatePostDto, CreateSharedPostDto } from "@/lib/services/cms";

export default function CreatePostPage() {
  const router = useRouter();
  const [postType, setPostType] = useState<"standard" | "shared-from-url">("standard");
  const [loading, setLoading] = useState(false);
  const [standardFormData, setStandardFormData] = useState<CreatePostDto>({
    title: "",
    slug: "",
    excerpt: "",
    tags: [],
    status: "draft",
  });
  const [sharedExternalUrl, setSharedExternalUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (postType === "standard") {
        const payload: CreatePostDto = {
          ...standardFormData,
          slug: standardFormData.slug?.trim() || undefined,
          excerpt: standardFormData.excerpt?.trim() || undefined,
          tags: standardFormData.tags?.length ? standardFormData.tags : undefined,
        };
        const post = await cmsService.createPost(payload);
        toast.success("Post created");
        router.push(`/admin/cms/posts/${post.id}/edit`);
      } else {
        const payload: CreateSharedPostDto = {
          externalUrl: sharedExternalUrl.trim(),
        };
        const post = await cmsService.createSharedPostFromUrl(payload);
        toast.success("Shared post created");
        router.push(`/admin/cms/posts/${post.id}/edit`);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      // Backend returns 409 when the external URL already exists in the system.
      if (
        postType === "shared-from-url" &&
        error instanceof ApiClientError &&
        error.statusCode === 409
      ) {
        const backendMessage = error.message || "Shared post already exists.";
        toast.error(backendMessage);

        // Try to extract the existing post id from the message/error payload.
        const extractId = (text?: string) => {
          if (!text) return null;
          // Mongo ObjectId (24 hex) or uuid-like fallbacks.
          const objectIdMatch = text.match(/\b[a-f0-9]{24}\b/i);
          if (objectIdMatch?.[0]) return objectIdMatch[0];
          const uuidMatch = text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
          if (uuidMatch?.[0]) return uuidMatch[0];
          return null;
        };

        let existingPostId: string | null = null;

        // `ApiClientError.error` may contain additional structured info (stringified JSON or text).
        const extra = error.error;
        if (typeof extra === "string") {
          try {
            const parsed = JSON.parse(extra);
            existingPostId =
              parsed?.id ||
              parsed?.postId ||
              parsed?.existingPostId ||
              parsed?.post?.id ||
              parsed?.post?._id ||
              null;
          } catch {
            // Not JSON - ignore.
          }
          existingPostId = existingPostId || extractId(extra);
        }

        existingPostId = existingPostId || extractId(backendMessage);

        if (existingPostId) {
          router.push(`/admin/cms/posts/${existingPostId}/edit`);
          return;
        }

        // If we can't extract the id, we at least keep the user informed.
        return;
      }

      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Post</h1>
            <p className="text-slate-400">Create a new blog post</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="postType" className="text-slate-300">
              Post Type
            </Label>
            <Select
              value={postType}
              onValueChange={(value) =>
                setPostType(value as "standard" | "shared-from-url")
              }
            >
              <SelectTrigger className="bg-black/50 border-slate-700 text-white">
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="standard">Standard Post</SelectItem>
                <SelectItem value="shared-from-url">Shared from URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">
                {postType === "standard" ? "Basic Information" : "Shared Post From URL"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {postType === "standard"
                  ? "Title, slug, excerpt, and tags for your post."
                  : "Paste an external URL and we will fetch metadata (title, excerpt, SEO) automatically."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {postType === "standard" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-300">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      value={standardFormData.title}
                      onChange={(e) =>
                        setStandardFormData({
                          ...standardFormData,
                          title: e.target.value,
                        })
                      }
                      onBlur={() => {
                        setStandardFormData({
                          ...standardFormData,
                          slug:
                            standardFormData.slug ||
                            generateSlug(standardFormData.title),
                        });
                      }}
                      placeholder="Post title"
                      className="bg-black/50 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-slate-300">
                      Slug (URL)
                    </Label>
                    <Input
                      id="slug"
                      value={standardFormData.slug ?? ""}
                      onChange={(e) =>
                        setStandardFormData({
                          ...standardFormData,
                          slug:
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "") || undefined,
                        })
                      }
                      onBlur={() => {
                        if (!standardFormData.slug && standardFormData.title) {
                          setStandardFormData({
                            ...standardFormData,
                            slug: generateSlug(standardFormData.title),
                          });
                        }
                      }}
                      placeholder="my-post"
                      className="bg-black/50 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500">
                      Optional. URL: /blog/{standardFormData.slug || "my-post"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excerpt" className="text-slate-300">
                      Excerpt
                    </Label>
                    <Textarea
                      id="excerpt"
                      value={standardFormData.excerpt ?? ""}
                      onChange={(e) =>
                        setStandardFormData({
                          ...standardFormData,
                          excerpt: e.target.value || undefined,
                        })
                      }
                      placeholder="Short excerpt..."
                      className="min-h-[80px] bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none"
                    />
                  </div>
                  <TagInput
                    id="tags"
                    label="Tags"
                    value={standardFormData.tags ?? []}
                    onChange={(tags) =>
                      setStandardFormData({
                        ...standardFormData,
                        tags,
                      })
                    }
                    placeholder="Add tag (Enter or comma)"
                    className="text-slate-300"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-slate-300">
                      Status
                    </Label>
                    <Select
                      value={standardFormData.status ?? "draft"}
                      onValueChange={(value) =>
                        setStandardFormData({
                          ...standardFormData,
                          status: value as "draft" | "publish" | "archive",
                        })
                      }
                    >
                      <SelectTrigger
                        id="status"
                        className="bg-black/50 border-slate-700 text-white"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="publish">Publish</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="externalUrl" className="text-slate-300">
                    External URL *
                  </Label>
                  <Input
                    id="externalUrl"
                    type="url"
                    value={sharedExternalUrl}
                    onChange={(e) => setSharedExternalUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="bg-black/50 border-slate-700 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Title, excerpt, and SEO settings will be fetched from the URL.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                (postType === "standard"
                  ? !standardFormData.title
                  : !sharedExternalUrl.trim())
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading
                ? "Creating..."
                : postType === "standard"
                  ? "Create Post"
                  : "Create Shared Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
