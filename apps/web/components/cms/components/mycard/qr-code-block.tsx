"use client";

import React from "react";
import { QRCode, QRCodeProps } from "@/components/mycard/qr-code";
import { useProfileStore } from "@/lib/store";
import type { PageBlock } from "@/lib/services/cms";

interface QRCodeBlockProps {
  block: PageBlock;
}

export function QRCodeBlock({ block }: QRCodeBlockProps) {
  // Get profile data from store
  const data = useProfileStore((state) => state.data);

  // Get URL from block or generate from profile slug
  const url = block.url || (data.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/${data.slug}` : "");

  const props: QRCodeProps = {
    url,
    variant: block.variant || "simple",
    hashtag: block.hashtag,
    onOpenCard: block.onOpenCard ? () => {
      if (typeof window !== "undefined") {
        window.open(url, "_blank");
      }
    } : undefined,
    onCopy: block.onCopy,
  };

  return <QRCode {...props} />;
}
