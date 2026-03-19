"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Eye, Loader2, Image as ImageIcon } from "lucide-react";
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
import { cmsService } from "@/lib/services/cms";
import { apiRequest } from "@/lib/api-client";
import { ImageCropModal } from "@/components/common/image-crop/image-crop-modal";
import type { PayloadPost, PageBlock } from "@/lib/services/cms";
import { PageBlockEditor } from "@/components/cms/admin/page-block-editor";
import { PostBlockSelector } from "@/components/cms/admin/post-block-selector";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<PayloadPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [ogImageKey, setOgImageKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    externalUrl: "",
    excerpt: "",
    tags: [] as string[],
    status: "draft" as "draft" | "publish" | "archive",
    seo: {
      title: "",
      description: "",
      keywords: "",
      ogImage: "",
    },
  });
  const [content, setContent] = useState<PageBlock[]>([]);
  const loadedForRef = useRef<string | null>(null);
  const isSharedPost = post?.type === "SHARED";

  const handleReorderBlock = (fromIndex: number, toIndex: number) => {
    setContent((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      )
        return prev;
      const updated: PageBlock[] = [...prev];
      const moved = updated[fromIndex]!;
      updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  useEffect(() => {
    if (!postId) return;
    if (loadedForRef.current === postId) return;
    loadedForRef.current = postId;
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await cmsService.getPostById(postId);
      setPost(data);
      setFormData({
        title: data.title || "",
        slug: data.slug || "",
        externalUrl: data.externalUrl || "",
        excerpt: data.excerpt ?? "",
        tags: data.tags ?? [],
        status: data.status ?? "draft",
        seo: {
          title: data.seo?.title || "",
          description: data.seo?.description || "",
          keywords: data.seo?.keywords || "",
          ogImage:
            typeof data.seo?.ogImage === "string"
              ? data.seo.ogImage
              : data.seo?.ogImage?.url || "",
        },
      });
      setContent((data.content || []) as PageBlock[]);
    } catch (error) {
      console.error("Failed to load post:", error);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { seo, slug, externalUrl, tags, ...rest } = formData;
      const { ogImage, ...seoWithoutOgImage } = seo;

      const seoPayload = {
        ...seoWithoutOgImage,
        ...(ogImageKey ? { ogImage: ogImageKey } : {}),
      };

      if (isSharedPost) {
        const updatedPost = await cmsService.updatePost(postId, {
          title: rest.title,
          externalUrl: externalUrl.trim() || undefined,
          excerpt: rest.excerpt?.trim() || undefined,
          tags: tags?.length ? tags : undefined,
          status: rest.status,
          seo: seoPayload,
        });
        setPost(updatedPost);
      } else {
        const updatedPost = await cmsService.updatePost(postId, {
          ...rest,
          slug: slug?.trim() || undefined,
          content,
          tags: tags?.length ? tags : undefined,
          seo: seoPayload,
        });
        // Backend may adjust slug for uniqueness; reflect it in UI.
        setPost(updatedPost);
        setFormData((prev) => ({
          ...prev,
          slug: updatedPost.slug,
        }));
      }

      toast.success("Post saved");
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (blockType: string) => {
    const defaultStyles = {
      paddingTop: "16px",
      paddingBottom: "16px",
      maxWidth: "48rem",
    } as PageBlock["styles"];

    let newBlock: PageBlock;
    if (blockType === "layout-block") {
      newBlock = {
        blockType: "layout-block",
        id: `block-${Date.now()}`,
        layout: {
          type: "container",
          grid: { columns: { desktop: 2 }, gap: { desktop: "16px" } },
          columns: [
            { id: `col-${Date.now()}-1`, name: "Column 1", blocks: [] },
            { id: `col-${Date.now()}-2`, name: "Column 2", blocks: [] },
          ],
        },
        styles: defaultStyles,
      };
    } else {
      newBlock = {
        blockType,
        id: `block-${Date.now()}`,
        styles: defaultStyles,
      };
    }
    setContent([...content, newBlock]);
  };

  const handleUpdateBlock = (index: number, block: PageBlock) => {
    const updated = [...content];
    updated[index] = block;
    setContent(updated);
  };

  const handleDeleteBlock = (index: number) => {
    if (confirm("Are you sure you want to delete this block?")) {
      setContent(content.filter((_, i) => i !== index));
    }
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const updated = [...content];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < updated.length) {
      const temp = updated[index]!;
      updated[index] = updated[newIndex]!;
      updated[newIndex] = temp;
      setContent(updated);
    }
  };

  const handleDuplicateBlock = (index: number) => {
    const blockToDuplicate = content[index];
    if (!blockToDuplicate) return;
    const duplicatedBlock: PageBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}`,
      ...(blockToDuplicate.layout?.columns && {
        layout: {
          ...blockToDuplicate.layout,
          columns: blockToDuplicate.layout.columns.map((col) => ({
            ...col,
            blocks: col.blocks.map((b) => ({ ...b, id: `block-${Date.now()}-${Math.random()}` })),
          })),
        },
      }),
      ...(blockToDuplicate.children && {
        children: blockToDuplicate.children.map((b) => ({
          ...b,
          id: `block-${Date.now()}-${Math.random()}`,
        })),
      }),
    };
    const updated = [...content];
    updated.splice(index + 1, 0, duplicatedBlock);
    setContent(updated);
  };

  const handleOgImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setOgImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleOgImageCrop = async (croppedImage: string) => {
    setUploadingOgImage(true);
    try {
      const response = await apiRequest<{ key: string }>("files/images", {
        method: "POST",
        body: JSON.stringify({ base64Image: croppedImage }),
      });
      setOgImageKey(response.key);
      setFormData((prev) => ({
        ...prev,
        seo: { ...prev.seo, ogImage: croppedImage },
      }));
    } catch (error) {
      console.error("Failed to upload OG image:", error);
      toast.error("Failed to upload OG image");
    } finally {
      setOgImagePreview(null);
      setUploadingOgImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-10 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Post</h1>
              <p className="text-slate-400">{post.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => post.slug && window.open(`/blog/${post.slug}`, "_blank")}
              disabled={!post.slug}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                (isSharedPost ? !formData.externalUrl.trim() : false)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Post Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  {isSharedPost
                    ? "Title, external URL, excerpt, tags, and publish settings."
                    : "Title, slug, excerpt, tags, and content blocks."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-300">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-black/50 border-slate-700 text-white mt-1"
                  />
                </div>
                {isSharedPost ? (
                  <div>
                    <Label htmlFor="externalUrl" className="text-slate-300">External URL *</Label>
                    <Input
                      id="externalUrl"
                      type="url"
                      value={formData.externalUrl}
                      disabled
                      readOnly
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          externalUrl: e.target.value,
                        })
                      }
                      className="bg-black/50 border-slate-700 text-white mt-1"
                      placeholder="https://example.com/article"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="slug" className="text-slate-300">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        })
                      }
                      className="bg-black/50 border-slate-700 text-white mt-1"
                      placeholder="my-post"
                    />
                    <p className="text-xs text-slate-500 mt-1">/blog/{formData.slug || "my-post"}</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="excerpt" className="text-slate-300">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    placeholder="Short excerpt..."
                    className="w-full bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 mt-1 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <TagInput
                  id="tags"
                  label="Tags"
                  value={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  placeholder="Add tag (Enter or comma)"
                />
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-300">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
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
              </CardContent>
            </Card>

            {!isSharedPost && (
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-white">
                      Content Blocks ({content.length})
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Add and reorder blocks for the post body.
                    </CardDescription>
                  </div>
                  <PostBlockSelector onSelect={handleAddBlock} />
                </CardHeader>
                <CardContent>
                {content.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>No content blocks yet. Add a block to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.map((block: PageBlock, index: number) => (
                      <PageBlockEditor
                        key={block.id || index}
                        block={block}
                        index={index}
                        onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
                        onDelete={() => handleDeleteBlock(index)}
                        onMove={handleMoveBlock}
                        onReorder={handleReorderBlock}
                        onDuplicate={() => handleDuplicateBlock(index)}
                        isFirst={index === 0}
                        isLast={index === content.length - 1}
                      />
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">SEO Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Title, description, keywords, and OG image for sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seoTitle" className="text-slate-300">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seo.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, title: e.target.value },
                      })
                    }
                    className="bg-black/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="seoDescription" className="text-slate-300">
                    SEO Description
                  </Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seo.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, description: e.target.value },
                      })
                    }
                    placeholder="SEO description for search results..."
                    className="w-full bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 mt-1 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <TagInput
                  id="seoKeywords"
                  label="Keywords"
                  value={
                    formData.seo.keywords
                      ? formData.seo.keywords.split(",").map((s) => s.trim()).filter(Boolean)
                      : []
                  }
                  onChange={(keywords) =>
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, keywords: keywords.join(", ") },
                    })
                  }
                  placeholder="Add keyword (Enter or comma)"
                />
                <div>
                  <Label htmlFor="seoOgImage" className="text-slate-300">OG Image</Label>
                  <div className="mt-2 space-y-2">
                    <label
                      htmlFor="seoOgImage"
                      className="block relative w-full overflow-hidden rounded-lg rounded-br-none border border-slate-800 bg-slate-900/60 hover:border-blue-500/70 hover:bg-slate-900/80 transition-colors cursor-pointer group"
                    >
                      {formData.seo.ogImage ? (
                        <>
                          <img
                            src={formData.seo.ogImage}
                            alt="OG preview"
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-black/70 text-slate-100 border border-slate-600">
                              Change image
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 text-slate-400">
                          <ImageIcon className="h-6 w-6 text-slate-500" />
                          <span className="text-xs font-medium">Upload OG image</span>
                          <span className="text-[11px] text-slate-500">1200×630</span>
                        </div>
                      )}
                      <input
                        id="seoOgImage"
                        type="file"
                        accept="image/*"
                        onChange={handleOgImageFileSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500">
                      Used for social sharing (Open Graph image).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {ogImagePreview && (
        <ImageCropModal
          imageSrc={ogImagePreview}
          aspectRatio={1200 / 630}
          onCrop={handleOgImageCrop}
          onCancel={() => setOgImagePreview(null)}
        />
      )}
      {uploadingOgImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-sm text-slate-100">Processing image…</span>
          </div>
        </div>
      )}
    </div>
  );
}
