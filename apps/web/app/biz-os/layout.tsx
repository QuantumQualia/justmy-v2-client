import { BizOsShell } from "@/components/biz-os/biz-os-shell";
import { ForceLightMode } from "@/components/theme/force-light-mode";

export default function BizOsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ForceLightMode>
      <BizOsShell>{children}</BizOsShell>
    </ForceLightMode>
  );
}
