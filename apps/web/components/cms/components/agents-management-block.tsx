"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { ProfileAgentsPanel } from "@/components/agents/profile-agents-panel";

interface AgentsManagementBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the agents management surface for the active profile.
 */
export function AgentsManagementBlock({ block }: AgentsManagementBlockProps) {
  return <ProfileAgentsPanel />;
}
