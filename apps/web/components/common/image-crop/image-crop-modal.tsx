"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { Area } from "react-easy-crop";

interface ImageCropModalProps {
  imageSrc: string;
  aspectRatio: number;
  onCrop: (croppedImage: string) => void;
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

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result as string));
        reader.addEventListener("error", (error) => reject(error));
        reader.readAsDataURL(blob);
      }, "image/png");
    });
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCrop(croppedImage);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Crop {aspectRatio === 16 / 9 ? "Banner" : "Profile"} Image
          </h3>
          <button
            onClick={onCancel}
            className="h-8 w-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        <div 
          className="relative w-full mb-4 mx-auto rounded-lg overflow-hidden bg-slate-900"
          style={{ 
            height: aspectRatio === 16 / 9 ? "180px" : "300px",
            maxWidth: aspectRatio === 16 / 9 ? "100%" : "300px"
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
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
