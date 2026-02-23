"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cmsService } from "@/lib/services/cms";
import type { PayloadPage } from "@/lib/services/cms";
import { useRouter } from "next/navigation";

export default function CmsPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PayloadPage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  useEffect(() => {
    loadPages();
  }, [currentPage, search]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await cmsService.getAllPages({
        page: currentPage,
        limit,
        search: search || undefined,
      });
      setPages(response.docs || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error("Failed to load pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await cmsService.deletePage(id);
      loadPages();
    } catch (error) {
      console.error("Failed to delete page:", error);
      alert("Failed to delete page");
    }
  };

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(search.toLowerCase()) ||
      page.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">CMS Pages</h1>
            <p className="text-slate-400">Manage dynamic pages and content</p>
          </div>
          <Button
            onClick={() => router.push("/admin/cms/pages/create")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>

        <div className="border border-slate-700 rounded-xl bg-slate-900/30 p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages..."
                className="pl-10 bg-black/50 border-slate-700 text-white"
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
                {filteredPages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>No pages found</p>
                  </div>
                ) : (
                  filteredPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">
                            {page.title}
                          </h3>
                          <span className="text-xs text-slate-400">
                            /{page.parentHandle ? `${page.parentHandle}/` : ""}
                            {page.handle}
                          </span>
                          {!page.isPublished && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                              Draft
                            </span>
                          )}
                          {page.isPublished && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Published
                            </span>
                          )}
                        </div>
                        {page.description && (
                          <p className="text-sm text-slate-400 mt-1">
                            {page.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/${page.parentHandle || ""}${
                                page.parentHandle ? "/" : ""
                              }${page.handle}`,
                              "_blank"
                            )
                          }
                          title="View page"
                          className="text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/cms/pages/${page.id}/edit`)
                          }
                          title="Edit page"
                          className="text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(page.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                          title="Delete page"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-800">
                  <div className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
