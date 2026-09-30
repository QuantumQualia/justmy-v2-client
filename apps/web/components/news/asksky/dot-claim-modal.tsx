"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Star, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
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

const inputClass = "h-10 border-border bg-card text-foreground shadow-none";

export function DotClaimModal({
  open,
  onOpenChange,
  defaultZip,
  defaultBusinessName,
  defaultWebsite,
  entryCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultZip?: string;
  defaultBusinessName?: string;
  defaultWebsite?: string;
  entryCategory?: "business" | "nonprofit";
}) {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [businessName, setBusinessName] = useState(defaultBusinessName || "");
  const [website, setWebsite] = useState(defaultWebsite || "");
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
    if (defaultBusinessName) setBusinessName(defaultBusinessName);
  }, [defaultBusinessName]);

  useEffect(() => {
    if (defaultWebsite) setWebsite(defaultWebsite);
  }, [defaultWebsite]);

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
    if (defaultBusinessName) setBusinessName(defaultBusinessName);
    if (defaultWebsite) setWebsite(defaultWebsite);
    if (defaultZip) setZipCode(defaultZip);
    void preloadOauthProviders();
  }, [open, defaultBusinessName, defaultWebsite, defaultZip]);

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
        website: website.trim() || undefined,
      });
      await persistClaimSession(response);
      onOpenChange(false);
      window.location.assign(
        bizOsHref(
          `/verify-email?redirect=${encodeURIComponent(`/biz-os/onboard?audience=${entryCategory || "business"}`)}`,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  async function finishGoogle() {
    setError("");
    try {
      const idToken = await requestGoogleIdToken({ click: false });
      setLoading(true);
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
        website: website.trim() || undefined,
      });
      await persistClaimSession(response);
      onOpenChange(false);
      window.location.assign(
        bizOsHref(`/biz-os/onboard?audience=${entryCategory || "business"}`),
      );
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
          <Button
            key={c}
            type="button"
            aria-pressed={on}
            size="sm"
            variant={on ? "default" : "outline"}
            className="h-auto max-w-full whitespace-normal px-3 py-1.5 text-left text-xs sm:text-sm"
            onClick={() => toggleCategory(c)}
          >
            {on ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {c}
          </Button>
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
        className="inset-x-3 top-auto bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 flex max-h-[min(90dvh,44rem)] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-4 text-foreground shadow-xl sm:inset-auto sm:top-[50%] sm:left-[50%] sm:bottom-auto sm:w-[min(100%-1.5rem,28rem)] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6"
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-3 right-3 z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </Button>
        </DialogClose>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-5 pb-4">
            <DialogHeader className="gap-1.5 pr-8 text-center sm:text-center">
              <DialogTitle className="text-xl font-bold tracking-tight text-balance text-foreground sm:text-2xl">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-pretty text-muted-foreground">
                {description}
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                  <Label htmlFor="claim-business-name" className="text-foreground">
                    {entryCategory === "nonprofit" ? "Organization name" : "Business name"}
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
                  <Label htmlFor="claim-website" className="text-foreground">
                    Website <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="claim-website"
                    type="url"
                    autoComplete="url"
                    placeholder="https://"
                    className={inputClass}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                {defaultZip ? null : (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="claim-zip"
                      className="flex items-center gap-1.5 text-foreground"
                    >
                      <MapPin className="h-3 w-3 text-primary" aria-hidden />
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
                    <p className="text-[11px] text-muted-foreground">
                      We use this to connect you to your local Market.
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="claim-phone" className="text-foreground">
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
                <Button type="submit" className="h-11 w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    "AskSKY, scan this business"
                  )}
                </Button>
              </form>
            ) : null}

            {step === "scanning" ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <p className="text-sm text-muted-foreground">Matching Google listings for {businessName.trim() || "this business"}</p>
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
                        className="rounded-xl border border-border bg-muted/80 px-4 py-3"
                      >
                        <p className="font-semibold text-foreground">
                          {listing.name || "Google listing"}
                        </p>
                        {listing.address ? (
                          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                            {listing.address}
                          </p>
                        ) : null}
                        {rating != null || listing.reviewCount ? (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {rating != null ? rating.toFixed(1) : "—"}
                            <span>· {listing.reviewCount || 0} reviews</span>
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          className="mt-3 h-10 w-full"
                          onClick={() => confirmListing(listing)}
                        >
                          This is my business
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button type="button" variant="secondary" className="h-11 w-full" onClick={skipListing}>
                  None of these — skip for now
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("form")}
                >
                  Search again
                </Button>
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
                  <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {listingNote}
                  </p>
                ) : null}
                <div className="flex max-w-full flex-wrap justify-center gap-x-3 gap-y-3">
                  {chipRow}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(7.5rem,1fr)_minmax(0,1.75fr)]">
                  <Button
                    type="button"
                    variant="secondary"
                    className="order-2 h-11 w-full sm:order-1"
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
                  </Button>
                  <Button
                    type="button"
                    className="order-1 h-11 w-full sm:order-2"
                    disabled={refreshingChips || !chipsReady}
                    onClick={() => setStep("account")}
                  >
                    Looks spot on
                  </Button>
                </div>
                {listings.length ? (
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("listing")}>
                    Change Google listing
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")}>
                    Edit name or ZIP
                  </Button>
                )}
              </div>
            ) : null}

            {step === "account" ? (
              <div className="space-y-3.5">
                <AuthSocialButtons loading={loading} onGoogle={() => void finishGoogle()} />

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setEmailOpen((v) => !v)}
                  aria-expanded={emailOpen}
                >
                  Or continue with email
                  <ChevronDown
                    className={`h-4 w-4 transition ${emailOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </Button>

                {emailOpen ? (
                  <form
                    className="space-y-3.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void finishEmail();
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="claim-email" className="text-foreground">
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
                      <Label htmlFor="claim-password" className="text-foreground">
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
                    <Button type="submit" className="h-11 w-full" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        "Create account & verify email"
                      )}
                    </Button>
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
