"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Eye, Trash2, Loader2, Settings } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
// Textarea component - using native textarea for now
const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={className} {...props} />
);
import { cmsService } from "@/lib/services/cms";
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
    },
  });
  const [content, setContent] = useState<PageBlock[]>([]);

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
    if (pageId) {
      loadPage();
    }
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
        },
      });
      setContent((data.content || []) as PageBlock[]);
    } catch (error) {
      console.error("Failed to load page:", error);
      alert("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsService.updatePage(pageId, {
        ...formData,
        content,
      });
      alert("Page saved successfully!");
    } catch (error) {
      console.error("Failed to save page:", error);
      alert("Failed to save page");
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
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/cms/pages")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pages
            </Button>
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
            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4">Page Settings</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-300">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-black/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="handle" className="text-slate-300">
                    Handle (URL) *
                  </Label>
                  <Input
                    id="handle"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    className="bg-black/50 border-slate-700 text-white mt-1"
                    placeholder="my-page"
                  />
                </div>
                <div>
                  <Label htmlFor="parentHandle" className="text-slate-300">
                    Parent Handle (optional)
                  </Label>
                  <Input
                    id="parentHandle"
                    value={formData.parentHandle}
                    onChange={(e) => setFormData({ ...formData, parentHandle: e.target.value })}
                    className="bg-black/50 border-slate-700 text-white mt-1"
                    placeholder="parent-page"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-slate-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-black/50 border-slate-700 text-white mt-1 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-black/50"
                  />
                  <Label htmlFor="isPublished" className="text-slate-300 cursor-pointer">
                    Published
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresAuth"
                    checked={formData.requiresAuth}
                    onChange={(e) => setFormData({ ...formData, requiresAuth: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-black/50"
                  />
                  <Label htmlFor="requiresAuth" className="text-slate-300 cursor-pointer">
                    Requires Authentication
                  </Label>
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Content Blocks ({content.length})
                </h2>
                <BlockSelector onSelect={handleAddBlock} />
              </div>

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
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Settings */}
            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4">SEO Settings</h2>
              <div className="space-y-4">
                <div>
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
                    className="w-full bg-black/50 border-slate-700 text-white mt-1 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="seoKeywords" className="text-slate-300">
                    Keywords
                  </Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seo.keywords}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, keywords: e.target.value },
                      })
                    }
                    className="bg-black/50 border-slate-700 text-white mt-1"
                    placeholder="keyword1, keyword2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
