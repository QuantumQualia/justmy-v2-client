"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import { referNewsstandBusiness, type ReferBusinessResult } from "@/lib/news/fetch-newsstand";
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

export function referBusinessMessage(result: ReferBusinessResult): string {
  switch (result.outcome) {
    case "live":
      return `Thanks! ${result.name} is already on JustMy — ${result.creditsAwarded} myCREDITS are yours.`;
    case "boost":
      return `You're not the only neighbor recommending ${result.name}. +${result.creditsAwarded} myCREDITS, and we'll nudge them to claim.`;
    case "already":
      return `You already recommended ${result.name}. We'll email you when they claim.`;
    default:
      return result.invited
        ? `${result.name} is on the map. ${result.creditsPending} myCREDITS are pending until they claim.`
        : `${result.name} is on the map. Claim link copied — send it their way. ${result.creditsPending} myCREDITS pending.`;
  }
}

type ReferBusinessFormProps = {
  marketId?: number;
  defaultZip?: string;
  defaultCity?: string;
  /** Ask for the ZIP when the page has no market context. */
  askZip?: boolean;
  submitLabel?: string;
  onDone?: (result: ReferBusinessResult) => void;
};

export function ReferBusinessForm({
  marketId,
  defaultZip,
  defaultCity,
  askZip = false,
  submitLabel = "Send claim invite",
  onDone,
}: ReferBusinessFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState(defaultZip ?? "");
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
        zipCode: (askZip ? zip : defaultZip) || undefined,
        city: defaultCity,
        marketId,
      });
      toast.success(referBusinessMessage(result));
      if (result.outcome === "created" && !result.invited && result.claimUrl) {
        await navigator.clipboard.writeText(result.claimUrl).catch(() => undefined);
      }
      setName("");
      setPhone("");
      setEmail("");
      onDone?.(result);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not refer that business.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="refer-business-name">Business name</Label>
        <Input
          id="refer-business-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Southern Grind Coffee"
          required
          minLength={2}
        />
      </div>
      <div className={askZip ? "grid gap-4 sm:grid-cols-2" : undefined}>
        <div className="space-y-2">
          <Label htmlFor="refer-business-phone">Phone</Label>
          <Input
            id="refer-business-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
          />
        </div>
        {askZip ? (
          <div className="space-y-2">
            <Label htmlFor="refer-business-zip">ZIP code</Label>
            <Input
              id="refer-business-zip"
              value={zip}
              onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              placeholder="38103"
            />
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="refer-business-email">Email for the claim invite</Label>
        <Input
          id="refer-business-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@business.com"
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full rounded-full">
        {busy ? "Checking…" : submitLabel}
      </Button>
    </form>
  );
}

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refer a business</DialogTitle>
          <DialogDescription>
            We&apos;ll open a free Biz OS card and send a claim invite. You earn 100 myCREDITS when they claim. If
            they&apos;re already on JustMy, you still earn 50.
          </DialogDescription>
        </DialogHeader>
        <ReferBusinessForm
          marketId={marketId}
          defaultZip={defaultZip}
          defaultCity={defaultCity}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
