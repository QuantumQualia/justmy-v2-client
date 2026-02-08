"use client";

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export interface QRCodeProps {
  /** URL to encode in the QR code */
  url: string;
  /** Display mode: 'simple' shows just QR + hashtag, 'full' shows QR + buttons */
  variant?: "simple" | "full";
  /** Optional custom hashtag text (default: "#grabmyCARD") */
  hashtag?: string;
  /** Optional callback when "Open Card" is clicked */
  onOpenCard?: () => void;
  /** Optional callback when copy is successful */
  onCopy?: () => void;
}

export function QRCode({
  url,
  variant = "simple",
  hashtag = "",
  onOpenCard,
  onCopy,
}: QRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Reusable QR code render with hashtag
  const renderQRCodeWithHashtag = () => (
    <div className="flex flex-col items-center bg-white p-4 rounded-lg">
      <div ref={qrRef}>
        <QRCodeSVG
          value={url}
          size={200}
          level="H"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>
      {hashtag && (
        <p className="text-slate-800 text-lg font-medium">{hashtag}</p>
      )}
    </div>
  );

  const handleDownload = async () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Convert SVG to blob
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create a canvas to convert SVG to PNG
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        return;
      }

      // QR code size (including padding)
      const qrSize = img.width;

      // Calculate dimensions for QR code + hashtag
      const padding = 20; // Padding around the entire image
      const textHeight = 20; // Space for hashtag text
      const spacing = 0; // Space between QR code and text

      canvas.width = qrSize + (padding * 2);
      canvas.height = qrSize + (padding * 2) + spacing + (hashtag ? textHeight : 0);

      // Fill white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, padding, padding);

      // Draw hashtag text
      ctx.fillStyle = "#000000"; // slate-8 color
      ctx.font = "20px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        hashtag,
        canvas.width / 2,
        padding + qrSize + spacing
      );

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `mycard-${url}-qrcode.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        }
        URL.revokeObjectURL(svgUrl);
      }, "image/png");
    };
    img.src = svgUrl;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy URL", e);
    }
  };

  const handleOpenCard = () => {
    if (onOpenCard) {
      onOpenCard();
    } else {
      window.open(url, "_blank");
    }
  };

  if (variant === "simple") {
    return renderQRCodeWithHashtag();
  }

  // Full variant
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      {/* QR Code */}
      {renderQRCodeWithHashtag()}

      {/* Actions */}
      <div className="flex flex-col gap-3 flex-1 w-full sm:w-auto sm:max-w-[350px]">
        {/* Download QRCode button */}
        <Button
          onClick={handleDownload}
          className="w-full sm:w-auto cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-full px-4 py-2 flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download QRCode
        </Button>

        {/* Open Card button */}
        <Button
          onClick={handleOpenCard}
          className="w-full sm:w-auto cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-full px-4 py-2 flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open Card
        </Button>

        {/* Copy link section */}
        <div className="flex items-center gap-2 bg-slate-800 rounded-full border border-slate-700 px-3 py-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 truncate">{url}</div>
          </div>
          <Button
            size="sm"
            onClick={handleCopy}
            className="cursor-pointer rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy link
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
