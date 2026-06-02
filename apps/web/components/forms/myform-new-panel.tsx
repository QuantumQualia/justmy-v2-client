"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { formsService, DEFAULT_MYFORM_SCHEMA } from "@/lib/services/forms";
import { myFormListHref, myFormEditHref } from "@/components/forms/myform-routes";

export interface MyFormNewPanelProps {
  basePath: string;
}

export function MyFormNewPanel({ basePath }: MyFormNewPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("Name is required.");
      }
      return formsService.createProfileForm({
        name: trimmed,
        schema: DEFAULT_MYFORM_SCHEMA,
      });
    },
    onSuccess: async (form) => {
      await queryClient.invalidateQueries({ queryKey: ["profile-forms"] });
      toast.success("Form created");
      router.push(myFormEditHref(basePath, form.id));
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Create failed");
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10 text-white">
      <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
        <Link href={myFormListHref(basePath)}>← Back to forms</Link>
      </Button>
      <Card className="border-slate-800 bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">New form</CardTitle>
          <CardDescription className="text-slate-400">
            Creates a draft with a starter schema. You can edit JSON and publish next.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-name">Name</Label>
            <Input
              id="form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Contact us"
              className="border-slate-700 bg-slate-900 text-white"
            />
          </div>
          <Button
            type="button"
            variant="success"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create draft"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
