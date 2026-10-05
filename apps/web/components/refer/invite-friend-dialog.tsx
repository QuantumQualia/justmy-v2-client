"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

import { ApiClientError } from "@/lib/api-client";
import { referralsService } from "@/lib/services/referrals";

export function InviteFriendDialog({
  open,
  onOpenChange,
  profileId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: number | undefined;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!profileId || busy) return;
    setBusy(true);
    try {
      const result = await referralsService.inviteFriend(profileId, email.trim());
      toast.success(
        result.remainingToday > 0
          ? `Invite sent to ${email.trim()}. You can send ${result.remainingToday} more today.`
          : `Invite sent to ${email.trim()}. That's today's last invite.`
      );
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Could not send that invite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email a friend</DialogTitle>
          <DialogDescription>
            We&apos;ll send them a personal invite from you with your link. They can unsubscribe any time.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="invite-friend-email">Friend&apos;s email</Label>
            <Input
              id="invite-friend-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="friend@example.com"
              required
            />
          </div>
          <Button type="submit" disabled={busy || !profileId} className="w-full">
            {busy ? "Sending…" : "Send invite"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
