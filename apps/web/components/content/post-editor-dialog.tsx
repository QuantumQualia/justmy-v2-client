"use client";

import * as React from "react";
import { ExternalLink, Image as ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  cmsService,
  ApiClientError,
  type CreatePostDto,
  type CreateSharedPostDto,
  type PayloadPost,
  type PageBlock,
} from "@/lib/services/cms";
import { uploadBase64Image } from "@/lib/api-client";
import { TagInput } from "@/components/ui/tag-input";
import { ImageCropModal, ImageInsertDialog } from "@/components/common/image-dialogs";
import { readFileAsDataUrl } from "@/lib/read-image-files";
import { PageBlockEditor } from "@/components/cms/admin/page-block-editor";
import { PostBlockSelector } from "@/components/cms/admin/post-block-selector";
import { cn } from "@workspace/ui/lib/utils";

export type PostType = "standard" | "shared-from-url";

export interface PostEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editPostId?: string;
  /** Pre-selected post type for create mode (chosen before dialog opens). */
  initialPostType?: PostType;
  /** When true, successful create does not close the dialog (parent should switch to edit mode). */
  keepOpenAfterCreate?: boolean;
  onSaved: (post: PayloadPost) => void | Promise<void>;
}

interface PostFormData {
  title: string;
  slug: string;
  externalUrl: string;
  excerpt: string;
  tags: string[];
  status: "draft" | "publish" | "archive";
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
  };
}

const EMPTY_FORM: PostFormData = {
  title: "",
  slug: "",
  externalUrl: "",
  excerpt: "",
  tags: [],
  status: "draft",
  seo: { title: "", description: "", keywords: "", ogImage: "" },
};

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function PostEditorDialog({
  open,
  onOpenChange,
  mode,
  editPostId,
  initialPostType = "standard",
  keepOpenAfterCreate = false,
  onSaved,
}: PostEditorDialogProps) {
  const [postType, setPostType] = React.useState<PostType>(initialPostType);
  const [formData, setFormData] = React.useState<PostFormData>({ ...EMPTY_FORM });
  const [content, setContent] = React.useState<PageBlock[]>([]);
  const [isSharedPost, setIsSharedPost] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loadingPost, setLoadingPost] = React.useState(false);
  const loadedRef = React.useRef<string | null>(null);

  const [ogImagePreview, setOgImagePreview] = React.useState<string | null>(null);
  const [ogInsertOpen, setOgInsertOpen] = React.useState(false);
  const [ogImageKey, setOgImageKey] = React.useState<string | null>(null);
  const [uploadingOgImage, setUploadingOgImage] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      loadedRef.current = null;
      return;
    }

    if (mode === "create") {
      setPostType(initialPostType);
      setFormData({ ...EMPTY_FORM });
      setContent([]);
      setIsSharedPost(false);
      setOgImageKey(null);
      setOgImagePreview(null);
      loadedRef.current = null;
      return;
    }

    if (mode === "edit" && editPostId && loadedRef.current !== editPostId) {
      loadedRef.current = editPostId;
      setLoadingPost(true);
      setOgImageKey(null);
      setOgImagePreview(null);
      cmsService
        .getPostById(editPostId)
        .then((post) => {
          const shared = post.type === "SHARED";
          setIsSharedPost(shared);
          setPostType(shared ? "shared-from-url" : "standard");
          const ogImg =
            typeof post.seo?.ogImage === "string"
              ? post.seo.ogImage
              : post.seo?.ogImage?.url || "";
          setFormData({
            title: post.title || "",
            slug: post.slug || "",
            externalUrl: post.externalUrl || "",
            excerpt: post.excerpt ?? "",
            tags: post.tags ?? [],
            status: post.status ?? "draft",
            seo: {
              title: post.seo?.title || "",
              description: post.seo?.description || "",
              keywords: post.seo?.keywords || "",
              ogImage: ogImg,
            },
          });
          setContent((post.content || []) as PageBlock[]);
        })
        .catch((err) => {
          console.error("Failed to load post:", err);
          toast.error("Failed to load post");
        })
        .finally(() => setLoadingPost(false));
    }
  }, [open, mode, editPostId, initialPostType]);

  const close = () => {
    if (saving) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let savedPost: PayloadPost;

      const buildSeo = () => {
        const base: Record<string, string | undefined> = {
          title: formData.seo.title?.trim() || undefined,
          description: formData.seo.description?.trim() || undefined,
          keywords: formData.seo.keywords?.trim() || undefined,
        };
        if (ogImageKey) base.ogImage = ogImageKey;
        return base;
      };

      if (mode === "create") {
        if (postType === "standard") {
          const payload: CreatePostDto = {
            title: formData.title,
            slug: formData.slug?.trim() || undefined,
            excerpt: formData.excerpt?.trim() || undefined,
            tags: formData.tags?.length ? formData.tags : undefined,
            status: formData.status,
            content: content.length ? content : undefined,
            seo: buildSeo(),
          };
          savedPost = await cmsService.createPost(payload);
        } else {
          const payload: CreateSharedPostDto = {
            externalUrl: formData.externalUrl.trim(),
            status: formData.status,
            seo: buildSeo(),
          };
          savedPost = await cmsService.createSharedPostFromUrl(payload);
        }
        toast.success("Post created");
      } else {
        const seoPayload = buildSeo();

        if (isSharedPost) {
          savedPost = await cmsService.updatePost(editPostId!, {
            title: formData.title,
            excerpt: formData.excerpt?.trim() || undefined,
            tags: formData.tags?.length ? formData.tags : undefined,
            status: formData.status,
            seo: seoPayload,
          });
        } else {
          savedPost = await cmsService.updatePost(editPostId!, {
            title: formData.title,
            slug: formData.slug?.trim() || undefined,
            excerpt: formData.excerpt?.trim() || undefined,
            tags: formData.tags?.length ? formData.tags : undefined,
            status: formData.status,
            content,
            seo: seoPayload,
          });
        }
        toast.success("Post saved");
      }

      await Promise.resolve(onSaved(savedPost));
      if (!(mode === "create" && keepOpenAfterCreate)) {
        close();
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      if (
        postType === "shared-from-url" &&
        error instanceof ApiClientError &&
        error.statusCode === 409
      ) {
        toast.error(error.message || "A shared post with this URL already exists.");
      } else {
        toast.error(mode === "create" ? "Failed to create post" : "Failed to save post");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Block management ──────────────────────────────────────────────

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
      newBlock = { blockType, id: `block-${Date.now()}`, styles: defaultStyles };
    }
    setContent((prev) => [...prev, newBlock]);
  };

  const handleUpdateBlock = (index: number, block: PageBlock) => {
    setContent((prev) => {
      const updated = [...prev];
      updated[index] = block;
      return updated;
    });
  };

  const handleDeleteBlock = (index: number) => {
    setContent((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const updated = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < updated.length) {
        [updated[index], updated[newIndex]] = [updated[newIndex]!, updated[index]!];
      }
      return updated;
    });
  };

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
      const updated = [...prev];
      const moved = updated[fromIndex]!;
      updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDuplicateBlock = (index: number) => {
    setContent((prev) => {
      const blockToDuplicate = prev[index];
      if (!blockToDuplicate) return prev;
      const duplicatedBlock: PageBlock = {
        ...blockToDuplicate,
        id: `block-${Date.now()}`,
        ...(blockToDuplicate.layout?.columns && {
          layout: {
            ...blockToDuplicate.layout,
            columns: (blockToDuplicate.layout.columns as any[]).map((col: any) => ({
              ...col,
              blocks: col.blocks.map((b: any) => ({
                ...b,
                id: `block-${Date.now()}-${Math.random()}`,
              })),
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
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicatedBlock);
      return updated;
    });
  };

  // ── OG image ───────────────────────────────────────────────────────

  const handleOgImageCrop = async (croppedImage: string) => {
    setUploadingOgImage(true);
    try {
      const response = await uploadBase64Image<{ key: string }>(croppedImage);
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

  // ── Derived state ─────────────────────────────────────────────────

  const isStandard = mode === "edit" ? !isSharedPost : postType === "standard";
  const isSimplifiedSharedCreate = mode === "create" && postType === "shared-from-url";

  const canSubmit =
    mode === "create"
      ? isStandard
        ? !!formData.title.trim()
        : !!formData.externalUrl.trim()
      : !!formData.title.trim();

  // ── Render ────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !saving) close(); }}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex min-h-0 w-full flex-col overflow-hidden rounded-2xl rounded-br-none border border-slate-700/80 bg-slate-900 p-0 shadow-2xl shadow-black/40",
          isSimplifiedSharedCreate
            ? "max-h-[min(90dvh,560px)] sm:max-w-lg"
            : "max-h-[min(92dvh,920px)] w-[calc(100vw-1rem)] sm:max-w-[min(100vw-2rem,1200px)]"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-4">
          <DialogTitle className="min-w-0 flex-1 truncate text-left text-white">
            {mode === "create"
              ? postType === "shared-from-url"
                ? "Create shared post from URL"
                : "Create new post"
              : isSharedPost
                ? "Edit shared post"
                : "Edit post"}
          </DialogTitle>
          <div className="flex shrink-0 items-center gap-1">
            {mode === "edit" &&
              !loadingPost &&
              formData.status === "publish" &&
              formData.slug?.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 rounded-lg rounded-br-none border-slate-600 px-2 text-slate-200 hover:bg-slate-800 sm:px-3"
                  title="Open published post"
                >
                  <a
                    href={`/blog/${encodeURIComponent(formData.slug.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">View live</span>
                  </a>
                </Button>
              )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8 rounded-lg rounded-br-none text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close"
              disabled={saving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable body — min-h-0 lets flex children shrink so overflow-y works on mobile */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {loadingPost ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="ml-3 text-sm text-slate-400">Loading post…</span>
            </div>
          ) : isSimplifiedSharedCreate ? (
            <fieldset disabled={saving} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="peExternalUrl" className="text-slate-300">
                  External URL <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="peExternalUrl"
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  placeholder="https://example.com/article"
                  className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  Title, excerpt, and SEO metadata will be fetched from the URL automatically.
                  You can review and edit them afterwards.
                </p>
              </div>
            </fieldset>
          ) : (
            <div
              className={cn(
                "flex flex-col gap-6",
                isStandard && "lg:grid lg:grid-cols-12 lg:items-start lg:gap-8"
              )}
            >
              <div className={cn("space-y-6", isStandard && "lg:col-span-5")}>
              {/* ── Post settings ── */}
              <fieldset disabled={saving} className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Post settings
                </h3>

                {isStandard ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="peTitle" className="text-slate-300">
                          Title <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="peTitle"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          onBlur={() => {
                            if (!formData.slug && formData.title) {
                              setFormData((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
                            }
                          }}
                          placeholder="Post title"
                          className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                          autoFocus={mode === "create"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="peSlug" className="text-slate-300">Slug</Label>
                        <Input
                          id="peSlug"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                            })
                          }
                          onBlur={() => {
                            if (!formData.slug && formData.title) {
                              setFormData((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
                            }
                          }}
                          placeholder="my-post"
                          className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="peExcerpt" className="text-slate-300">Excerpt</Label>
                      <Textarea
                        id="peExcerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Short excerpt…"
                        className="min-h-[80px] rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TagInput
                        id="peTags"
                        label="Tags"
                        value={formData.tags}
                        onChange={(tags) => setFormData({ ...formData, tags })}
                        placeholder="Add tag (Enter or comma)"
                        className="text-slate-300"
                        inputClassName="border-slate-700 bg-black/40"
                      />
                      <div className="space-y-2">
                        <Label className="text-slate-300">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(v) =>
                            setFormData({ ...formData, status: v as "draft" | "publish" | "archive" })
                          }
                        >
                          <SelectTrigger className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="publish">Publish</SelectItem>
                            <SelectItem value="archive">Archive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {mode === "edit" && (
                      <div className="space-y-2">
                        <Label htmlFor="peTitle" className="text-slate-300">Title</Label>
                        <Input
                          id="peTitle"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Post title"
                          className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="peExternalUrl" className="text-slate-300">
                        External URL {mode === "create" && <span className="text-red-400">*</span>}
                      </Label>
                      <Input
                        id="peExternalUrl"
                        type="url"
                        value={formData.externalUrl}
                        onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                        placeholder="https://example.com/article"
                        className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                        autoFocus={mode === "create"}
                        readOnly={mode === "edit"}
                      />
                      {mode === "create" && (
                        <p className="text-xs text-slate-500">
                          Title, excerpt, and SEO will be fetched from the URL automatically.
                        </p>
                      )}
                    </div>
                    {mode === "edit" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="peExcerpt" className="text-slate-300">Excerpt</Label>
                          <Textarea
                            id="peExcerpt"
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            placeholder="Short excerpt…"
                            className="min-h-[80px] rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TagInput
                            id="peTags"
                            label="Tags"
                            value={formData.tags}
                            onChange={(tags) => setFormData({ ...formData, tags })}
                            placeholder="Add tag (Enter or comma)"
                            className="text-slate-300"
                            inputClassName="border-slate-700 bg-black/40"
                          />
                          <div className="space-y-2">
                            <Label className="text-slate-300">Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(v) =>
                                setFormData({ ...formData, status: v as "draft" | "publish" | "archive" })
                              }
                            >
                              <SelectTrigger className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="publish">Publish</SelectItem>
                                <SelectItem value="archive">Archive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </fieldset>

              {/* ── SEO ── */}
              <fieldset disabled={saving} className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  SEO settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peSeoTitle" className="text-slate-300">SEO Title</Label>
                    <Input
                      id="peSeoTitle"
                      value={formData.seo.title}
                      onChange={(e) =>
                        setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })
                      }
                      placeholder="Override page title for search engines"
                      className="rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <TagInput
                    id="peSeoKeywords"
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
                    placeholder="Add keyword"
                    className="text-slate-300"
                    inputClassName="border-slate-700 bg-black/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peSeoDesc" className="text-slate-300">SEO Description</Label>
                  <Textarea
                    id="peSeoDesc"
                    value={formData.seo.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, description: e.target.value },
                      })
                    }
                    placeholder="Description for search results…"
                    className="min-h-[60px] rounded-lg rounded-br-none border-slate-700 bg-black/40 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">OG Image</Label>
                  <button
                    type="button"
                    onClick={() => setOgInsertOpen(true)}
                    className="group relative block w-full cursor-pointer overflow-hidden rounded-lg rounded-br-none border border-slate-700 bg-black/30 text-left transition-colors hover:border-blue-500/70 hover:bg-black/40"
                  >
                    {formData.seo.ogImage ? (
                      <>
                        <img
                          src={formData.seo.ogImage}
                          alt="OG preview"
                          className="w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="rounded-full border border-slate-600 bg-black/70 px-3 py-1.5 text-xs font-medium text-slate-100">
                            Change image
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-2 text-slate-400">
                        <ImageIcon className="h-6 w-6 text-slate-500" />
                        <span className="text-xs font-medium">Add OG image</span>
                        <span className="text-[11px] text-slate-500">1200 × 630 recommended</span>
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-slate-500">
                    Used for social sharing (Open Graph image).
                  </p>
                </div>
              </fieldset>
              </div>

              {/* ── Content blocks: header always visible; list scrolls (esp. mobile) ── */}
              {isStandard && (
                <div className="flex min-h-0 flex-col lg:col-span-7 lg:h-full lg:self-stretch lg:border-l lg:border-slate-800/60 lg:pl-8">
                  <fieldset
                    disabled={saving}
                    className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/40 lg:min-h-[min(70vh,640px)]"
                  >
                    <legend className="sr-only">Content blocks</legend>
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 bg-slate-900/70 px-3 py-2.5">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        Content blocks ({content.length})
                      </h3>
                      <PostBlockSelector onSelect={handleAddBlock} size="sm" />
                    </div>
                    <div
                      className={cn(
                        "min-h-[12rem] flex-1 touch-pan-y overflow-x-auto overflow-y-auto px-3 py-3",
                        "max-h-[min(52vh,420px)] sm:max-h-[min(56vh,480px)]",
                        "lg:min-h-0 lg:max-h-none"
                      )}
                    >
                      {content.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-700/90 bg-slate-900/30 py-8 text-center text-slate-500">
                          <p className="text-sm">No content blocks yet.</p>
                          <p className="mt-1 text-xs">
                            Use <span className="text-slate-400">Add block</span> to get started.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 pb-1">
                          {content.map((block, index) => (
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
                  </fieldset>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-800 px-4 py-3 sm:px-5 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={saving}
            className="rounded-lg rounded-br-none border-slate-600 text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || !canSubmit || loadingPost}
            className="rounded-lg rounded-br-none bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating…" : "Saving…"}
              </>
            ) : isSimplifiedSharedCreate ? (
              "Create from URL"
            ) : mode === "create" ? (
              "Create post"
            ) : (
              "Save changes"
            )}
          </Button>
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 shadow-xl">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-sm text-slate-100">Processing image…</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
