"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { Navbar } from "@/components/common/navbar/navbar";

interface NavbarBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the Navbar component.
 * Includes profile switcher, super search bar, and hamburger menu.
 */
export function NavbarBlock({ block }: NavbarBlockProps) {
  return <Navbar />;
}
