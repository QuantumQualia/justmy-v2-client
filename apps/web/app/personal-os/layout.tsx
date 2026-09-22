import type { Metadata } from "next";
import { PersonalOsShell } from "@/components/personal-os/personal-os-shell";
import { ForceLightMode } from "@/components/theme/force-light-mode";
import { PERSONAL_OS_LAYOUT_METADATA } from "@/lib/personal-os/seo";

export const metadata: Metadata = PERSONAL_OS_LAYOUT_METADATA;

export default function PersonalOsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ForceLightMode>
      <PersonalOsShell>{children}</PersonalOsShell>
    </ForceLightMode>
  );
}
