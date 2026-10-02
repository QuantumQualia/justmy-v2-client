"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Briefcase, Check, Compass, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import {
  BizOsCard,
  BizOsEmpty,
  BizOsHeader,
  BizOsPage,
  ComingSoonBadge,
} from "@/components/biz-os/biz-os-ui";
import { useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import { useSubscriptionPlans } from "@/components/biz-os/use-subscription-plans";
import { ApiClientError } from "@/lib/services/auth";
import { subscriptionService, type SubscriptionPlan, type SubscriptionPlanPrice } from "@/lib/services/subscription";
import { canonicalizeOsName, isBusinessOs, OS_NAME, osNameToProfileKind, profileKindDisplayOs } from "@/lib/os-types";
import {
  currentOsLabel,
  featureLabelOnPlan,
  featuresIntroducedOnPlan,
  PLAN_OS_ORDER,
  planOsLabel,
  previousPlanOs,
  type PlanOsName,
} from "@/lib/plan-features";

const TIER_ORDER = PLAN_OS_ORDER;

type BillingInterval = "month" | "year";

const TIER_META: Record<
  (typeof TIER_ORDER)[number],
  { blurb: string; icon: LucideIcon; featured?: boolean }
> = {
  BIZ: {
    blurb: "Verified card, profile, and a baseline SkySCAN.",
    icon: Briefcase,
  },
  COMMAND: {
    blurb: "Voice recap, custom BattlePlan, FunCREW. SmartHandoff is coming soon.",
    icon: Compass,
  },
  COMMAND_PRO: {
    blurb: "Social OAuth and a JustMy + S3 broadcast pack. Auto-post and media engine are coming soon.",
    icon: Sparkles,
    featured: true,
  },
  ENTERPRISE: {
    blurb: "War room, competitor share of voice, and campaign BattlePlans.",
    icon: Award,
  },
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

function displayName(osName: string, productName?: string) {
  if (productName) return productName;
  const kind = osNameToProfileKind(osName);
  return kind ? profileKindDisplayOs(kind) : osName;
}

function pickPrice(plan: SubscriptionPlan | null, interval: BillingInterval): SubscriptionPlanPrice | null {
  if (!plan?.prices?.length) return null;
  return plan.prices.find((p) => p.interval === interval) || plan.prices[0] || null;
}

function annualSavingsPercent(plans: SubscriptionPlan[]): number | null {
  for (const plan of plans) {
    const monthly = plan.prices.find((p) => p.interval === "month");
    const yearly = plan.prices.find((p) => p.interval === "year");
    if (monthly && yearly && monthly.amount > 0) {
      const pct = Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100);
      if (pct > 0) return pct;
    }
  }
  return null;
}

function PricingSkeleton() {
  return (
    <BizOsPage aria-busy="true">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <BizOsCard key={i}>
            <div className="space-y-4">
              <div className="h-10 w-10 animate-pulse rounded-2xl bg-muted" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
            </div>
          </BizOsCard>
        ))}
      </div>
    </BizOsPage>
  );
}

export default function BizOsPricingPage() {
  const { me } = useBizOsProfile();
  const currentOs = canonicalizeOsName(me?.osName || me?.profileType || me?.profile?.osName || me?.profile?.type);
  const { data: plans = [], isPending, isError, refetch } = useSubscriptionPlans();
  const [interval, setInterval] = useState<BillingInterval>("month");

  const checkout = useMutation({
    mutationFn: (priceId: string) => subscriptionService.createCheckoutSession(priceId),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Checkout failed. Please try again.");
    },
  });

  const cards = useMemo(() => {
    const byOs = new Map(plans.map((plan) => [canonicalizeOsName(plan.osName), plan]));
    return TIER_ORDER.map((osName) => ({
      osName,
      plan: byOs.get(osName) || null,
    }));
  }, [plans]);

  const savePercent = useMemo(() => annualSavingsPercent(plans), [plans]);
  const signedInBusiness = isBusinessOs(currentOs);

  if (isPending) return <PricingSkeleton />;

  if (isError && plans.length === 0) {
    return (
      <BizOsPage>
        <BizOsHeader eyebrow="Plans" title="Choose your OS" />
        <BizOsEmpty
          title="Couldn’t load plans"
          body="Stripe catalog didn’t come back. Try again in a moment."
          action={
            <Button className="rounded-full bg-primary hover:bg-primary/90" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </BizOsPage>
    );
  }

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow="Plans"
        title="Choose your OS"
        description={
          signedInBusiness
            ? `You're on ${currentOsLabel(currentOs)}. This same listing can switch to Command, Command PRO, or Enterprise. Amounts come from Stripe. Coming soon tools stay labeled until they ship.`
            : "Claim a free Biz OS listing first, then subscribe to Command, Command PRO, or Enterprise. Amounts come from Stripe."
        }
        actions={
          <div className="inline-flex rounded-full border border-border bg-muted p-1">
            {(["month", "year"] as const).map((value) => {
              const active = interval === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setInterval(value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value === "month" ? "Monthly" : "Annual"}
                  {value === "year" && savePercent != null ? (
                    <span className="ml-1.5 text-[11px] font-semibold text-primary">Save {savePercent}%</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="grid items-stretch gap-4 pt-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ osName, plan }) => {
          const meta = TIER_META[osName];
          const Icon = meta.icon;
          const isCurrent = currentOs === osName;
          const isFree = osName === OS_NAME.BIZ;
          const featured = Boolean(meta.featured) && !isCurrent;
          const price = isFree ? null : pickPrice(plan, interval);
          const billedYearly = price?.interval === "year";
          const monthlyEquivalent =
            billedYearly && price ? Math.round(price.amount / 12) : price?.amount ?? 0;
          const planOs = osName as PlanOsName;
          const previousOs = previousPlanOs(planOs);
          const introduced = featuresIntroducedOnPlan(planOs);

          return (
            <BizOsCard
              key={osName}
              className={cn(
                "relative flex flex-col",
                isCurrent && "border-primary ring-2 ring-ring",
                featured && "border-primary/40 bg-linear-to-b from-secondary to-card xl:-mt-2 xl:mb-[-8px] xl:shadow-card",
                isFree && !isCurrent && "bg-muted/80",
              )}
            >
              {featured ? (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-sm">
                  Most popular
                </p>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                    featured || isCurrent ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Current
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 text-lg font-semibold text-foreground">{displayName(osName, plan?.productName)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{meta.blurb}</p>

              <div className="mt-5">
                {isFree ? (
                  <>
                    <p className="text-3xl font-bold tracking-tight text-foreground">$0</p>
                    <p className="mt-1 text-sm text-muted-foreground">Included with claim</p>
                  </>
                ) : price ? (
                  <>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {formatMoney(monthlyEquivalent, price.currency)}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {billedYearly
                        ? `${formatMoney(price.amount, price.currency)} billed yearly`
                        : "Billed monthly"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold tracking-tight text-muted-foreground">—</p>
                    <p className="mt-1 text-sm text-muted-foreground">No Stripe price yet</p>
                  </>
                )}
              </div>

              <ul className="mt-5 space-y-2">
                {previousOs ? (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="font-medium text-foreground">Everything in {planOsLabel(previousOs)}</span>
                  </li>
                ) : null}
                {introduced.map((feature) => (
                  <li key={feature.id} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-foreground">
                      {featureLabelOnPlan(feature, planOs)}
                      {feature.comingSoon ? (
                        <ComingSoonBadge className="ml-2 align-middle" />
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />

              {isFree ? (
                <Button className="w-full rounded-full" variant="outline" disabled>
                  {isCurrent ? "Included" : "Claim Biz OS to start"}
                </Button>
              ) : isCurrent ? (
                <Button className="w-full rounded-full" variant="outline" disabled>
                  Active
                </Button>
              ) : price ? (
                <Button
                  className={cn(
                    "w-full rounded-full",
                    featured
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-card text-white hover:bg-muted",
                  )}
                  disabled={checkout.isPending || !signedInBusiness}
                  onClick={() => checkout.mutate(price.priceId)}
                >
                  {checkout.isPending && checkout.variables === price.priceId
                    ? "Redirecting…"
                    : `Switch to ${displayName(osName)}`}
                </Button>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Add a Stripe product with metadata <span className="font-medium text-foreground">osName={osName}</span>.
                </p>
              )}
            </BizOsCard>
          );
        })}
      </div>

      {signedInBusiness ? null : (
        <p className="text-sm text-muted-foreground">Sign in with a business listing to subscribe.</p>
      )}
    </BizOsPage>
  );
}
