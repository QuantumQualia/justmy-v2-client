"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";

interface NavbarBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Navbar component.
 * Includes profile switcher, super search bar, and hamburger menu.
 */
export function NavbarBlock({ block }: NavbarBlockProps) {
  // Navbar is now rendered globally via `apps/web/app/layout.tsx`.
  // This block is kept for backwards compatibility with existing CMS pages.
  return null;
}
