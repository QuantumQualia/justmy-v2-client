"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
      toast.success("Page created");
      router.push(`/admin/cms/pages/${page.id}/edit`);
    } catch (error) {
      console.error("Failed to create page:", error);
      toast.error("Failed to create page");
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
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Page</h1>
            <p className="text-muted-foreground">Create a new dynamic page</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Basic Information</CardTitle>
              <CardDescription className="text-muted-foreground">
                Title, handle, and options for your page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-muted-foreground">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  onBlur={() => {
                    setFormData({
                      ...formData,
                      handle: formData.handle || generateHandle(formData.title),
                    });
                  }}
                  placeholder="My Page Title"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle" className="text-muted-foreground">
                  Handle (URL) *
                </Label>
                <Input
                  id="handle"
                  value={formData.handle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  placeholder="my-page"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (e.g., &quot;my-page&quot; becomes /my-page)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentHandle" className="text-muted-foreground">
                  Parent Handle (optional)
                </Label>
                <Input
                  id="parentHandle"
                  value={formData.parentHandle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentHandle: e.target.value })
                  }
                  placeholder="parent-page"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  For nested routes (e.g., /parent-page/my-page)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Page description..."
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublished: checked })
                  }
                />
                <Label
                  htmlFor="isPublished"
                  className="text-muted-foreground cursor-pointer font-normal"
                >
                  Publish immediately
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="requiresAuth"
                  checked={formData.requiresAuth ?? false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresAuth: checked })
                  }
                />
                <Label
                  htmlFor="requiresAuth"
                  className="text-muted-foreground cursor-pointer font-normal"
                >
                  Requires Authentication
                </Label>
              </div>
            </CardContent>
          </Card>

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
