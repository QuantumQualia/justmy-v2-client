"use client";

import { useEffect } from "react";

export function SharedPostRedirector({
  externalUrl,
}: {
  externalUrl: string;
}) {
  useEffect(() => {
    // Replace so the back button doesn't land on /blog/{slug}.
    window.location.replace(externalUrl);
  }, [externalUrl]);

  return null;
}

