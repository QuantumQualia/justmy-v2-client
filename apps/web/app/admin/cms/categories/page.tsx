"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { contentService } from "@/lib/services/content";

type Row = { id: number; name: string; description?: string | null };

export default function CmsCategoriesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setRows(await contentService.listCategories());
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await contentService.createCategory({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      toast.success("Category created");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-background px-6 py-8 text-foreground md:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-2 text-muted-foreground">Names and descriptions used when filing posts.</p>
        </div>
        <div className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-card">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <Button onClick={create} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Add category"}
          </Button>
        </div>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-border p-4">
                <div className="font-medium">{row.name}</div>
                {row.description ? <p className="text-sm text-muted-foreground">{row.description}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
