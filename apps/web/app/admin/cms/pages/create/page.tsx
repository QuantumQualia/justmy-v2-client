"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cmsService } from "@/lib/services/cms";
import { CreatePageDto } from "@/lib/services/cms";

export default function CreatePagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePageDto>({
    title: "",
    handle: "",
    parentHandle: "",
    description: "",
    isPublished: false,
    requiresAuth: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const page = await cmsService.createPage(formData);
      router.push(`/admin/cms/pages/${page.id}/edit`);
    } catch (error) {
      console.error("Failed to create page:", error);
      alert("Failed to create page");
    } finally {
      setLoading(false);
    }
  };

  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Page</h1>
            <p className="text-slate-400">Create a new dynamic page</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      ...formData,
                      title,
                      handle: formData.handle || generateHandle(title),
                    });
                  }}
                  placeholder="My Page Title"
                  className="bg-black/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Handle (URL) *
                </label>
                <Input
                  value={formData.handle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  placeholder="my-page"
                  className="bg-black/50 border-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  URL-friendly identifier (e.g., "my-page" becomes /my-page)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Parent Handle (optional)
                </label>
                <Input
                  value={formData.parentHandle || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentHandle: e.target.value,
                    })
                  }
                  placeholder="parent-page"
                  className="bg-black/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  For nested routes (e.g., "parent-page" makes URL: /parent-page/my-page)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Page description..."
                  className="w-full min-h-[100px] bg-black/50 border border-slate-700 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPublished: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-700 bg-black/50"
                />
                <label
                  htmlFor="isPublished"
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  Publish immediately
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresAuth"
                  checked={formData.requiresAuth || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresAuth: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-700 bg-black/50"
                />
                <label
                  htmlFor="requiresAuth"
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  Requires Authentication
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.handle}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Page"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
