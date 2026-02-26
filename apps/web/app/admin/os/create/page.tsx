"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { osService } from "@/lib/services/os";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import debounce from "lodash/debounce";

export default function CreateOSPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    isActive: true,
  });

  const handleSubmit = debounce(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await osService.createOS({
        name: formData.name,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        isActive: formData.isActive,
      });
      toast.success("OS created successfully");
      router.push("/admin/os");
    } catch (error: any) {
      console.error("Failed to create OS:", error);
      toast.error(error.message || "Failed to create OS");
    } finally {
      setLoading(false);
    }
  }, 750);

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Create OS</h1>
          <p className="text-slate-400 mt-2">Create a new operating system</p>
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
                placeholder="e.g., Personal OS"
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
                placeholder="OS description..."
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
              <Label
                htmlFor="isActive"
                className="text-white cursor-pointer"
              >
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
                "Create OS"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
