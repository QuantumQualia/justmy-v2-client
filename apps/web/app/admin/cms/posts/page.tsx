"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cmsService } from "@/lib/services/cms";
import type { PayloadPost } from "@/lib/services/cms";
import { contentService, type ContentTypeDto } from "@/lib/services/content";
import { marketsService } from "@/lib/services/markets";
import { legacyPlainText } from "@/lib/legacy-html";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  publish: "Published",
  archive: "Archived",
  trash: "Trash",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  publish: "bg-secondary text-foreground",
  archive: "bg-muted text-muted-foreground",
  trash: "bg-destructive/15 text-destructive",
};

export default function CmsPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PayloadPost[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [status, setStatus] = useState("");
  const [newsstand, setNewsstand] = useState("");
  const [application, setApplication] = useState("");
  const [contentTypeId, setContentTypeId] = useState("");
  const [postType, setPostType] = useState("");
  const [marketId, setMarketId] = useState("");
  const [contentTypes, setContentTypes] = useState<ContentTypeDto[]>([]);
  const [markets, setMarkets] = useState<Array<{ id: number; name: string }>>([]);
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    contentService.listContentTypes().then(setContentTypes).catch(() => setContentTypes([]));
    marketsService
      .getMarkets({ limit: 200, page: 1 })
      .then((page) => setMarkets((page?.data ?? []).map((market) => ({ id: market.id, name: market.name }))))
      .catch(() => setMarkets([]));
  }, []);

  useEffect(() => {
    const key = `${currentPage}:${search}:${status}:${newsstand}:${application}:${contentTypeId}:${postType}:${marketId}`;
    if (loadedForRef.current === key) return;
    loadedForRef.current = key;
    loadPosts();
  }, [currentPage, search, status, newsstand, application, contentTypeId, postType, marketId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await cmsService.getAllPosts({
        page: currentPage,
        limit,
        search: search || undefined,
        status: status || undefined,
        newsstand: newsstand || undefined,
        type: postType || undefined,
        application: application || undefined,
        contentTypeId: contentTypeId ? Number(contentTypeId) : undefined,
        marketId: marketId ? Number(marketId) : undefined,
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
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Posts</h1>
            <p className="text-muted-foreground mt-2">Manage blog posts and articles</p>
          </div>
          <Button
            onClick={() => router.push("/admin/cms/posts/create")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        <div className="border border-border rounded-xl bg-muted p-6">
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Search posts..."
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={status} onChange={(e) => { setCurrentPage(1); setStatus(e.target.value); }}>
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="publish">Publish</option>
                <option value="archive">Archive</option>
                <option value="trash">Trash</option>
              </select>
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={newsstand} onChange={(e) => { setCurrentPage(1); setNewsstand(e.target.value); }}>
                <option value="">All newsstand</option>
                <option value="pending">Newsstand requests</option>
                <option value="published">On newsstand</option>
              </select>
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={application} onChange={(e) => { setCurrentPage(1); setApplication(e.target.value); }}>
                <option value="">All hubs</option>
                <option value="CONTENT_HUB">Content hub</option>
                <option value="INFO_HUB">Info hub</option>
              </select>
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={contentTypeId} onChange={(e) => { setCurrentPage(1); setContentTypeId(e.target.value); }}>
                <option value="">All content types</option>
                {contentTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={postType} onChange={(e) => { setCurrentPage(1); setPostType(e.target.value); }}>
                <option value="">Articles and shared</option>
                <option value="ARTICLE">Article</option>
                <option value="SHARED">Shared</option>
              </select>
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={marketId} onChange={(e) => { setCurrentPage(1); setMarketId(e.target.value); }}>
                <option value="">All markets</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>{market.name}</option>
                ))}
              </select>
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
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No posts found</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border hover:border-blue-500 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{post.title}</h3>
                          <span className="text-xs text-muted-foreground">/{post.slug}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${STATUS_BADGE_CLASSES[post.status ?? "draft"]}`}
                          >
                            {STATUS_LABELS[post.status ?? "draft"]}
                          </span>
                        </div>
                        {(post.excerpt || post.tags?.length) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {[legacyPlainText(post.excerpt), post.tags?.length ? post.tags.join(", ") : ""]
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
                          className="text-muted-foreground hover:text-accent-foreground hover:bg-accent border border-transparent hover:border-border"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/cms/posts/${post.id}/edit`)}
                          title="Edit post"
                          className="text-muted-foreground hover:text-accent-foreground hover:bg-accent border border-transparent hover:border-border"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="text-destructive hover:text-red-300 hover:bg-destructive/10 border border-transparent hover:border-red-500/30"
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
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                  <div className="text-sm text-muted-foreground">
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
