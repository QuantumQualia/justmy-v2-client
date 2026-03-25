"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import type { PageBlock } from "@/lib/services/cms";
import { uploadBase64Image } from "@/lib/api-client";
import { ImageCropModal, ImageInsertDialog } from "@/components/common/image-dialogs";
import { readFileAsDataUrl } from "@/lib/read-image-files";

interface ImageBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function ImageBlockEditor({ block, onUpdate }: ImageBlockEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [insertOpen, setInsertOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: unknown) => {
    onUpdate({
      ...block,
      [field]: value,
    });
  };

  const resolveImageSrc = () => {
    if (previewSrc) return previewSrc;
    const image = (block as any).image;
    if (typeof image === "string") {
      if (image.startsWith("http") || image.startsWith("/")) return image;
      return null;
    }
    if (image && typeof image === "object" && "url" in image) {
      return (image as { url?: string }).url || null;
    }
    return null;
  };

  const handleCroppedImage = async (base64: string) => {
    setUploading(true);
    try {
      const response = await uploadBase64Image<{ key: string }>(base64);
      setPreviewSrc(base64);
      handleFieldChange("image", response.key);
    } catch (error) {
      console.error("Failed to upload image block image:", error);
    } finally {
      setUploading(false);
      setCropSrc(null);
    }
  };

  const src = resolveImageSrc();
  const title = (block as any).title as string | undefined;
  const description = (block as any).description as string | undefined;
  const linkUrl = (block as any).linkUrl as string | undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Image</Label>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setInsertOpen(true)}
            className="group relative block w-full cursor-pointer overflow-hidden rounded-lg rounded-br-none border border-slate-800 bg-slate-900/60 text-left transition-colors hover:border-blue-500/70 hover:bg-slate-900/80"
          >
            {src ? (
              <>
                <img
                  src={src}
                  alt={title || description || "Post image"}
                  className="max-h-[400px] w-full bg-black/40 object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full border border-slate-600 bg-black/70 px-3 py-1.5 text-xs font-medium text-slate-100">
                    Change image
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
                <ImageIcon className="h-8 w-8 text-slate-500" />
                <span className="text-xs font-medium">Add image</span>
                <span className="text-[11px] text-slate-500">
                  Device or Unsplash, then crop
                </span>
              </div>
            )}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {!uploading && <span>JPEG, PNG, or WebP.</span>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Title (optional)</Label>
        <Input
          value={title ?? ""}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          placeholder="Short title displayed with the image"
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Description (optional)</Label>
        <Input
          value={description ?? ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Longer description shown below the title"
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Link URL (optional)</Label>
        <Input
          value={linkUrl ?? ""}
          onChange={(e) => handleFieldChange("linkUrl", e.target.value)}
          placeholder="https://example.com"
          className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <ImageInsertDialog
        open={insertOpen}
        onOpenChange={setInsertOpen}
        onPick={async (result) => {
          if (result.kind === "url") {
            setCropSrc(result.imageSrc);
          } else {
            const f = result.files[0];
            if (!f) return;
            setCropSrc(await readFileAsDataUrl(f));
          }
        }}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onCrop={handleCroppedImage}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {uploading && (
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

