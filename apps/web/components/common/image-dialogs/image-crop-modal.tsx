"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Loader2, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { Area } from "react-easy-crop";

/** Longest edge (px) for cropped output; keeps uploads small while staying sharp on screens. */
const MAX_CROP_OUTPUT_EDGE = 2560;
/**
 * Binary size cap before base64 (~4/3 growth). Keeps JSON body under typical 10MB limits with headroom.
 */
const MAX_OUTPUT_BYTES = 7 * 1024 * 1024;
const JPEG_MIME = "image/jpeg";
const INITIAL_JPEG_QUALITY = 0.88;
const MIN_JPEG_QUALITY = 0.45;

interface ImageCropModalProps {
  imageSrc: string;
  /** Omit for free-form crop (e.g. lookbook tiles). */
  aspectRatio?: number;
  /** Explicit crop target; wins over aspect-ratio title inference. */
  cropKind?: "banner" | "profile";
  /** May be async (e.g. upload); the modal shows progress until it settles. */
  onCrop: (croppedImage: string) => void | Promise<void>;
  onCancel: () => void;
  variant?: "light" | "default";
}

export function ImageCropModal({
  imageSrc,
  aspectRatio,
  cropKind,
  onCrop,
  onCancel,
  variant = "default",
}: ImageCropModalProps) {
  const isLight = variant === "light";
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string));
      reader.addEventListener("error", (error) => reject(error));
      reader.readAsDataURL(blob);
    });

  const canvasToJpegBlob = (
    canvas: HTMLCanvasElement,
    quality: number
  ): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        JPEG_MIME,
        quality
      );
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const srcW = pixelCrop.width;
    const srcH = pixelCrop.height;
    const longEdge = Math.max(srcW, srcH);
    const scale =
      longEdge > MAX_CROP_OUTPUT_EDGE ? MAX_CROP_OUTPUT_EDGE / longEdge : 1;
    const outW = Math.max(1, Math.round(srcW * scale));
    const outH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    canvas.width = outW;
    canvas.height = outH;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outW,
      outH
    );

    let quality = INITIAL_JPEG_QUALITY;
    let blob = await canvasToJpegBlob(canvas, quality);

    while (blob.size > MAX_OUTPUT_BYTES && quality > MIN_JPEG_QUALITY) {
      quality = Math.max(MIN_JPEG_QUALITY, quality - 0.07);
      blob = await canvasToJpegBlob(canvas, quality);
    }

    let shrinkPasses = 0;
    while (blob.size > MAX_OUTPUT_BYTES && shrinkPasses < 4) {
      shrinkPasses += 1;
      const nw = Math.max(1, Math.floor(canvas.width * 0.82));
      const nh = Math.max(1, Math.floor(canvas.height * 0.82));
      const down = document.createElement("canvas");
      const dctx = down.getContext("2d");
      if (!dctx) throw new Error("No 2d context");
      down.width = nw;
      down.height = nh;
      dctx.fillStyle = "#ffffff";
      dctx.fillRect(0, 0, nw, nh);
      dctx.drawImage(canvas, 0, 0, nw, nh);
      canvas.width = nw;
      canvas.height = nh;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, nw, nh);
      ctx.drawImage(down, 0, 0);
      quality = INITIAL_JPEG_QUALITY;
      blob = await canvasToJpegBlob(canvas, quality);
      while (blob.size > MAX_OUTPUT_BYTES && quality > MIN_JPEG_QUALITY) {
        quality = Math.max(MIN_JPEG_QUALITY, quality - 0.07);
        blob = await canvasToJpegBlob(canvas, quality);
      }
    }

    return blobToDataUrl(blob);
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels || isApplying) return;
    setIsApplying(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      await Promise.resolve(onCrop(croppedImage));
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      if (mountedRef.current) setIsApplying(false);
    }
  };

  const isBannerCrop = cropKind === "banner" || (cropKind == null && aspectRatio != null && aspectRatio > 1.45);
  const isProfileCrop = cropKind === "profile" || (cropKind == null && aspectRatio != null && Math.abs(aspectRatio - 1) < 0.02);
  const cropTitle = isProfileCrop
    ? "Crop profile image"
    : isBannerCrop
      ? "Crop banner image"
      : "Crop image";

  return (
    <div className={cn("fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4", isLight ? "bg-slate-900/40" : "bg-black/40")}>
      <div className={cn("p-6 rounded-2xl border shadow-xl w-full max-w-md", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-background border-border text-foreground")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("text-lg font-bold", isLight ? "text-slate-900" : "text-foreground")}>{cropTitle}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isApplying}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40",
              isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-muted hover:bg-muted",
            )}
            aria-label="Close"
          >
            <X className={cn("h-4 w-4", isLight ? "text-slate-500" : "text-muted-foreground")} />
          </button>
        </div>

        <div
          className={cn(
            "relative mx-auto mb-4 w-full overflow-hidden rounded-lg bg-muted",
            isApplying && "pointer-events-none opacity-60",
          )}
          style={{
            height: isBannerCrop ? "180px" : "300px",
            maxWidth: isBannerCrop ? "100%" : "300px",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={isProfileCrop ? "round" : "rect"}
            showGrid={!isProfileCrop}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                position: "relative",
                width: "100%",
                height: "100%",
                background: "var(--muted)",
              },
            }}
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-muted-foreground mb-2">
            Zoom: {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            disabled={isApplying}
            className="w-full disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onCancel}
            disabled={isApplying}
            variant="outline"
            className={cn(
              "flex-1 disabled:opacity-50",
              isLight
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                : "border-border bg-background text-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCrop()}
            disabled={isApplying || !croppedAreaPixels}
            className={cn(
              "flex-1 text-white disabled:opacity-50",
              isLight ? "bg-violet-600 hover:bg-violet-700" : "bg-blue-600 hover:bg-blue-700",
            )}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying…
              </>
            ) : (
              "Apply crop"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
