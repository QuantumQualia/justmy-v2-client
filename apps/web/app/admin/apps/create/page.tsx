"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { appsService } from "@/lib/services/apps";
import { osService } from "@/lib/services/os";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreateAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await appsService.createApp({
        name: formData.name,
        description: formData.description || undefined,
        isActive: formData.isActive,
      });
      
      toast.success("App created successfully");
      router.push("/admin/apps");
    } catch (error: any) {
      console.error("Failed to create app:", error);
      toast.error(error.message || "Failed to create app");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Create App</h1>
          <p className="text-slate-400 mt-2">Create a new application</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-slate-700 rounded-xl bg-slate-900/30 p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-black/50 border-slate-700 text-white"
                placeholder="e.g., myCITY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-black/50 border-slate-700 text-white"
                placeholder="App description..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <Label htmlFor="isActive" className="text-white cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create App"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
