"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { TagInput } from "@/components/ui/tag-input";
import { cmsService } from "@/lib/services/cms";
import type { CreatePostDto } from "@/lib/services/cms";

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePostDto>({
    title: "",
    slug: "",
    excerpt: "",
    tags: [],
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: CreatePostDto = {
        ...formData,
        slug: formData.slug?.trim() || undefined,
        excerpt: formData.excerpt?.trim() || undefined,
        tags: formData.tags?.length ? formData.tags : undefined,
      };
      const post = await cmsService.createPost(payload);
      toast.success("Post created");
      router.push(`/admin/cms/posts/${post.id}/edit`);
    } catch (error) {
      console.error("Failed to create post:", error);
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
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription className="text-slate-400">
                Title, slug, excerpt, and tags for your post.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  onBlur={() => {
                    setFormData({
                      ...formData,
                      slug: formData.slug || generateSlug(formData.title),
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
                  value={formData.slug ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") || undefined,
                    })
                  }
                  onBlur={() => {
                    if (!formData.slug && formData.title) {
                      setFormData({
                        ...formData,
                        slug: generateSlug(formData.title),
                      });
                    }
                  }}
                  placeholder="my-post"
                  className="bg-black/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">
                  Optional. URL: /blog/{formData.slug || "my-post"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-slate-300">
                  Excerpt
                </Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value || undefined })
                  }
                  placeholder="Short excerpt..."
                  className="min-h-[80px] bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none"
                />
              </div>
              <TagInput
                id="tags"
                label="Tags"
                value={formData.tags ?? []}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Add tag (Enter or comma)"
                className="text-slate-300"
              />
              <div className="flex items-center gap-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublished: checked })
                  }
                />
                <Label
                  htmlFor="isPublished"
                  className="text-slate-300 cursor-pointer font-normal"
                >
                  Publish immediately
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
