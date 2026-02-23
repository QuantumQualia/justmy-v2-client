"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, Search, Loader2, Newspaper } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useRouter } from "next/navigation";

export default function CmsPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load posts from API
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Posts</h1>
            <p className="text-slate-400 mt-2">Manage blog posts and articles</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" disabled>
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
                disabled
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="text-center py-20">
              <Newspaper className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Posts Management</h3>
              <p className="text-slate-400 mb-6">This feature is coming soon</p>
              <p className="text-sm text-slate-500">
                Manage blog posts and articles through the NestJS backend
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
