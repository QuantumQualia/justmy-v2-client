"use client";

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { toPng } from "html-to-image";
import type { ProfileData } from "@/lib/store";

// Helper to crop image to exact dimensions starting from (0,0)
const cropToExactSize = async (
  dataUrl: string,
  expectedWidth: number,
  expectedHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = expectedWidth;
        canvas.height = expectedHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Clear canvas with white background (or transparent)
        ctx.clearRect(0, 0, expectedWidth, expectedHeight);
        
        // Draw the captured image, cropping to exact dimensions
        // If the captured image is larger, we'll crop from the top-left
        // If smaller, we'll center it (but typically it should match)
        const sourceWidth = Math.min(img.width, expectedWidth);
        const sourceHeight = Math.min(img.height, expectedHeight);
        
        // Draw from source (0,0) to destination (0,0) with exact dimensions
        ctx.drawImage(
          img,
          0, 0, sourceWidth, sourceHeight,  // Source: start from (0,0)
          0, 0, expectedWidth, expectedHeight  // Destination: draw at (0,0) with exact size
        );
        
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'));
    };
    
    img.src = dataUrl;
  });
};

// Helper to apply border radius to top-left and top-right corners of an image
const applyBorderRadius = async (
  dataUrl: string,
  width: number,
  height: number,
  radius: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Save context state
        ctx.save();
        
        // Create a path with rounded top corners
        ctx.beginPath();
        // Top-left corner: arc from (0, radius) to (radius, 0)
        ctx.moveTo(0, radius);
        ctx.arc(radius, radius, radius, Math.PI, Math.PI * 1.5, false);
        // Top edge
        ctx.lineTo(width - radius, 0);
        // Top-right corner: arc from (width - radius, 0) to (width, radius)
        ctx.arc(width - radius, radius, radius, Math.PI * 1.5, 0, false);
        // Right edge
        ctx.lineTo(width, height);
        // Bottom edge
        ctx.lineTo(0, height);
        // Left edge (back to start)
        ctx.closePath();
        
        // Clip to the rounded rectangle
        ctx.clip();
        
        // Draw the image (this will be clipped to the rounded shape)
        ctx.drawImage(img, 0, 0, width, height);
        
        // Restore context (removes clip)
        ctx.restore();
        
        // Convert to data URL
        const roundedDataUrl = canvas.toDataURL('image/png');
        resolve(roundedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for border radius'));
    };
    
    img.src = dataUrl;
  });
};


export interface MediaCardProps {
  /** Profile data to display on the card */
  profileData: ProfileData;
  /** Profile URL to encode in QR code */
  profileUrl: string;
  /** Optional callback when download is successful */
  onDownload?: () => void;
}

export function MediaCard({
  profileData,
  profileUrl,
  onDownload,
}: MediaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load placeholder image
  const placeholderPath = "/images/placeholders/grab_mycard_default.png";

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // Wait for all images to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the element's actual rendered dimensions
      // Use offsetWidth/offsetHeight for the actual rendered size (not scrollWidth which can include hidden content)
      const rect = cardRef.current.getBoundingClientRect();
      const offsetWidth = cardRef.current.offsetWidth;
      const offsetHeight = cardRef.current.offsetHeight;
      
      // Use offsetWidth/offsetHeight as primary, fallback to rect if needed
      // Don't use scrollWidth as it can include extra space
      const finalWidth = offsetWidth > 0 ? offsetWidth : Math.ceil(rect.width);
      const finalHeight = offsetHeight > 0 ? offsetHeight : Math.ceil(rect.height);
      
      // Ensure we have valid dimensions
      if (finalWidth === 0 || finalHeight === 0) {
        throw new Error('Element has zero dimensions');
      }
      
      // Convert external images to data URLs using proxy API to avoid CORS issues
      const images = cardRef.current.querySelectorAll('img');
      const imageDataUrls: string[] = [];
      
      // Helper to fetch image through proxy API (bypasses CORS) and convert to data URL
      const loadImageWithCORS = async (src: string): Promise<string> => {
        const isExternal = src.startsWith('http://') || src.startsWith('https://');
        const isLocal = src.startsWith('/') || src.startsWith(window.location.origin);
        
        // For local images, convert directly
        if (isLocal || src.startsWith('data:')) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  resolve(canvas.toDataURL('image/png'));
                } else {
                  reject(new Error('Failed to get canvas context'));
                }
              } catch (error) {
                reject(error);
              }
            };
            img.onerror = () => reject(new Error('Failed to load local image'));
            img.src = src;
          });
        }
        
        // For external images (S3), use proxy API to bypass CORS
        if (isExternal) {
          const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(src)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`Proxy fetch failed: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(blob);
            
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL('image/png');
                  URL.revokeObjectURL(objectUrl);
                  resolve(dataUrl);
                } else {
                  URL.revokeObjectURL(objectUrl);
                  reject(new Error('Failed to get canvas context'));
                }
              } catch (error) {
                URL.revokeObjectURL(objectUrl);
                reject(error);
              }
            };
            
            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              reject(new Error('Failed to load image from blob'));
            };
            
            img.src = objectUrl;
          });
        }
        
        throw new Error(`Unsupported image source: ${src}`);
      };
      
      // Process images sequentially
      for (const img of Array.from(images)) {
        const imgElement = img as HTMLImageElement;
        const originalSrc = imgElement.src;
        
        // Skip if already a data URL or local image
        if (originalSrc.startsWith('data:') || 
            originalSrc.startsWith('/') || 
            originalSrc.startsWith(window.location.origin)) {
          imageDataUrls.push(originalSrc);
          continue;
        }
        
        // Convert external images to data URLs
        try {
          const dataUrl = await loadImageWithCORS(originalSrc);
          imageDataUrls.push(dataUrl);
          imgElement.src = dataUrl;
        } catch (error) {
          throw new Error(`Failed to load image: ${originalSrc}`);
        }
      }

      // Wait for data URLs to be set
      await new Promise(resolve => setTimeout(resolve, 300));

      // Clone the element and position it at (0,0) to avoid viewport offset issues
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      
      // Copy computed styles to ensure clone looks identical
      const computedStyle = window.getComputedStyle(cardRef.current);
      clone.style.cssText = computedStyle.cssText;
      
      // Explicitly ensure background image is set (important for html-to-image)
      // Convert relative URLs to absolute URLs for html-to-image
      let bgImage = cardRef.current.style.backgroundImage || 
                    computedStyle.backgroundImage;
      
      if (bgImage && bgImage !== 'none') {
        // Extract URL from backgroundImage (format: url("path") or url('path'))
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          let imageUrl = urlMatch[1];
          // Convert relative path to absolute URL
          if (imageUrl.startsWith('/')) {
            imageUrl = `${window.location.origin}${imageUrl}`;
          }
          clone.style.backgroundImage = `url("${imageUrl}")`;
        } else {
          clone.style.backgroundImage = bgImage;
        }
        clone.style.backgroundSize = computedStyle.backgroundSize || 'cover';
        clone.style.backgroundPosition = computedStyle.backgroundPosition || 'center';
        clone.style.backgroundRepeat = computedStyle.backgroundRepeat || 'no-repeat';
      }
      
      // Override positioning to ensure it's at (0,0) with exact dimensions
      clone.style.position = 'absolute';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.width = `${finalWidth}px`;
      clone.style.height = `${finalHeight}px`;
      clone.style.maxWidth = `${finalWidth}px`; // Prevent any max-width constraints
      clone.style.minWidth = `${finalWidth}px`; // Ensure exact width
      clone.style.transform = 'none';
      clone.style.zIndex = '9999';
      clone.style.boxSizing = 'border-box'; // Ensure padding is included in width
      
      // Create a temporary container positioned off-screen
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = `${finalWidth}px`;
      container.style.height = `${finalHeight}px`;
      container.style.overflow = 'hidden';
      container.appendChild(clone);
      document.body.appendChild(container);
      
      try {
        // Wait for clone to render and background image to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture the cloned element which is now at (0,0)
        // Include backgroundColor to ensure background images render
        let dataUrl = await toPng(clone, {
          pixelRatio: 1,
          width: finalWidth,
          height: finalHeight,
          cacheBust: false,
          skipFonts: true,
          backgroundColor: '#ffffff', // Fallback background color
          filter: (node) => {
            if (node.nodeName === 'SCRIPT') return false;
            return true;
          },
        });
        
        // Crop the image to ensure it starts from (0,0) with exact dimensions
        let croppedDataUrl = await cropToExactSize(dataUrl, finalWidth, finalHeight);
        
        // Apply border radius to top-left and top-right corners
        const borderRadius = 8; // Match rounded-lg (0.5rem = 8px)
        const finalDataUrl = await applyBorderRadius(croppedDataUrl, finalWidth, finalHeight, borderRadius);
        
        // Clean up
        document.body.removeChild(container);

        // Restore original image sources if they weren't data URLs
        for (let i = 0; i < images.length && i < imageDataUrls.length; i++) {
          const imgElement = images[i] as HTMLImageElement;
          const originalSrc = imageDataUrls[i];
          if (originalSrc && !originalSrc.startsWith('data:')) {
            imgElement.src = originalSrc;
          }
        }

        // Download
        const link = document.createElement("a");
        link.href = finalDataUrl;
        link.download = `mycard-${profileData.slug || "card"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onDownload?.();
        setIsGenerating(false);
      } catch (cloneError) {
        // Clean up on error
        if (container.parentNode) {
          document.body.removeChild(container);
        }
        throw cloneError;
      }
    } catch (error) {
      console.error("Failed to generate media card", error);
      alert("Failed to generate image. Please ensure images are loaded and try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-4xl mx-auto rounded-lg rounded-br-none overflow-hidden shadow-2xl"
        style={{
          aspectRatio: "16/9",
          backgroundImage: `url(${placeholderPath})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Left Section - Profile Photo Overlay */}
        <div 
          className="absolute left-0 top-0 w-[50%] h-[calc(100%-67px)] flex items-center justify-center overflow-hidden"
          style={{ 
            backgroundColor: 'transparent',
            borderTopLeftRadius: '8px', // Match rounded-lg
          }}
        >
          {profileData.photo ? (
            <img
              src={profileData.photo}
              alt={profileData.name}
              className="w-full h-full object-cover"
              style={{ 
                backgroundColor: 'transparent',
                borderTopLeftRadius: '8px', // Ensure photo respects the corner radius
              }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ 
                backgroundColor: 'rgba(226, 232, 240, 0.5)',
                borderTopLeftRadius: '8px',
              }}
            >
              <span 
                className="text-4xl font-bold"
                style={{ color: '#94a3b8' }}
              >
                {profileData.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
        </div>

        {/* Right Section - QR Code Overlay */}
        <div className="absolute right-[11%] top-1/2 -translate-y-1/2">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: '#ffffff' }}
          >
            <QRCodeSVG
              value={profileUrl}
              size={200}
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>
        </div>

        {/* Bottom Strip - URL Overlay */}
        <div 
          className="absolute bottom-0 left-[80px] w-full h-[60px] flex items-center px-5"
          style={{ backgroundColor: 'transparent' }}
        >
          <span 
            className="font-medium"
            style={{ color: '#ffffff' }}
          >
            {profileUrl}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          disabled={isGenerating}
          className="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-lg px-6 py-3 flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          {isGenerating ? "Generating..." : "Download Image"}
        </Button>
      </div>
    </div>
  );
}
