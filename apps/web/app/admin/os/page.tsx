"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Loader2, Layers } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { osService } from "@/lib/services/os";
import type { OSResponseDto } from "@/lib/services/os";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import debounce from "lodash/debounce"

export default function OSPage() {
  const router = useRouter();
  const [osList, setOsList] = useState<OSResponseDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [debouncedSearch] = useDebounce(search, 750);

  useEffect(() => {
    loadOS(debouncedSearch);
  }, [debouncedSearch]);

  const loadOS = debounce(async (searchTerm: string) => {
    try {
      setLoading(true);
      const allOS = await osService.getOSList();
      // Filter by search if provided
      const filtered = searchTerm
        ? allOS.filter(
          (os) =>
            os.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            os.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : allOS;
      setOsList(filtered);
    } catch (error) {
      console.error("Failed to load OS:", error);
      toast.error("Failed to load OS list");
    } finally {
      setLoading(false);
    }
  }, 750);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this OS?")) return;

    try {
      await osService.deleteOS(id);
      toast.success("OS deleted successfully");
      loadOS(debouncedSearch);
    } catch (error) {
      console.error("Failed to delete OS:", error);
      toast.error("Failed to delete OS");
    }
  };

  // Filtering is done in loadOS
  const filteredOS = osList;

  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Operating Systems</h1>
            <p className="text-muted-foreground mt-2">Manage OS configurations</p>
          </div>
          <Button
            onClick={() => router.push("/admin/os/create")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create OS
          </Button>
        </div>

        <div className="border border-border rounded-xl bg-muted p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search OS..."
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
                {filteredOS.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No OS found</p>
                  </div>
                ) : (
                  filteredOS.map((os) => (
                    <div
                      key={os.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border hover:border-blue-500 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            {os.name}
                            {typeof os.appsCount === "number" && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                {os.appsCount} apps
                              </span>
                            )}
                          </h3>
                          {!os.isActive && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                              Inactive
                            </span>
                          )}
                          {os.isActive && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        {os.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {os.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/os/${os.id}/apps`)}
                          title="Manage Apps"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30"
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/os/${os.id}/edit`)}
                          title="Edit OS"
                          className="text-muted-foreground hover:text-accent-foreground hover:bg-accent border border-transparent hover:border-border"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(os.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                          title="Delete OS"
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
