"use client";

import type React from "react";
import { useState } from "react";
import { Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock } from "@/lib/services/cms";
import { apiRequest } from "@/lib/api-client";

interface LookBookBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

type LookBookItem = {
  id: string;
  image: string;
  title?: string;
  description?: string;
  linkUrl?: string;
};

const MAX_IMAGES = 24;

export function LookBookBlockEditor({ block, onUpdate }: LookBookBlockEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const items: LookBookItem[] = (((block as any).items as LookBookItem[] | undefined) ?? []).map(
    (item, index) => ({
      id: item.id ?? `lookbook-item-${index}`,
      image: item.image,
      title: item.title,
      description: item.description,
      linkUrl: (item as any).linkUrl,
    }),
  );
  const title = (block as any).title as string | undefined;
  const description = (block as any).description as string | undefined;

  const updateBlock = (next: Partial<PageBlock>) => {
    onUpdate({
      ...block,
      ...next,
    });
  };

  const handleGlobalFieldChange = (field: string, value: unknown) => {
    updateBlock({ [field]: value } as any);
  };

  const handleItemChange = (index: number, patch: Partial<LookBookItem>) => {
    const next: LookBookItem[] = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    updateBlock({ items: next } as any);
  };

  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index) as LookBookItem[];
    updateBlock({ items: next } as any);
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - items.length;
    if (remaining <= 0) return;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setUploadTotal(toUpload.length);
    setUploadedCount(0);
    const newItems: LookBookItem[] = [];

    try {
      for (const file of toUpload) {
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const response = await apiRequest<{ key: string }>("files/images", {
          method: "POST",
          body: JSON.stringify({ base64Image: base64 }),
        });

        const id = `lookbook-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        newItems.push({
          id,
          image: response.key,
        });

        // Use the base64 data for local preview (S3 key alone is not renderable)
        setPreviews((prev) => ({
          ...prev,
          [id]: base64,
        }));
        setUploadedCount((prev) => prev + 1);
      }

      if (newItems.length) {
        updateBlock({ items: [...items, ...newItems] } as any);
      }
    } catch (error) {
      console.error("Failed to upload lookbook images:", error);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const resolveThumbSrc = (item: LookBookItem) => {
    // Prefer session preview if we have it
    const preview = previews[item.id];
    if (preview) return preview;

    const image = item.image;
    if (!image) return null;
    if (image.startsWith("http") || image.startsWith("/")) return image;

    // Otherwise it's likely an S3 key only; we can't preview it directly
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-slate-300">LookBook title (optional)</Label>
        <Input
          value={title ?? ""}
          onChange={(e) => handleGlobalFieldChange("title", e.target.value)}
          placeholder="Summer collection 2025"
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Description (optional)</Label>
        <Input
          value={description ?? ""}
          onChange={(e) => handleGlobalFieldChange("description", e.target.value)}
          placeholder="A curated lookbook of our favorite shots."
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Images ({items.length}/{MAX_IMAGES})</Label>
        <div className="space-y-2">
          <label
            htmlFor={`lookbook-upload-${block.id}`}
            className="block relative w-full overflow-hidden rounded-lg rounded-br-none border border-slate-800 bg-slate-900/60 hover:border-blue-500/70 hover:bg-slate-900/80 transition-colors cursor-pointer group"
          >
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-slate-400">
              <ImageIcon className="h-7 w-7 text-slate-500" />
              <span className="text-xs font-medium">
                Drop or click to upload up to {MAX_IMAGES - items.length} images
              </span>
              <span className="text-[11px] text-slate-500">
                We recommend consistent aspect ratios for best grid layout
              </span>
            </div>
            <input
              id={`lookbook-upload-${block.id}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
          </label>
          <p className="text-xs text-slate-500">
            JPEG, PNG, or WebP. Images are uploaded to S3 via the `files/images` API.
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <Label className="text-slate-300">Images metadata</Label>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
              const thumbSrc = resolveThumbSrc(item);
              return (
                <div
                  key={item.id || index}
                  className={`flex flex-col gap-2 rounded-lg border p-3 cursor-move ${
                    hoverIndex === index
                      ? "border-blue-500/70 bg-slate-900"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", "lookbook-internal");
                    setDragIndex(index);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    if (hoverIndex !== index) {
                      setHoverIndex(index);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (hoverIndex === index) {
                      setHoverIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragIndex === null || dragIndex === index) return;
                    const next = [...items];
                    const a = next[dragIndex];
                    const b = next[index];
                    if (!a || !b) return;
                    next[dragIndex] = b;
                    next[index] = a;
                    setDragIndex(null);
                    setHoverIndex(null);
                    updateBlock({ items: next } as any);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="relative h-8 w-8 overflow-hidden rounded border border-slate-700 bg-black/40">
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt={item.title || item.description || ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-slate-500 absolute inset-0 m-auto" />
                        )}
                      </div>
                      <span>Image {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-700/60 text-red-400 hover:bg-red-900/30 hover:text-red-200"
                      title="Remove image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <Input
                    value={item.title ?? ""}
                    onChange={(e) => handleItemChange(index, { title: e.target.value })}
                    placeholder="Title (optional)"
                    className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 h-8 text-xs"
                  />
                  <Input
                    value={item.description ?? ""}
                    onChange={(e) => handleItemChange(index, { description: e.target.value })}
                    placeholder="Description (optional)"
                    className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 h-8 text-xs"
                  />
                  <Input
                    value={item.linkUrl ?? ""}
                    onChange={(e) => handleItemChange(index, { linkUrl: e.target.value })}
                    placeholder="Link URL (optional)"
                    className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 h-8 text-xs"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-sm text-slate-100">
              Processing images…
              {uploadTotal > 0 && (
                <span className="ml-1 text-slate-300">
                  {uploadedCount}/{uploadTotal}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

