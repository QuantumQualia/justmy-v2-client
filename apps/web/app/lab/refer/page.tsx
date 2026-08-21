"use client";

import { ReferAFriend } from "@/components/common/refer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export default function ReferPage() {
  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="w-full max-w-2xl mx-auto pt-8">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent -ml-2 mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Refer a Friend</h1>
        <ReferAFriend />
      </div>
    </div>
  );
}
