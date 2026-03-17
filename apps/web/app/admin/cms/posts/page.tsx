"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cmsService } from "@/lib/services/cms";
import type { PayloadPost } from "@/lib/services/cms";
import { useRouter } from "next/navigation";

export default function CmsPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PayloadPost[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${currentPage}:${search}`;
    if (loadedForRef.current === key) return;
    loadedForRef.current = key;
    loadPosts();
  }, [currentPage, search]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await cmsService.getAllPosts({
        page: currentPage,
        limit,
        search: search || undefined,
      });
      setPosts(response.docs || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await cmsService.deletePost(id);
      toast.success("Post deleted");
      loadPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Posts</h1>
            <p className="text-slate-400 mt-2">Manage blog posts and articles</p>
          </div>
          <Button
            onClick={() => router.push("/admin/cms/posts/create")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        <div className="border border-slate-700 rounded-xl bg-slate-900/30 p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
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
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>No posts found</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{post.title}</h3>
                          <span className="text-xs text-slate-400">/{post.slug}</span>
                          {!post.isPublished && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                              Draft
                            </span>
                          )}
                          {post.isPublished && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Published
                            </span>
                          )}
                        </div>
                        {(post.excerpt || post.tags?.length) && (
                          <p className="text-sm text-slate-400 mt-1">
                            {[post.excerpt, post.tags?.length ? post.tags.join(", ") : ""]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          title="View post"
                          className="text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/cms/posts/${post.id}/edit`)}
                          title="Edit post"
                          className="text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
