import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HTMLAttributes, ReactNode } from "react";
import {
  Check,
  ChevronLeft,
  CreditCard,
  Crosshair,
  FileText,
  Home,
  Inbox,
  Radar,
  Sparkles,
  Star,
  Store,
  Tag,
  Settings,
  Target,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { cn } from "@workspace/ui/lib/utils";
import { useBizOsHome, useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import { isPlatformAdmin } from "@/lib/auth/session-user";
import { isBusinessOs } from "@/lib/os-types";
import { ACCOUNT_TIER, currentOsLabel, hasAccess } from "@/lib/plan-features";

export const BIZ_OS_NAV = [
  { href: "/biz-os", label: "Home", icon: Home, exact: true },
  { href: "/biz-os/onboard", label: "myCARD", icon: CreditCard },
  { href: "/biz-os/content", label: "Content", icon: FileText },
  { href: "/biz-os/battle-plans", label: "Battle Plans", icon: Crosshair },
  { href: "/biz-os/skyscan", label: "SkySCAN", icon: Radar, businessOnly: true },
  {
    href: "/biz-os/campaigns",
    label: "Campaigns",
    icon: Target,
    businessOnly: true,
    minTier: ACCOUNT_TIER.ENTERPRISE,
  },
  { href: "/biz-os/reputation", label: "Reputation", icon: Star },
  { href: "/biz-os/app-store", label: "Apps", icon: Store },
  { href: "/biz-os/pricing", label: "Pricing", icon: Tag },
  { href: "/biz-os/settings", label: "Settings", icon: Settings, minTier: ACCOUNT_TIER.COMMAND_PRO },
] as const;

export function navIsActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BizOsSubnav() {
  const pathname = usePathname();
  const { me } = useBizOsProfile();
  const showQueue = isPlatformAdmin(me);
  const osName = me?.osName || me?.profileType;
  const isBusiness = isBusinessOs(osName);
  const navItems = BIZ_OS_NAV.filter((item) => {
    if ("businessOnly" in item && item.businessOnly && (!me || !isBusiness)) return false;
    if ("minTier" in item && item.minTier && !hasAccess(osName, item.minTier)) return false;
    return true;
  });

  return (
    <nav
      className="border-b border-primary/20 bg-card/90 backdrop-blur-md"
      aria-label={currentOsLabel(osName)}
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
        {navItems.map((item) => {
          const active = navIsActive(pathname, item.href, "exact" in item ? Boolean(item.exact) : false);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
        {showQueue ? (
          <Link
            href="/admin/biz-os/queue"
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              navIsActive(pathname, "/admin/biz-os/queue")
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-primary",
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            [#FunCREW]
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export const BIZ_OS_STEPS = [
  { id: "claim", label: "Claim", href: "/biz-os/onboard" },
  { id: "card", label: "Card", href: "/biz-os/onboard" },
  { id: "skyscan", label: "SkySCAN", href: "/biz-os/skyscan" },
  { id: "battle_plan", label: "Battle Plan", href: "/biz-os/battle-plans" },
] as const;

/** First-time Claim → Card → SkySCAN → Battle Plan. Hidden once scan + plan exist. */
export function BizOsSetupSteps() {
  const { data, ready } = useBizOsHome();
  const hasScan = Boolean(data?.latestScan);
  const hasPlan = Boolean(data?.activePlan);

  if (!ready || (hasScan && hasPlan)) return null;

  const next = !hasScan
    ? "Run SkySCAN next, then start a Battle Plan."
    : "SkySCAN is done. Start a Battle Plan to finish setup.";

  return (
    <div>
      <ol className="flex flex-wrap gap-2" aria-label="Onboarding steps">
        {BIZ_OS_STEPS.map((s, i) => {
          const isCurrent = s.id === "card";
          const done =
            !isCurrent &&
            (s.id === "claim" || (s.id === "skyscan" && hasScan) || (s.id === "battle_plan" && hasPlan));
          return (
            <li key={s.id}>
              <Link
                href={s.href}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  isCurrent && "bg-primary text-primary-foreground shadow-sm shadow-primary/20",
                  done && "border border-primary/30 bg-secondary text-primary hover:border-primary/40",
                  !isCurrent &&
                    !done &&
                    "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary",
                )}
              >
                {done ? <Check className="h-3 w-3" aria-hidden /> : <span>{i + 1}.</span>}
                {s.label}
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">{next}</p>
    </div>
  );
}

export function BizOsPage({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function OsBackButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm" className="max-w-[11rem] shrink-0">
      <Link href={href}>
        <ChevronLeft />
        <span className="truncate">{label}</span>
      </Link>
    </Button>
  );
}

export function OsPaneSwitch<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: string }>;
}) {
  return (
    <div
      className="flex shrink-0 rounded-full border border-border bg-card p-1 lg:hidden"
      role="tablist"
      aria-label="Workspace"
    >
      {options.map((option) => (
        <Button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          size="sm"
          variant={value === option.id ? "default" : "ghost"}
          className="flex-1"
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function PlanPaneSwitch({
  value,
  onChange,
  chatLabel = "Conversation",
  planLabel = "Plan",
}: {
  value: "chat" | "plan";
  onChange: (value: "chat" | "plan") => void;
  chatLabel?: string;
  planLabel?: string;
}) {
  return (
    <OsPaneSwitch
      value={value}
      onChange={onChange}
      options={[
        { id: "chat", label: chatLabel },
        { id: "plan", label: planLabel },
      ]}
    />
  );
}

export function BizOsHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  if (back) {
    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <OsBackButton href={back.href} label={back.label} />
          {actions ? <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{actions}</div> : null}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-none">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-none">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function BizOsCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <Card
      className={cn("gap-0 rounded-3xl py-0 shadow-card", padded && "p-5 sm:p-6", className)}
    >
      {children}
    </Card>
  );
}

export function BizOsSetupNotice() {
  const { data, ready } = useBizOsHome();
  const hasScan = Boolean(data?.latestScan);
  const hasPlan = Boolean(data?.activePlan);

  if (!ready || (hasScan && hasPlan)) return null;

  const missing = [
    !hasScan
      ? {
          href: "/biz-os/skyscan",
          label: "Run SkySCAN",
          body: "See how you show up in search, reviews, and conversational AI.",
        }
      : null,
    !hasPlan
      ? {
          href: "/biz-os/battle-plans",
          label: "Start a Battle Plan",
          body: "Tell Sky what you’re working on. She drafts a plan you can shape, then approve.",
        }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; body: string }>;

  return (
    <BizOsCard className="border-primary/30 bg-secondary/50">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Finish setup</p>
      <p className="mt-1 text-sm text-muted-foreground">
        You skipped a step during onboarding. Pick up where you left off.
      </p>
      <ul className="mt-4 space-y-3">
        {missing.map((item) => (
          <li key={item.href} className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
            <Button asChild size="sm">
              <Link href={item.href}>Continue</Link>
            </Button>
          </li>
        ))}
      </ul>
    </BizOsCard>
  );
}

export function BizOsProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return <Progress value={pct} />;
}

export function BizOsSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <BizOsPage aria-busy="true">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <BizOsCard className="lg:col-span-2">
          <div className="space-y-3">
            {Array.from({ length: Math.max(lines, 4) }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${88 - i * 12}%` }} />
            ))}
          </div>
        </BizOsCard>
        <BizOsCard>
          <div className="space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </BizOsCard>
      </div>
    </BizOsPage>
  );
}

export function BizOsEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <BizOsCard className="border-dashed bg-secondary/40 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-primary" />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </BizOsCard>
  );
}

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      Coming soon
    </span>
  );
}
