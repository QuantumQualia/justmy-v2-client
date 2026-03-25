"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Eye, Trash2, Loader2, Settings, Image as ImageIcon } from "lucide-react";
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
import { uploadBase64Image } from "@/lib/api-client";
import { ImageCropModal, ImageInsertDialog } from "@/components/common/image-dialogs";
import { readFileAsDataUrl } from "@/lib/read-image-files";
import type { PayloadPage, PageBlock } from "@/lib/services/cms";
import { PageBlockEditor } from "@/components/cms/admin/page-block-editor";
import { BlockSelector } from "@/components/cms/admin/block-selector";

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const [page, setPage] = useState<PayloadPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [ogInsertOpen, setOgInsertOpen] = useState(false);
  const [ogImageKey, setOgImageKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    handle: "",
    parentHandle: "",
    description: "",
    isPublished: false,
    requiresAuth: false,
    seo: {
      title: "",
      description: "",
      keywords: "",
      ogImage: "",
    },
  });
  const [content, setContent] = useState<PageBlock[]>([]);
  const loadedForRef = useRef<string | null>(null);

  const handleReorderBlock = (fromIndex: number, toIndex: number) => {
    setContent((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const updated: PageBlock[] = [...prev];
      const moved = updated[fromIndex]!;
      updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  useEffect(() => {
    if (!pageId) return;
    if (loadedForRef.current === pageId) return;
    loadedForRef.current = pageId;
    loadPage();
  }, [pageId]);

  const loadPage = async () => {
    try {
      const data = await cmsService.getPageById(pageId);
      setPage(data);
      setFormData({
        title: data.title || "",
        handle: data.handle || "",
        parentHandle: data.parentHandle || "",
        description: data.description || "",
        isPublished: data.isPublished || false,
        requiresAuth: data.requiresAuth || false,
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
      console.error("Failed to load page:", error);
      toast.error("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { seo, ...rest } = formData;
      const { ogImage, ...seoWithoutOgImage } = seo;

      const payload = {
        ...rest,
        content,
        seo: {
          ...seoWithoutOgImage,
          ...(ogImageKey ? { ogImage: ogImageKey } : {}),
        },
      };

      await cmsService.updatePage(pageId, payload);
      toast.success("Page saved");
    } catch (error) {
      console.error("Failed to save page:", error);
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (blockType: string) => {
    let newBlock: PageBlock;
    if (blockType === "layout-block") {
      newBlock = {
        blockType: "layout-block",
        id: `block-${Date.now()}`,
        layout: {
          type: "container",
          grid: {
            columns: { desktop: 2 },
            gap: { desktop: "16px" },
          },
          columns: [
            { id: `col-${Date.now()}-1`, name: "Column 1", blocks: [] },
            { id: `col-${Date.now()}-2`, name: "Column 2", blocks: [] },
          ],
        },
      };
    } else {
      newBlock = {
        blockType,
        id: `block-${Date.now()}`,
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
      const updated = content.filter((_, i) => i !== index);
      setContent(updated);
    }
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const updated: PageBlock[] = [...content];
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

    // Deep clone the block
    const duplicatedBlock: PageBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}`,
      // Deep clone nested structures
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
        children: blockToDuplicate.children.map((b) => ({ ...b, id: `block-${Date.now()}-${Math.random()}` })),
      }),
    };

    // Insert after the original block
    const updated = [...content];
    updated.splice(index + 1, 0, duplicatedBlock);
    setContent(updated);
  };

  const handleOgImageCrop = async (croppedImage: string) => {
    setUploadingOgImage(true);
    try {
      const response = await uploadBase64Image<{ key: string }>(croppedImage);

      setOgImageKey(response.key);
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          ogImage: croppedImage,
        },
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

  if (!page) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Page not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-10 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Page</h1>
              <p className="text-slate-400">{page.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `/${page.parentHandle || ""}${page.parentHandle ? "/" : ""}${page.handle}`,
                  "_blank"
                )
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Settings */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Page Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Title, handle, description, and options.
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle" className="text-slate-300">
                    Handle (URL) *
                  </Label>
                  <Input
                    id="handle"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    placeholder="my-page"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentHandle" className="text-slate-300">
                    Parent Handle (optional)
                  </Label>
                  <Input
                    id="parentHandle"
                    value={formData.parentHandle}
                    onChange={(e) => setFormData({ ...formData, parentHandle: e.target.value })}
                    className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    placeholder="parent-page"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Page description..."
                    className="w-full bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
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
                    Published
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="requiresAuth"
                    checked={formData.requiresAuth}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresAuth: checked })
                    }
                  />
                  <Label
                    htmlFor="requiresAuth"
                    className="text-slate-300 cursor-pointer font-normal"
                  >
                    Requires Authentication
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Content Blocks */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-white">
                    Content Blocks ({content.length})
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Add and reorder blocks for the page body.
                  </CardDescription>
                </div>
                <BlockSelector onSelect={handleAddBlock} />
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Settings */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">SEO Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Title, description, keywords, and OG image for sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle" className="text-slate-300">
                    SEO Title
                  </Label>
                  <Input
                    id="seoTitle"
                    value={formData.seo.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, title: e.target.value },
                      })
                    }
                    className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
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
                    className="w-full bg-black/50 border-slate-700 text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-md px-3 py-2"
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
                  <Label className="text-slate-300">OG Image</Label>
                  <div className="mt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => setOgInsertOpen(true)}
                      className="group relative block w-full cursor-pointer overflow-hidden rounded-lg rounded-br-none border border-slate-800 bg-slate-900/60 text-left transition-colors hover:border-blue-500/70 hover:bg-slate-900/80"
                    >
                      {formData.seo.ogImage ? (
                        <>
                          <img
                            src={formData.seo.ogImage}
                            alt="OG preview"
                            className="aspect-[1200/630] w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="rounded-full border border-slate-600 bg-black/70 px-3 py-1.5 text-xs font-medium text-slate-100">
                              Change image
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex aspect-[1200/630] flex-col items-center justify-center gap-2 text-slate-400">
                          <ImageIcon className="h-6 w-6 text-slate-500" />
                          <span className="text-xs font-medium">Add OG image</span>
                          <span className="text-[11px] text-slate-500">Recommended 1200×675</span>
                        </div>
                      )}
                    </button>
                    <p className="text-xs text-slate-500">
                      Used for social sharing preview (Open Graph image).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ImageInsertDialog
        open={ogInsertOpen}
        onOpenChange={setOgInsertOpen}
        onPick={async (result) => {
          if (result.kind === "url") {
            setOgImagePreview(result.imageSrc);
          } else {
            const f = result.files[0];
            if (!f) return;
            setOgImagePreview(await readFileAsDataUrl(f));
          }
        }}
      />

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
