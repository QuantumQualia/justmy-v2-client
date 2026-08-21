import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HTMLAttributes, ReactNode } from "react";
import {
  Check,
  CreditCard,
  Crosshair,
  Home,
  Inbox,
  Radar,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useBizOsHome, useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import { isPlatformAdmin } from "@/lib/auth/session-user";

export const BIZ_OS_NAV = [
  { href: "/biz-os", label: "Home", icon: Home, exact: true },
  { href: "/biz-os/onboard", label: "myCARD", icon: CreditCard },
  { href: "/biz-os/battle-plans", label: "Battle Plans", icon: Crosshair },
  { href: "/biz-os/skyscan", label: "SKYSCAN", icon: Radar },
  { href: "/biz-os/reputation", label: "Reputation", icon: Star },
  { href: "/biz-os/app-store", label: "Apps", icon: Store },
] as const;

export function navIsActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BizOsSubnav() {
  const pathname = usePathname();
  const { me } = useBizOsProfile();
  const showQueue = isPlatformAdmin(me);

  return (
    <nav
      className="border-b border-violet-100/80 bg-white/90 backdrop-blur-md"
      aria-label="Biz OS"
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
        {BIZ_OS_NAV.map((item) => {
          const active = navIsActive(pathname, item.href, "exact" in item ? Boolean(item.exact) : false);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                  : "text-slate-600 hover:bg-violet-50 hover:text-violet-800",
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
                ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                : "text-slate-600 hover:bg-violet-50 hover:text-violet-800",
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            Queue
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export const BIZ_OS_STEPS = [
  { id: "claim", label: "Claim", href: "/biz-os/onboard" },
  { id: "card", label: "Card", href: "/biz-os/onboard" },
  { id: "skyscan", label: "SKYSCAN", href: "/biz-os/skyscan" },
  { id: "battle_plan", label: "Battle Plan", href: "/biz-os/battle-plans" },
] as const;

/** First-time Claim → Card → SKYSCAN → Battle Plan. Hidden once scan + plan exist. */
export function BizOsSetupSteps() {
  const { data, ready } = useBizOsHome();
  const hasScan = Boolean(data?.latestScan);
  const hasPlan = Boolean(data?.activePlan);

  if (!ready || (hasScan && hasPlan)) return null;

  const next = !hasScan
    ? "Run SKYSCAN next, then start a Battle Plan."
    : "SKYSCAN is done. Start a Battle Plan to finish setup.";

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
                  isCurrent && "bg-violet-600 text-white shadow-sm shadow-violet-600/20",
                  done && "border border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-300",
                  !isCurrent &&
                    !done &&
                    "border border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-800",
                )}
              >
                {done ? <Check className="h-3 w-3" aria-hidden /> : <span>{i + 1}.</span>}
                {s.label}
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-slate-500">{next}</p>
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

export function BizOsHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
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
    <section
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_40px_-24px_rgba(76,29,149,0.35)]",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
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
          label: "Run SKYSCAN",
          body: "See how you show up in search, reviews, and conversational AI.",
        }
      : null,
    !hasPlan
      ? {
          href: "/biz-os/battle-plans",
          label: "Start a Battle Plan",
          body: "Pick a 30-day goal and AskSKY will turn it into a checklist.",
        }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; body: string }>;

  return (
    <BizOsCard className="border-violet-200 bg-violet-50/50">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">Finish setup</p>
      <p className="mt-1 text-sm text-slate-600">
        You skipped a step during onboarding. Pick up where you left off.
      </p>
      <ul className="mt-4 space-y-3">
        {missing.map((item) => (
          <li key={item.href} className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="text-sm text-slate-500">{item.body}</p>
            </div>
            <Link
              href={item.href}
              className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/20"
            >
              Continue
            </Link>
          </li>
        ))}
      </ul>
    </BizOsCard>
  );
}

export function BizOsProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-linear-to-r from-violet-600 to-cyan-400 transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function BizOsSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <BizOsPage aria-busy="true">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-violet-100" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded-lg bg-slate-200/80" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200/60" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <BizOsCard className="lg:col-span-2">
          <div className="space-y-3">
            {Array.from({ length: Math.max(lines, 4) }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${88 - i * 12}%` }} />
            ))}
          </div>
        </BizOsCard>
        <BizOsCard>
          <div className="space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
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
    <BizOsCard className="border-dashed bg-violet-50/40 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-violet-500" />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </BizOsCard>
  );
}
