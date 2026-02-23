"use client";

import React from "react";
import { ShareDialog } from "./share-dialog";
import { useShareStore } from "./share-store";

export function GlobalShareHost() {
  // Use full store without a selector to avoid Next.js getServerSnapshot warnings
  const { isOpen, payload, close } = useShareStore();

  if (!isOpen || !payload) return null;

  return (
    <ShareDialog
      isOpen={isOpen}
      onClose={close}
      payload={payload}
    />
  );
}

