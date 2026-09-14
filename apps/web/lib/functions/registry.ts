export const FUNCTION_APP = {
  BATTLE_PLANS: "battle-plans",
} as const;

export type FunctionApp = (typeof FUNCTION_APP)[keyof typeof FUNCTION_APP];

export type FunctionId =
  | "copy"
  | "export_docs"
  | "draft_gmail"
  | "convert_pdf"
  | "convert_battle_plan"
  | "share_to_profile";

export type AppFunction = {
  id: FunctionId;
  label: string;
  apps: FunctionApp[];
  enabled: boolean;
  /** Command OS and up when true. Free Biz OS still sees the item, locked. */
  paid?: boolean;
};

/** Built once; each app opts in. Battle Plans is the first consumer. */
export const APP_FUNCTIONS: readonly AppFunction[] = [
  { id: "copy", label: "Copy", apps: [FUNCTION_APP.BATTLE_PLANS], enabled: true },
  { id: "draft_gmail", label: "Draft in Gmail", apps: [FUNCTION_APP.BATTLE_PLANS], enabled: true },
  { id: "export_docs", label: "Export to Docs", apps: [FUNCTION_APP.BATTLE_PLANS], enabled: true, paid: true },
  { id: "convert_pdf", label: "Convert to PDF", apps: [FUNCTION_APP.BATTLE_PLANS], enabled: true, paid: true },
  { id: "convert_battle_plan", label: "Convert to New Battle Plan", apps: [FUNCTION_APP.BATTLE_PLANS], enabled: true, paid: true },
  { id: "share_to_profile", label: "Share to Profile", apps: [FUNCTION_APP.BATTLE_PLANS], enabled: false },
];

export function functionsForApp(app: FunctionApp): AppFunction[] {
  return APP_FUNCTIONS.filter((fn) => fn.enabled && fn.apps.includes(app));
}
