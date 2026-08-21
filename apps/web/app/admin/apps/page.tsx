"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Loader2, Menu } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { appsService } from "@/lib/services/apps";
import type { AppResponseDto } from "@/lib/services/apps";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import debounce from "lodash/debounce"

export default function AppsPage() {
  const router = useRouter();
  const [appsList, setAppsList] = useState<AppResponseDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [debouncedSearch] = useDebounce(search, 750);

  useEffect(() => {
    loadAllApps(debouncedSearch);
  }, [debouncedSearch]);

  const loadAllApps = debounce(async (searchTerm: string) => {
    try {
      setLoading(true);
      const allApps = await appsService.getAllApps();

      // Filter by search if provided
      const filtered = searchTerm
        ? allApps.filter(
          (app) =>
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : allApps;
      setAppsList(filtered);
    } catch (error) {
      console.error("Failed to load apps:", error);
      toast.error("Failed to load apps list");
    } finally {
      setLoading(false);
    }
  }, 750);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this app?")) return;

    try {
      await appsService.deleteApp(id);
      toast.success("App deleted successfully");
      loadAllApps(debouncedSearch);
    } catch (error) {
      console.error("Failed to delete app:", error);
      toast.error("Failed to delete app");
    }
  };

  // Filtering is done in loadApps
  const filteredApps = appsList;

  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Apps</h1>
            <p className="text-muted-foreground mt-2">Manage applications</p>
          </div>
          <Button
            onClick={() => router.push("/admin/apps/create")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create App
          </Button>
        </div>

        <div className="border border-border rounded-xl bg-muted p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {filteredApps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No apps found</p>
                  </div>
                ) : (
                  filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border hover:border-blue-500 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">
                            {app.name}
                          </h3>
                          {!app.isActive && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                              Inactive
                            </span>
                          )}
                          {app.isActive && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Active
                            </span>
                          )}
                          {app.osApps && app.osApps.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                              {app.osApps.length} OS
                            </span>
                          )}
                        </div>
                        {app.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {app.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/apps/${app.id}/navigation`)}
                          title="Manage Menu"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30"
                        >
                          <Menu className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/apps/${app.id}/edit`)}
                          title="Edit App"
                          className="text-muted-foreground hover:text-accent-foreground hover:bg-accent border border-transparent hover:border-border"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(app.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                          title="Delete App"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
