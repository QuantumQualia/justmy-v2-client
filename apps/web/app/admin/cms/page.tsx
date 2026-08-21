"use client";

import { useRouter } from "next/navigation";
import { FileText, Newspaper, Plus, ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export default function CmsDashboardPage() {
  const router = useRouter();

  const cmsSections = [
    {
      title: "Pages",
      description: "Manage dynamic pages and content blocks",
      icon: FileText,
      href: "/admin/cms/pages",
      color: "blue",
      stats: "Dynamic content",
    },
    {
      title: "Posts",
      description: "Manage blog posts and articles",
      icon: Newspaper,
      href: "/admin/cms/posts",
      color: "green",
      stats: "Coming soon",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">CMS Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your content management system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold text-foreground mt-1">-</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-foreground mt-1">-</p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-foreground mt-1">-</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* CMS Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cmsSections.map((section) => {
            const Icon = section.icon;
            const colorClasses = {
              blue: "border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20",
              green: "border-green-500/20 bg-green-500/10 hover:bg-green-500/20",
            };

            return (
              <div
                key={section.href}
                className={`border rounded-lg p-6 transition-colors cursor-pointer ${colorClasses[section.color as keyof typeof colorClasses]}`}
                onClick={() => router.push(section.href)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-6 w-6 text-foreground" />
                      <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{section.stats}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-accent-foreground"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => router.push("/admin/cms/pages/create")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
