"use client";

import React from "react";
import {
  SiFacebook,
  SiLinkedin,
  SiX,
  SiPinterest,
  SiReddit,
} from "react-icons/si";
import { Mail, X as CloseIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export interface SharePayload {
  /** Main title for the shared content (e.g. profile or article name) */
  title: string;
  /** Optional short description */
  description?: string;
  /** Public URL to share */
  url: string;
  /** Optional image to preview in the modal */
  imageUrl?: string;
  /** Optional label for the content owner (e.g. profile name, business name) */
  entityLabel?: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payload: SharePayload;
}

const overlayBase =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4";
const panelBase =
  "bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800";

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  payload,
}) => {
  if (!isOpen) return null;

  const { title, description, url, imageUrl, entityLabel } = payload;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = description ? encodeURIComponent(description) : "";

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
  const emailUrl = `mailto:?subject=${encodedTitle}&body=${encodedDesc || encodedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      // swallow – we don't want to crash share just because copy failed
      console.error("Failed to copy share url", e);
    }
  };

  return (
    <div className={overlayBase} onClick={onClose}>
      <div
        className={panelBase}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <h2 className="text-lg font-semibold text-white">Share myCARD</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <span className="sr-only">Close</span>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-6 space-y-4 bg-slate-900">
          {/* Image */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black/40">
              <img
                src={imageUrl}
                alt={title}
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}

          {/* Title / description */}
          <div className="text-center space-y-1">
            {entityLabel && (
              <div className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                {entityLabel}
              </div>
            )}
            <div className="text-base font-semibold text-white">
              {title}
            </div>
            {description && (
              <div className="text-sm text-slate-400">
                {description}
              </div>
            )}
          </div>

          {/* Social row */}
          <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md hover:brightness-110 cursor-pointer"
            >
              <SiFacebook className="h-5 w-5" />
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-md hover:brightness-110 cursor-pointer"
            >
              <SiLinkedin className="h-5 w-5" />
            </a>
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-black text-white flex items-center justify-center shadow-md hover:brightness-110 cursor-pointer"
            >
              <SiX className="h-5 w-5" />
            </a>
            <a
              href={pinterestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-[#E60023] text-white flex items-center justify-center shadow-md hover:brightness-110 cursor-pointer"
            >
              <SiPinterest className="h-5 w-5" />
            </a>
            <a
              href={redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-[#FF4500] text-white flex items-center justify-center shadow-md hover:brightness-110 cursor-pointer"
            >
              <SiReddit className="h-5 w-5" />
            </a>
            <a
              href={emailUrl}
              className="h-11 w-11 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-md hover:bg-slate-600 cursor-pointer"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          {/* Copy link row */}
          <div className="flex items-center gap-3 mt-4 bg-slate-800/80 rounded-full border border-slate-700 px-3 py-2 shadow-inner shadow-black/40">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400">Share link</div>
              <div className="text-xs font-medium text-slate-100 truncate">
                {url}
              </div>
            </div>
            <Button
              size="sm"
              className="cursor-pointer rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-slate-900 text-xs font-semibold px-5 shadow-md shadow-emerald-500/30 transition-colors"
              onClick={handleCopy}
              type="button"
            >
              Copy link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

