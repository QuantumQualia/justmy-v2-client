"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Users, 
  UserCircle, 
  MapPin, 
  FileText, 
  Layout,
  Settings,
  ChevronDown,
  ChevronRight,
  Newspaper
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const navItems = [
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Profiles",
    href: "/admin/profiles",
    icon: UserCircle,
  },
  {
    title: "Markets",
    href: "/admin/markets",
    icon: MapPin,
  },
];

const cmsSubItems = [
  {
    title: "Dashboard",
    href: "/admin/cms",
    icon: Layout,
  },
  {
    title: "Pages",
    href: "/admin/cms/pages",
    icon: FileText,
  },
  {
    title: "Posts",
    href: "/admin/cms/posts",
    icon: Newspaper,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isCmsActive = pathname?.startsWith("/admin/cms");
  const [isCmsExpanded, setIsCmsExpanded] = useState(isCmsActive);

  // Auto-expand CMS menu when on CMS pages
  useEffect(() => {
    if (isCmsActive && !isCmsExpanded) {
      setIsCmsExpanded(true);
    }
  }, [isCmsActive, isCmsExpanded]);

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b border-slate-800 p-6">
            <h1 className="text-xl font-bold text-white">
              Admin Panel
            </h1>
            <p className="text-xs text-slate-400 mt-1">Management Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}

            {/* CMS Section with Submenu */}
            <div className="mt-2">
              <button
                onClick={() => setIsCmsExpanded(!isCmsExpanded)}
                className={cn(
                  "flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isCmsActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <span>CMS</span>
                </div>
                {isCmsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* CMS Submenu */}
              {isCmsExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2">
                  {cmsSubItems.map((item) => {
                    const Icon = item.icon;
                    const isDashboard = item.href === "/admin/cms";
                    const isActive = isDashboard
                      ? pathname === "/admin/cms" || pathname === "/admin/cms/"
                      : pathname === item.href || pathname?.startsWith(item.href + "/");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
