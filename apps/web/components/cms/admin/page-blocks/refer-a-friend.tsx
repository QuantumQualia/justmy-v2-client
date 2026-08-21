"use client";

import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import type { PageBlock } from "@/lib/services/cms";

interface ReferAFriendBlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function ReferAFriendBlockEditor({ block, onUpdate }: ReferAFriendBlockEditorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Renders the Refer-a-Friend component with the user's referral code, a shareable registration link,
            and a table of people who signed up using their code.
          </p>
          <p className="text-xs text-muted-foreground">
            No configuration needed. Data is pulled automatically from the user's profile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
