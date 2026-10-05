"use client";

import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

import { BizOsCard, BizOsHeader, BizOsPage, BizOsSkeleton } from "@/components/biz-os/biz-os-ui";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import { PrizeCard } from "@/components/prize-closet/prize-card";
import { uploadBase64Image } from "@/lib/api-client";
import { currentOsLabel } from "@/lib/plan-features";
import { readFileAsDataUrl } from "@/lib/read-image-files";
import {
  formatPrizeDates,
  prizeClosetService,
  type PrizeContext,
  type PrizeScope,
  type PrizeSubmission,
} from "@/lib/services/prize-closet";

const FULFILLMENT_METHODS = [
  "Winner picks up in-store",
  "Shipped to the winner",
  "Digital code or gift card by email",
  "Scheduled appointment or service",
];

const ACKNOWLEDGMENTS = [
  "I will honor the prize as described.",
  "I am responsible for fulfilling the prize directly to the winner.",
  "The value is accurate for tax reporting.",
  "I agree to the Official Rules.",
];

type FormState = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  category: string;
  retailValue: string;
  winners: string;
  requestedStart: string;
  requestedEnd: string;
  scope: PrizeScope;
  partnerNotes: string;
  fulfillmentMethod: string;
  redemptionDays: string;
  fulfillmentInstructions: string;
  restrictions: string;
};

const BLANK: FormState = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  description: "",
  category: "",
  retailValue: "",
  winners: "1",
  requestedStart: "",
  requestedEnd: "",
  scope: "LOCAL",
  partnerNotes: "",
  fulfillmentMethod: FULFILLMENT_METHODS[0]!,
  redemptionDays: "60",
  fulfillmentInstructions: "",
  restrictions: "",
};

type Loaded = { context: PrizeContext | null; previous: PrizeSubmission[] };
const EMPTY: Loaded = { context: null, previous: [] };

export default function NewPrizePage() {
  return (
    <Suspense fallback={<BizOsSkeleton lines={6} />}>
      <NewPrizeForm />
    </Suspense>
  );
}

function fromSubmission(s: PrizeSubmission): FormState {
  const day = (v: string | null) => (v ? v.slice(0, 10) : "");
  return {
    contactName: s.contactName,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone ?? "",
    description: s.description,
    category: s.category ?? "",
    retailValue: String(s.retailValue),
    winners: String(s.winners),
    requestedStart: day(s.requestedStart),
    requestedEnd: day(s.requestedEnd),
    scope: s.scope,
    partnerNotes: s.partnerNotes ?? "",
    fulfillmentMethod: s.fulfillmentMethod,
    redemptionDays: s.redemptionDays != null ? String(s.redemptionDays) : "",
    fulfillmentInstructions: s.fulfillmentInstructions ?? "",
    restrictions: s.restrictions ?? "",
  };
}

function NewPrizeForm() {
  const router = useRouter();
  const fromId = Number(useSearchParams().get("from")) || null;
  const { data, pageReady, profileId, me } = useBizOsFetch<Loaded>(
    async (id) => {
      const [context, previous] = await Promise.all([
        prizeClosetService.context(id),
        fromId ? prizeClosetService.mine(id) : Promise.resolve([]),
      ]);
      return { context, previous };
    },
    EMPTY,
    fromId ?? undefined
  );

  const [form, setForm] = useState<FormState>(BLANK);
  const [acks, setAcks] = useState<boolean[]>(ACKNOWLEDGMENTS.map(() => false));
  const [image, setImage] = useState<{ key: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!pageReady) return;
    const previous = fromId ? data.previous.find((s) => s.id === fromId) : undefined;
    if (previous) {
      setForm(fromSubmission(previous));
      return;
    }
    if (data.context) {
      const { contactName, contactEmail, contactPhone } = data.context;
      setForm((f) => ({
        ...f,
        contactName: f.contactName || contactName,
        contactEmail: f.contactEmail || contactEmail,
        contactPhone: f.contactPhone || contactPhone || "",
      }));
    }
  }, [pageReady, data, fromId]);

  if (!pageReady) return <BizOsSkeleton lines={6} />;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const business = data.context?.businessName ?? "Your business";
  const market = data.context?.marketName ?? "Your market";
  const value = Number(form.retailValue) || 0;
  const winners = Math.max(1, Number(form.winners) || 1);
  const ready =
    form.contactName.trim() &&
    form.contactEmail.trim() &&
    form.description.trim().length >= 10 &&
    value > 0 &&
    (form.scope !== "PARTNER" || form.partnerNotes.trim()) &&
    acks.every(Boolean);

  async function onImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await readFileAsDataUrl(file);
      const res = await uploadBase64Image(base64);
      setImage({ key: res.key, preview: base64 });
    } catch {
      toast.error("That photo didn't upload. Try a smaller JPG or PNG.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profileId || !ready) return;
    setSubmitting(true);
    try {
      await prizeClosetService.submit(profileId, {
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        description: form.description.trim(),
        category: form.category.trim() || undefined,
        retailValue: value,
        winners,
        requestedStart: form.requestedStart || undefined,
        requestedEnd: form.requestedEnd || undefined,
        scope: form.scope,
        partnerNotes: form.scope === "PARTNER" ? form.partnerNotes.trim() : undefined,
        fulfillmentMethod: form.fulfillmentMethod,
        redemptionDays: Number(form.redemptionDays) || undefined,
        fulfillmentInstructions: form.fulfillmentInstructions.trim() || undefined,
        restrictions: form.restrictions.trim() || undefined,
        imageKey: image?.key,
      });
      toast.success("Prize submitted. Sky drafted your public card and JustMy will review it shortly.");
      router.push("/biz-os/prize-closet");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your prize.");
      setSubmitting(false);
    }
  }

  const redeemPreview = [
    form.fulfillmentMethod,
    form.fulfillmentInstructions.trim(),
    form.redemptionDays ? `within ${form.redemptionDays} days of winning` : "",
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="BIZ OS · SUBMIT A PRIZE"
        title="From form to published prize card."
        description="Tell us about the prize. When you submit, AskSKY! turns your notes into the polished card that goes live on The Prize Closet."
        back={{ href: "/biz-os/prize-closet", label: "Prize Closet" }}
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <FormGroup title="Business & Eligibility">
            <ReadOnly label="Business" value={business} />
            <ReadOnly label="Market" value={market} />
            <ReadOnly label="Plan" value={currentOsLabel(me?.osName || me?.profileType)} />
          </FormGroup>

          <FormGroup title="Prize Contact">
            <Field label="Name" id="contactName">
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                required
              />
            </Field>
            <Field label="Email" id="contactEmail">
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                required
              />
            </Field>
            <Field label="Phone" id="contactPhone">
              <Input
                id="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
            </Field>
          </FormGroup>

          <FormGroup title="Prize Details">
            <Field label="Prize description" id="description" wide hint="Write it however you'd say it — Sky polishes it.">
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="We want to give away a free bike tune-up plus $100 to spend on gear in our shop…"
                required
              />
            </Field>
            <Field label="Category" id="category">
              <Input
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Service + Gift Card Bundle"
              />
            </Field>
            <Field label="Approx. retail value ($)" id="retailValue">
              <Input
                id="retailValue"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.retailValue}
                onChange={(e) => set("retailValue", e.target.value)}
                required
              />
            </Field>
            <Field label="Number of winners" id="winners">
              <Input
                id="winners"
                type="number"
                min={1}
                max={50}
                value={form.winners}
                onChange={(e) => set("winners", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Prize photo (4:3)
              </Label>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 justmy-corners-lg border border-dashed border-primary/30 bg-card px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-secondary",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                <ImagePlus className="size-5 text-primary" aria-hidden />
                <span>{uploading ? "Uploading…" : image ? "Replace photo" : "Upload a photo of the prize"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onImage(e.target.files?.[0])}
                />
              </label>
            </div>
          </FormGroup>

          <FormGroup title="Run Dates & Scope">
            <Field label="Preferred start" id="requestedStart">
              <Input
                id="requestedStart"
                type="date"
                value={form.requestedStart}
                onChange={(e) => set("requestedStart", e.target.value)}
              />
            </Field>
            <Field label="Preferred end" id="requestedEnd">
              <Input
                id="requestedEnd"
                type="date"
                min={form.requestedStart || undefined}
                value={form.requestedEnd}
                onChange={(e) => set("requestedEnd", e.target.value)}
              />
            </Field>
            <Field label="Scope" id="scope">
              <Select value={form.scope} onValueChange={(v) => set("scope", v as PrizeScope)}>
                <SelectTrigger id="scope" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Local ({market} only)</SelectItem>
                  <SelectItem value="NATIONAL">National (every market)</SelectItem>
                  <SelectItem value="PARTNER">Partner campaign</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.scope === "PARTNER" ? (
              <Field label="Partner & idea" id="partnerNotes" wide>
                <Textarea
                  id="partnerNotes"
                  rows={2}
                  value={form.partnerNotes}
                  onChange={(e) => set("partnerNotes", e.target.value)}
                  placeholder="Who you're partnering with and the promotion idea"
                  required
                />
              </Field>
            ) : null}
            <p className="text-xs text-muted-foreground sm:col-span-2">
              JustMy confirms the final schedule based on what&apos;s already on the calendar.
            </p>
          </FormGroup>

          <FormGroup title="Redemption & Fulfillment">
            <Field label="Fulfillment method" id="fulfillmentMethod">
              <Select value={form.fulfillmentMethod} onValueChange={(v) => set("fulfillmentMethod", v)}>
                <SelectTrigger id="fulfillmentMethod" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Redemption deadline (days)" id="redemptionDays">
              <Input
                id="redemptionDays"
                type="number"
                min={1}
                value={form.redemptionDays}
                onChange={(e) => set("redemptionDays", e.target.value)}
              />
            </Field>
            <Field label="Fulfillment instructions" id="fulfillmentInstructions" wide>
              <Textarea
                id="fulfillmentInstructions"
                rows={2}
                value={form.fulfillmentInstructions}
                onChange={(e) => set("fulfillmentInstructions", e.target.value)}
                placeholder="Pick up any time Tue–Sat, 10am–6pm at 2140 Union Ave."
              />
            </Field>
            <Field label="Restrictions" id="restrictions" wide>
              <Input
                id="restrictions"
                value={form.restrictions}
                onChange={(e) => set("restrictions", e.target.value)}
                placeholder="Gear credit excludes sale items"
              />
            </Field>
          </FormGroup>

          <BizOsCard className="bg-secondary/50">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-primary">Acknowledgments</p>
            <div className="space-y-2.5">
              {ACKNOWLEDGMENTS.map((text, i) => (
                <label key={text} className="flex items-start gap-2.5 text-sm">
                  <Checkbox
                    checked={acks[i]}
                    onCheckedChange={(v) => setAcks((a) => a.map((x, j) => (j === i ? v === true : x)))}
                    className="mt-0.5"
                  />
                  {text}
                </label>
              ))}
            </div>
          </BizOsCard>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-brand-gradient text-primary-foreground"
            disabled={!ready || submitting}
          >
            {submitting ? "Submitting…" : "Submit Prize for Review"}
          </Button>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-xs font-extrabold text-primary-foreground">
            <Sparkles className="size-4" aria-hidden /> AskSKY! drafts the public prize card
          </p>
          <p className="text-sm text-muted-foreground">
            Live preview. Sky writes the final headline and blurb from your description when you submit.
          </p>
          <PrizeCard
            stacked
            business={business}
            title={form.description.trim() ? "Sky drafts your headline on submit." : "Your prize headline"}
            blurb={form.description.trim() || "Describe the prize and it shows up here."}
            imageUrl={image?.preview}
            period={formatPrizeDates(form.requestedStart || null, form.requestedEnd || null)}
            value={value ? `$${value.toLocaleString("en-US")}` : "$—"}
            market={form.scope === "NATIONAL" ? "All markets" : market}
            winners={winners}
            redeemNote={redeemPreview}
          />
        </aside>
      </form>
    </BizOsPage>
  );
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <BizOsCard className="bg-secondary/50">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-primary">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </BizOsCard>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="justmy-corners bg-card px-3.5 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function Field({
  label,
  id,
  wide,
  hint,
  children,
}: {
  label: string;
  id: string;
  wide?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", wide && "sm:col-span-2")}>
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
