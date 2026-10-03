"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import { referNewsstandBusiness } from "@/lib/news/fetch-newsstand";
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

type ReferBusinessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId?: number;
  defaultZip?: string;
  defaultCity?: string;
};

export function ReferBusinessDialog({
  open,
  onOpenChange,
  marketId,
  defaultZip,
  defaultCity,
}: ReferBusinessDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await referNewsstandBusiness({
        name,
        phone,
        email,
        zipCode: defaultZip,
        city: defaultCity,
        marketId,
      });
      if (result.status === "exists") {
        toast.success(`${result.name} already has a Dot. No duplicate card was created.`);
      } else if (result.invited) {
        toast.success(`Claim invite sent for ${result.name}.`);
      } else if (result.claimUrl) {
        await navigator.clipboard.writeText(result.claimUrl).catch(() => undefined);
        toast.success(`Created a Dot for ${result.name}. Claim link copied.`);
      } else {
        toast.success(`Created a Dot for ${result.name}.`);
      }
      setName("");
      setPhone("");
      setEmail("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not refer that business.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refer a business</DialogTitle>
          <DialogDescription>
            We&apos;ll open a free Biz OS card and send a claim invite. If that business is already on JustMy, we won&apos;t create a second card.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="refer-business-name">Business name</Label>
            <Input
              id="refer-business-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refer-business-phone">Phone</Label>
            <Input
              id="refer-business-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refer-business-email">Email for the claim invite</Label>
            <Input
              id="refer-business-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Checking…" : "Send claim invite"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
