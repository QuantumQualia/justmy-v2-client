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
  /** May be async (e.g. upload); the modal shows progress until it settles. */
  onCrop: (croppedImage: string) => void | Promise<void>;
  onCancel: () => void;
}

export function ImageCropModal({
  imageSrc,
  aspectRatio,
  onCrop,
  onCancel,
}: ImageCropModalProps) {
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

  const cropTitle =
    aspectRatio == null
      ? "Crop image"
      : aspectRatio > 1.45
        ? "Crop banner image"
        : Math.abs(aspectRatio - 1) < 0.02
          ? "Crop profile image"
          : "Crop image";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{cropTitle}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isApplying}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 transition-colors hover:bg-slate-600 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        <div
          className={cn(
            "relative mx-auto mb-4 w-full overflow-hidden rounded-lg bg-slate-900",
            isApplying && "pointer-events-none opacity-60",
          )}
          style={{
            height:
              aspectRatio != null && aspectRatio > 1.45
                ? "180px"
                : "300px",
            maxWidth:
              aspectRatio != null && aspectRatio > 1.45 ? "100%" : "300px",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                position: "relative",
                width: "100%",
                height: "100%",
                background: "#1e293b",
              },
            }}
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-2">
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
            className="flex-1 border-slate-600 bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCrop()}
            disabled={isApplying || !croppedAreaPixels}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
