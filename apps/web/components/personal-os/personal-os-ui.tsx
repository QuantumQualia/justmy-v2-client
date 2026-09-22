"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CreditCard, Home, Radio } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { navIsActive } from "@/components/biz-os/biz-os-ui";

export const PERSONAL_OS_NAV = [
  { href: "/personal-os", label: "Home", icon: Home, exact: true },
  { href: "/personal-os/plans", label: "myPLANS", icon: CalendarDays },
  { href: "/personal-os/daily-drop", label: "Daily Drop", icon: Radio },
  { href: "/personal-os/card", label: "myCARD", icon: CreditCard },
] as const;

export function PersonalOsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-violet-100/80 bg-white/90 backdrop-blur-md"
      aria-label="Personal OS"
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
        {PERSONAL_OS_NAV.map((item) => {
          const active = navIsActive(pathname, item.href, "exact" in item ? Boolean(item.exact) : false);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                  : "text-slate-600 hover:bg-violet-50 hover:text-violet-800",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
