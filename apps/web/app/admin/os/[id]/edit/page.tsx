"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { osService } from "@/lib/services/os";
import { toast } from "sonner";
import { Loader2, Layers } from "lucide-react";

export default function EditOSPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    isActive: true,
  });

  useEffect(() => {
    loadOS();
  }, [id]);

  const loadOS = async () => {
    try {
      setLoadingData(true);
      const os = await osService.getOSById(id);
      setFormData({
        name: os.name,
        description: os.description || "",
        icon: os.icon || "",
        isActive: os.isActive,
      });
    } catch (error: any) {
      console.error("Failed to load OS:", error);
      toast.error(error.message || "Failed to load OS");
      router.push("/admin/os");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await osService.updateOS(id, {
        name: formData.name,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        isActive: formData.isActive,
      });
      toast.success("OS updated successfully");
      router.push("/admin/os");
    } catch (error: any) {
      console.error("Failed to update OS:", error);
      toast.error(error.message || "Failed to update OS");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-black p-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Edit OS</h1>
              <p className="text-slate-400 mt-2">Update OS configuration</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/os/${id}/apps`)}
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <Layers className="h-4 w-4 mr-2" />
              Manage Apps
            </Button>
          </div>
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
                  Updating...
                </>
              ) : (
                "Update OS"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
