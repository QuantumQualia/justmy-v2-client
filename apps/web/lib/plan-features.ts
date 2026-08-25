import { canonicalizeOsName, OS_NAME } from "@/lib/os-types";

/** Stripe / OS names used on the 4-tier ladder. */
export const PLAN_OS_ORDER = [
  OS_NAME.BIZ,
  OS_NAME.COMMAND,
  OS_NAME.COMMAND_PRO,
  OS_NAME.ENTERPRISE,
] as const;

export type PlanOsName = (typeof PLAN_OS_ORDER)[number];

/** JR account_tier values. Synced from OS.name on the profile. */
export const ACCOUNT_TIER = {
  FREE: "free",
  COMMAND: "command",
  COMMAND_PRO: "command_pro",
  ENTERPRISE: "enterprise",
} as const;

export type AccountTier = (typeof ACCOUNT_TIER)[keyof typeof ACCOUNT_TIER];

const OS_TO_TIER: Record<string, AccountTier> = {
  BIZ: ACCOUNT_TIER.FREE,
  COMMAND: ACCOUNT_TIER.COMMAND,
  COMMAND_PRO: ACCOUNT_TIER.COMMAND_PRO,
  ENTERPRISE: ACCOUNT_TIER.ENTERPRISE,
  GROWTH: ACCOUNT_TIER.COMMAND,
  FOUNDER: ACCOUNT_TIER.COMMAND_PRO,
};

const TIER_RANK: Record<AccountTier, number> = {
  free: 0,
  command: 1,
  command_pro: 2,
  enterprise: 3,
};

const TIER_LABEL: Record<AccountTier, string> = {
  free: "Biz OS",
  command: "Command OS",
  command_pro: "Command PRO",
  enterprise: "Enterprise",
};

export function osNameToAccountTier(raw?: string | null): AccountTier {
  const os = canonicalizeOsName(raw);
  return OS_TO_TIER[os] ?? ACCOUNT_TIER.FREE;
}

export function parseAccountTier(raw?: string | null): AccountTier | null {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "free" || v === "command" || v === "command_pro" || v === "enterprise") return v;
  const fromOs = OS_TO_TIER[canonicalizeOsName(raw)];
  return fromOs ?? null;
}

export function hasAccess(userTier: string | null | undefined, requiredTier: string): boolean {
  const user = parseAccountTier(userTier) ?? osNameToAccountTier(userTier);
  const required = parseAccountTier(requiredTier) ?? osNameToAccountTier(requiredTier);
  return TIER_RANK[user] >= TIER_RANK[required];
}

export function accountTierLabel(tier: AccountTier): string {
  return TIER_LABEL[tier];
}

export type PlanFeature =
  | {
      id: string;
      label: string;
      kind: "access";
      minTier: AccountTier;
    }
  | {
      id: string;
      label: string;
      kind: "tokens";
      tokens: Record<PlanOsName, string>;
    };

export const PLAN_FEATURES: readonly PlanFeature[] = [
  {
    id: "mycard",
    label: "Verified digital myCARD & profile",
    kind: "access",
    minTier: ACCOUNT_TIER.FREE,
  },
  {
    id: "skyscan",
    label: "SKYSCAN 30/30/40 baseline audit",
    kind: "access",
    minTier: ACCOUNT_TIER.FREE,
  },
  {
    id: "asksky",
    label: "AskSKY AI assistant",
    kind: "access",
    minTier: ACCOUNT_TIER.COMMAND,
  },
  {
    id: "smarthandoff",
    label: "Live SmartHandoff SMS bridge",
    kind: "access",
    minTier: ACCOUNT_TIER.COMMAND,
  },
  {
    id: "myagent-tokens",
    label: "Monthly myAGENT tokens",
    kind: "tokens",
    tokens: {
      BIZ: "0",
      COMMAND: "250k",
      COMMAND_PRO: "750k",
      ENTERPRISE: "1.5M",
    },
  },
  {
    id: "media-engine",
    label: "Bi-weekly article & video engine",
    kind: "access",
    minTier: ACCOUNT_TIER.COMMAND_PRO,
  },
  {
    id: "voice-schema",
    label: "Omni-assistant voice schema (Siri)",
    kind: "access",
    minTier: ACCOUNT_TIER.COMMAND_PRO,
  },
  {
    id: "war-room",
    label: "Multi-campaign war room",
    kind: "access",
    minTier: ACCOUNT_TIER.ENTERPRISE,
  },
  {
    id: "competitor-tracking",
    label: "Head-to-head competitor tracking",
    kind: "access",
    minTier: ACCOUNT_TIER.ENTERPRISE,
  },
];

export function featureIncludedOnPlan(feature: PlanFeature, osName: PlanOsName): boolean {
  if (feature.kind === "tokens") return feature.tokens[osName] !== "0";
  return hasAccess(osName, feature.minTier);
}

export function previousPlanOs(osName: PlanOsName): PlanOsName | null {
  const index = PLAN_OS_ORDER.indexOf(osName);
  if (index <= 0) return null;
  return PLAN_OS_ORDER[index - 1] ?? null;
}

export function planOsLabel(osName: PlanOsName): string {
  return accountTierLabel(osNameToAccountTier(osName));
}

/** Features this tier adds on top of the previous plan (including token upgrades). */
export function featuresIntroducedOnPlan(osName: PlanOsName): PlanFeature[] {
  const prev = previousPlanOs(osName);
  return PLAN_FEATURES.filter((feature) => {
    if (feature.kind === "tokens") {
      const current = feature.tokens[osName];
      const previous = prev ? feature.tokens[prev] : "0";
      return current !== "0" && current !== previous;
    }
    if (!featureIncludedOnPlan(feature, osName)) return false;
    return !prev || !featureIncludedOnPlan(feature, prev);
  });
}

export function featureLabelOnPlan(feature: PlanFeature, osName: PlanOsName): string {
  if (feature.kind === "tokens") return `${feature.tokens[osName]} myAGENT tokens / mo`;
  return feature.label;
}
