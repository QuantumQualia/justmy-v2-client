"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Star, X } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { bizOsService } from "@/lib/services/biz-os";
import { persistClaimSession } from "@/lib/services/auth";
import { bizOsHref } from "@/lib/biz-os/landing";
import { preloadOauthProviders, requestGoogleIdToken } from "@/lib/auth/oauth-providers";
import { ApiClientError } from "@/lib/api-client";

type Step = "form" | "scanning" | "listing" | "chips" | "account";

const CHIP_TARGET = 3;

type ClaimListing = {
  placeId: string;
  name?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
};

function listingsFromLookup(result: {
  listings?: ClaimListing[] | null;
  placeId: string | null;
  businessName?: string;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
}): ClaimListing[] {
  if (Array.isArray(result.listings) && result.listings.length) {
    return result.listings.filter((item) => item?.placeId);
  }
  if (!result.placeId) return [];
  return [
    {
      placeId: result.placeId,
      name: result.businessName,
      address: result.address || undefined,
      rating: result.rating ?? undefined,
      reviewCount: result.reviewCount ?? undefined,
    },
  ];
}

const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-200/70 dark:bg-white dark:text-slate-900 dark:placeholder:text-slate-400 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#fff]";

const aiButtonClass =
  "inline-flex h-11 w-full min-w-0 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-400 px-4 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex h-11 min-h-11 w-full min-w-0 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60";

export function DotClaimModal({
  open,
  onOpenChange,
  defaultZip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultZip?: string;
}) {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [zipCode, setZipCode] = useState(defaultZip || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [listings, setListings] = useState<ClaimListing[]>([]);
  const [scannedName, setScannedName] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [googleAddress, setGoogleAddress] = useState<string | null>(null);
  const [googleRating, setGoogleRating] = useState<number | null>(null);
  const [googleReviewCount, setGoogleReviewCount] = useState<number | null>(null);
  const [listingNote, setListingNote] = useState("");
  const [refreshingChips, setRefreshingChips] = useState(false);

  useEffect(() => {
    if (defaultZip) setZipCode(defaultZip);
  }, [defaultZip]);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setError("");
    setLoading(false);
    setEmailOpen(false);
    setListings([]);
    setScannedName("");
    setPlaceId(null);
    setGoogleAddress(null);
    setGoogleRating(null);
    setGoogleReviewCount(null);
    setListingNote("");
    setRefreshingChips(false);
    void preloadOauthProviders();
  }, [open]);

  async function runLookup() {
    setError("");
    setLoading(true);
    setStep("scanning");
    const typedName = businessName.trim();
    setScannedName(typedName);
    try {
      const result = await bizOsService.lookup(typedName, zipCode);
      setCategories(result.categories);
      setSelected(result.categories.slice(0, CHIP_TARGET));
      const nextListings = listingsFromLookup(result);
      setListings(nextListings);
      setPlaceId(null);
      setGoogleAddress(null);
      setGoogleRating(null);
      setGoogleReviewCount(null);
      if (nextListings.length) {
        setListingNote("");
        setStep("listing");
      } else {
        setListingNote("We couldn’t find a Google listing for that name. You can connect reviews later.");
        setStep("chips");
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Lookup failed.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  async function finishEmail() {
    setError("");
    setLoading(true);
    try {
      const response = await bizOsService.claimEmail({
        email,
        password,
        businessName,
        zipCode,
        phone,
        selectedCategories: selected,
        googlePlaceId: placeId || undefined,
        googleAddress: googleAddress || undefined,
        googleRating: googleRating ?? undefined,
        googleReviewCount: googleReviewCount ?? undefined,
      });
      await persistClaimSession(response);
      onOpenChange(false);
      window.location.assign(bizOsHref("/verify-email?redirect=/biz-os"));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  async function finishGoogle() {
    setError("");
    setLoading(true);
    try {
      const idToken = await requestGoogleIdToken();
      const response = await bizOsService.claimGoogle({
        idToken,
        businessName,
        zipCode,
        phone,
        selectedCategories: selected,
        googlePlaceId: placeId || undefined,
        googleAddress: googleAddress || undefined,
        googleRating: googleRating ?? undefined,
        googleReviewCount: googleReviewCount ?? undefined,
      });
      await persistClaimSession(response);
      onOpenChange(false);
      window.location.assign(bizOsHref("/biz-os/onboard"));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  function confirmListing(listing: ClaimListing) {
    setPlaceId(listing.placeId);
    setGoogleAddress(listing.address?.trim() || null);
    setGoogleRating(typeof listing.rating === "number" ? listing.rating : null);
    setGoogleReviewCount(typeof listing.reviewCount === "number" ? listing.reviewCount : null);
    if (listing.name?.trim()) setBusinessName(listing.name.trim());
    setListingNote("");
    setError("");
    setStep("chips");
  }

  function skipListing() {
    setPlaceId(null);
    setGoogleAddress(null);
    setGoogleRating(null);
    setGoogleReviewCount(null);
    if (scannedName) setBusinessName(scannedName);
    setListingNote("No Google listing connected yet. You can attach reviews later in Reputation.");
    setError("");
    setStep("chips");
  }

  async function refreshCategories() {
    const needed = Math.max(0, CHIP_TARGET - selected.length);
    if (!needed) return;
    setError("");
    setRefreshingChips(true);
    try {
      const result = await bizOsService.claimCategories({
        businessName: scannedName || businessName,
        zipCode,
        address: listings.find((item) => item.placeId === placeId)?.address,
        exclude: categories,
        count: needed,
      });
      const seen = new Set(categories.map((item) => item.toLowerCase()));
      const next = (Array.isArray(result.categories) ? result.categories : [])
        .map((item) => item.trim())
        .filter((item) => item && !seen.has(item.toLowerCase()))
        .slice(0, needed);
      if (!next.length) {
        setError("Couldn’t suggest more categories. Try Adjust again.");
        return;
      }
      setCategories((prev) => [...prev, ...next]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn’t suggest more categories. Try again.");
    } finally {
      setRefreshingChips(false);
    }
  }

  function toggleCategory(chip: string) {
    setSelected((prev) => {
      if (prev.includes(chip)) return prev.filter((item) => item !== chip);
      if (prev.length >= CHIP_TARGET) return prev;
      return [...prev, chip];
    });
  }

  const chipRow = useMemo(
    () =>
      categories.map((c) => {
        const on = selected.includes(c);
        return (
          <button
            key={c}
            type="button"
            aria-pressed={on}
            onClick={() => toggleCategory(c)}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-3 py-1.5 text-left text-xs font-medium break-words transition sm:text-sm ${
              on
                ? "border-violet-600 bg-violet-600 text-white shadow-sm ring-2 ring-violet-600/30 ring-offset-2 ring-offset-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
            }`}
          >
            {on ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {c}
          </button>
        );
      }),
    [categories, selected],
  );

  const chipsNeeded = Math.max(0, CHIP_TARGET - selected.length);
  const chipsReady = selected.length >= CHIP_TARGET;

  const title =
    step === "scanning"
      ? "Finding your Google listing…"
      : step === "listing"
        ? listings.length > 1
          ? "Which Google listing is yours?"
          : "Is this your Google listing?"
        : step === "chips"
          ? "Pick 3 categories"
          : step === "account"
            ? "Create your Biz OS account"
            : "Claim your free Dot Hub";

  const description =
    step === "scanning"
      ? "We’ll show matches so you can confirm it’s really yours."
      : step === "listing"
        ? "Confirm before we attach reviews. Skip if none match — you can connect later."
        : step === "chips"
          ? selected.length >= CHIP_TARGET
            ? "Looks good. Continue, or tap a chip to swap one out."
            : `Keep the ones you like (${selected.length} of ${CHIP_TARGET}). Adjust fills the rest.`
          : step === "account"
            ? "Continue with Google, or create with email."
            : "30 seconds. AskSKY finds your listing, then you confirm it’s yours.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        className="light inset-x-3 top-auto bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 flex max-h-[min(90dvh,44rem)] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-4 text-slate-900 shadow-xl sm:inset-auto sm:top-[50%] sm:left-[50%] sm:bottom-auto sm:w-[min(100%-1.5rem,28rem)] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6"
      >
        <DialogClose asChild>
          <button
            type="button"
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </DialogClose>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-5 pb-4">
            <DialogHeader className="gap-1.5 pr-8 text-center sm:text-center">
              <DialogTitle className="text-xl font-bold tracking-tight text-balance text-slate-900 sm:text-2xl">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-pretty text-slate-500">
                {description}
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {step === "form" ? (
              <form
                className="space-y-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runLookup();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="claim-business-name" className="text-slate-700">
                    Business name
                  </Label>
                  <Input
                    id="claim-business-name"
                    required
                    autoComplete="organization"
                    placeholder="e.g. Joe's Pizza"
                    className={inputClass}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="claim-zip"
                    className="flex items-center gap-1.5 text-slate-700"
                  >
                    <MapPin className="h-3 w-3 text-violet-500" aria-hidden />
                    Zip code
                  </Label>
                  <Input
                    id="claim-zip"
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="e.g. 38103"
                    className={inputClass}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/[^\d-]/g, ""))}
                  />
                  <p className="text-[11px] text-slate-400">
                    We use this to connect you to your local Market.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="claim-phone" className="text-slate-700">
                    Phone
                  </Label>
                  <Input
                    id="claim-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Optional"
                    className={inputClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className={aiButtonClass} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    "AskSKY, scan this business"
                  )}
                </button>
              </form>
            ) : null}

            {step === "scanning" ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
                <p className="text-sm text-slate-500">Matching Google listings near {zipCode}</p>
              </div>
            ) : null}

            {step === "listing" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {listings.map((listing) => {
                    const rating =
                      typeof listing.rating === "number" && Number.isFinite(listing.rating)
                        ? listing.rating
                        : null;
                    return (
                      <div
                        key={listing.placeId}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                      >
                        <p className="font-semibold text-slate-900">
                          {listing.name || "Google listing"}
                        </p>
                        {listing.address ? (
                          <p className="mt-0.5 text-sm leading-snug text-slate-500">
                            {listing.address}
                          </p>
                        ) : null}
                        {rating != null || listing.reviewCount ? (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {rating != null ? rating.toFixed(1) : "—"}
                            <span>· {listing.reviewCount || 0} reviews</span>
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className={`${aiButtonClass} mt-3 h-10`}
                          onClick={() => confirmListing(listing)}
                        >
                          This is my business
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button type="button" className={secondaryButtonClass} onClick={skipListing}>
                  None of these — skip for now
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center text-sm font-medium text-slate-500 transition hover:text-slate-800"
                  onClick={() => setStep("form")}
                >
                  Search again
                </button>
              </div>
            ) : null}

            {step === "chips" ? (
              <div className="space-y-4">
                {placeId ? (
                  <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs leading-relaxed text-teal-800">
                    Google listing connected{businessName ? `: ${businessName}` : ""}.
                    {googleAddress ? ` Address: ${googleAddress}.` : ""} Reviews will attach to this Dot.
                  </p>
                ) : listingNote ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                    {listingNote}
                  </p>
                ) : null}
                <div className="flex max-w-full flex-wrap justify-center gap-x-3 gap-y-3">
                  {chipRow}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(7.5rem,1fr)_minmax(0,1.75fr)]">
                  <button
                    type="button"
                    className={`${secondaryButtonClass} order-2 sm:order-1`}
                    disabled={refreshingChips || !chipsNeeded}
                    onClick={() => void refreshCategories()}
                  >
                    {refreshingChips ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : chipsNeeded === 1 ? (
                      "Adjust · 1 more"
                    ) : chipsNeeded ? (
                      `Adjust · ${chipsNeeded} more`
                    ) : (
                      "Adjust"
                    )}
                  </button>
                  <button
                    type="button"
                    className={`${aiButtonClass} order-1 sm:order-2`}
                    disabled={refreshingChips || !chipsReady}
                    onClick={() => setStep("account")}
                  >
                    Looks spot on
                  </button>
                </div>
                {listings.length ? (
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center text-sm font-medium text-slate-500 transition hover:text-slate-800"
                    onClick={() => setStep("listing")}
                  >
                    Change Google listing
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center text-sm font-medium text-slate-500 transition hover:text-slate-800"
                    onClick={() => setStep("form")}
                  >
                    Edit name or ZIP
                  </button>
                )}
              </div>
            ) : null}

            {step === "account" ? (
              <div className="space-y-3.5">
                <AuthSocialButtons loading={loading} onGoogle={() => void finishGoogle()} />

                <button
                  type="button"
                  onClick={() => setEmailOpen((v) => !v)}
                  className="inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                  aria-expanded={emailOpen}
                >
                  Or continue with email
                  <ChevronDown
                    className={`h-4 w-4 transition ${emailOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>

                {emailOpen ? (
                  <form
                    className="space-y-3.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void finishEmail();
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="claim-email" className="text-slate-700">
                        Email Address
                      </Label>
                      <Input
                        id="claim-email"
                        type="email"
                        required
                        autoComplete="email"
                        className={inputClass}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="claim-password" className="text-slate-700">
                        Password
                      </Label>
                      <Input
                        id="claim-password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className={inputClass}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className={aiButtonClass} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        "Create account & verify email"
                      )}
                    </button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
