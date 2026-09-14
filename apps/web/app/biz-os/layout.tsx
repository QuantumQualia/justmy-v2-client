import type { Metadata } from "next";
import { BizOsShell } from "@/components/biz-os/biz-os-shell";
import { ForceLightMode } from "@/components/theme/force-light-mode";
import { BIZ_OS_LAYOUT_METADATA } from "@/lib/biz-os/seo";

export const metadata: Metadata = BIZ_OS_LAYOUT_METADATA;

export default function BizOsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ForceLightMode>
      <BizOsShell>{children}</BizOsShell>
    </ForceLightMode>
  );
}
