"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { bizOsService, type BattlePlan, type BattlePlanLog, type BattlePlanTask } from "@/lib/services/biz-os";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import { PlanFunctionsMenu } from "@/components/biz-os/plan-functions-menu";
import { copyText, downloadConversationPdf, draftInGmail } from "@/lib/functions/output";
import { conversationThrough, formatTranscript, transcriptLines } from "@/lib/functions/transcript";
import type { FunctionId } from "@/lib/functions/registry";
import { ApiClientError } from "@/lib/api-client";
import { ACCOUNT_TIER, hasAccess } from "@/lib/plan-features";
import {
  BizOsCard,
  BizOsHeader,
  BizOsPage,
  BizOsProgress,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { cn } from "@workspace/ui/lib/utils";
import { useRealtime, type RealtimeEvent } from "@/lib/realtime";

const OWNER_APPROVE_LINE = "Approved this plan.";
const OWNER_KEEP_EDITING_LINE = "Try another draft.";
const MESSAGE_LINK =
  /(\/biz-os\/battle-plans\/\d+(?:\?handoff=\d+)?|https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+(?:\/edit)?)/g;

type BusyKind = "send" | "approve" | "keep_editing" | "spawn" | "export_doc" | "handoff";

function busyStatus(kind: BusyKind) {
  if (kind === "approve") return "Sky is making this live…";
  if (kind === "keep_editing") return "Sky is trying another draft…";
  if (kind === "spawn") return "Sky is starting a new plan…";
  if (kind === "export_doc") return "Sky is making a Google Doc…";
  if (kind === "handoff") return "Sky is looping in #FunCREW…";
  return "Sky is drafting…";
}

function paidRequired(err: unknown) {
  return err instanceof ApiClientError && err.statusCode === 403;
}

function applyFunCrewRealtime(plan: BattlePlan, event: RealtimeEvent): BattlePlan {
  const log = event.payload?.log as BattlePlanLog | undefined;
  const handoffId = Number(event.payload?.handoffId);
  const status = typeof event.payload?.status === "string" ? event.payload.status : null;
  const logs = plan.logs || [];
  const nextLogs =
    log?.id && !logs.some((row) => row.id === log.id)
      ? [...logs, { ...log, createdAt: String(log.createdAt) }]
      : logs;
  const handoffs = (plan.handoffs || []).map((h) =>
    h.id === handoffId && status ? { ...h, status } : h,
  );
  return { ...plan, logs: nextLogs, handoffs };
}

function isSky(senderType: string, senderName?: string | null) {
  const type = senderType.toLowerCase();
  const name = (senderName || "").toLowerCase();
  return type === "asksky" || type === "system" || name.includes("sky");
}

function logSpeaker(log: BattlePlanLog) {
  if (log.senderType === "team") return "#FunCREW";
  if (isSky(log.senderType, log.senderName)) return "Sky";
  return log.senderName || "You";
}

function PlanMessageText({ text }: { text: string }) {
  const parts = text.split(MESSAGE_LINK);
  return (
    <p className="min-w-0 flex-1 whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^\/biz-os\/battle-plans\/\d+(?:\?handoff=\d+)?$/.test(part)) {
          return (
            <Link
              key={`${part}-${i}`}
              href={part}
              className="font-medium text-violet-700 underline underline-offset-2"
            >
              {part}
            </Link>
          );
        }
        if (/^https:\/\/docs\.google\.com\/document\/d\//.test(part)) {
          return (
            <a
              key={`${part}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-violet-700 underline underline-offset-2"
            >
              Open Google Doc
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function formatTaskDate(value?: string | null) {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function taskProgress(tasks: BattlePlanTask[]) {
  const done = tasks.filter((t) => t.status === "completed").length;
  return tasks.length ? Math.round((done / tasks.length) * 100) : 0;
}

function applyTaskStatus(plan: BattlePlan, taskId: number, status: string): BattlePlan {
  const tasks = (plan.tasks || []).map((t) => (t.id === taskId ? { ...t, status } : t));
  return { ...plan, tasks, progress: taskProgress(tasks) };
}

function applyTaskToggle(plan: BattlePlan, task: BattlePlanTask, next: string): BattlePlan {
  const withStatus = applyTaskStatus(plan, task.id, next);
  const optimistic: BattlePlanLog = {
    id: -Date.now(),
    senderType: "client",
    senderName: "Owner",
    messageText: next === "completed" ? `Checked off: ${task.taskText}` : `Unchecked: ${task.taskText}`,
    createdAt: new Date().toISOString(),
  };
  return { ...withStatus, logs: [...(withStatus.logs || []), optimistic] };
}

function mergePlanLogs(current?: BattlePlanLog[], server?: BattlePlanLog[]) {
  const base = server || [];
  const extras = (current || []).filter(
    (log) =>
      log.id < 0 &&
      !base.some((s) => s.senderType === log.senderType && s.messageText === log.messageText),
  );
  return extras.length ? [...base, ...extras] : base;
}

function mergeFetchedPlan(
  current: BattlePlan | null,
  server: BattlePlan,
  inflight: Set<number>,
): BattlePlan {
  if (!current) return server;
  const tasks = (server.tasks || []).map((task) => {
    if (!inflight.has(task.id)) return task;
    return current.tasks?.find((t) => t.id === task.id) || task;
  });
  return {
    ...server,
    tasks,
    progress: taskProgress(tasks),
    logs: mergePlanLogs(current.logs, server.logs),
  };
}

function taskMeta(task: BattlePlanTask) {
  const due = formatTaskDate(task.targetDate);
  const who = task.assigneeName?.trim() || "";
  const parts: string[] = [];
  if (task.status === "completed") {
    parts.push(due ? `Done ${due}` : "Done");
  } else if (due) {
    parts.push(`Due ${due}`);
  }
  if (who) parts.push(`assigned to ${who}`);
  return parts.join(" · ");
}

function TaskRow({
  task,
  live,
  onToggle,
}: {
  task: BattlePlanTask;
  live: boolean;
  onToggle: (task: BattlePlanTask) => void;
}) {
  const done = task.status === "completed";
  const meta = taskMeta(task);
  return (
    <li>
      <label
        className={cn(
          "flex items-start gap-3 rounded-2xl px-1 py-2 text-sm",
          live ? "cursor-pointer" : "cursor-default",
        )}
      >
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600"
          checked={done}
          disabled={!live}
          onChange={() => live && onToggle(task)}
        />
        <span className="min-w-0 flex-1">
          <span className={cn("font-medium", done ? "text-slate-400 line-through" : "text-slate-800")}>
            {task.taskText}
          </span>
          {meta ? <span className="mt-0.5 block text-xs text-slate-500">{meta}</span> : null}
          {task.description ? (
            <span className="mt-1 block text-xs text-slate-500">{task.description}</span>
          ) : null}
        </span>
      </label>
    </li>
  );
}

export default function BattlePlanWorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = Number(params.id);
  const handoffId = Number(searchParams.get("handoff") || 0) || null;
  const { data: plan, setData: setPlan, pageReady, profileId, me } = useBizOsFetch(
    (id) => bizOsService.getPlan(id, planId),
    null as BattlePlan | null,
    planId,
  );
  const paidOs = hasAccess(me?.osName, ACCOUNT_TIER.COMMAND);
  const [note, setNote] = useState("");
  const [busyKind, setBusyKind] = useState<BusyKind | null>(null);
  const [taskWorking, setTaskWorking] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<"connecting" | "open" | "closed">("closed");
  const logEndRef = useRef<HTMLDivElement>(null);
  const taskPatchSeq = useRef(new Map<number, number>());
  const inflightTasks = useRef(new Set<number>());
  const busy = Boolean(busyKind) || taskWorking > 0;
  const skyWorkingText = busyKind
    ? busyStatus(busyKind)
    : taskWorking > 0
      ? "Sky is working…"
      : null;

  const unsent = Boolean(note.trim());

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [plan?.logs, busyKind, taskWorking]);

  useRealtime({
    topics: [handoffId ? `funcrew.handoff.${handoffId}` : null],
    enabled: Boolean(handoffId),
    onStatus: setStreamStatus,
    onEvent: (event) => {
      if (event.type !== "funcrew.message") return;
      setPlan((current) => (current ? applyFunCrewRealtime(current, event) : current));
    },
  });

  useEffect(() => {
    if (!pageReady || !profileId || !planId || !handoffId) return;
    if (streamStatus === "open") return;
    let cancelled = false;
    let inFlight = false;
    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const next = await bizOsService.getPlan(profileId, planId);
        if (cancelled) return;
        setPlan((current) => mergeFetchedPlan(current, next, inflightTasks.current));
      } catch {
        /* keep showing the last plan */
      } finally {
        inFlight = false;
      }
    };
    const timer = window.setInterval(() => void tick(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pageReady, profileId, planId, handoffId, streamStatus, setPlan]);

  function pushOwnerLine(messageText: string) {
    if (!plan) return;
    const optimistic: BattlePlanLog = {
      id: -Date.now(),
      threadId: handoffId,
      senderType: "client",
      senderName: "Owner",
      messageText,
      createdAt: new Date().toISOString(),
    };
    setPlan({ ...plan, logs: [...(plan.logs || []), optimistic] });
  }

  async function runWithOwnerTurn(
    kind: BusyKind,
    ownerText: string,
    request: () => Promise<BattlePlan>,
  ) {
    if (!profileId || !plan || busy) return null;
    const snapshot = plan;
    pushOwnerLine(ownerText);
    setBusyKind(kind);
    setHint(null);
    try {
      const server = await request();
      setPlan((current) => mergeFetchedPlan(current, server, inflightTasks.current));
      return server;
    } catch {
      setPlan((current) => {
        if (!current) return snapshot;
        return {
          ...snapshot,
          tasks: current.tasks,
          progress: taskProgress(current.tasks || []),
        };
      });
      setHint("Sky couldn’t finish that. Try again.");
      return null;
    } finally {
      setBusyKind(null);
    }
  }

  async function toggle(task: BattlePlanTask) {
    if (!profileId || plan?.status !== "active" || busyKind) return;
    const next = task.status === "completed" ? "pending" : "completed";
    const ownerLine = next === "completed" ? `Checked off: ${task.taskText}` : `Unchecked: ${task.taskText}`;
    const seq = (taskPatchSeq.current.get(task.id) || 0) + 1;
    taskPatchSeq.current.set(task.id, seq);
    inflightTasks.current.add(task.id);
    setTaskWorking((n) => n + 1);
    setPlan((current) => (current ? applyTaskToggle(current, task, next) : current));
    try {
      const server = await bizOsService.patchTask(profileId, planId, task.id, next);
      if (taskPatchSeq.current.get(task.id) !== seq) return;
      inflightTasks.current.delete(task.id);
      setPlan((current) => mergeFetchedPlan(current, server, inflightTasks.current));
    } catch {
      if (taskPatchSeq.current.get(task.id) !== seq) return;
      inflightTasks.current.delete(task.id);
      setPlan((current) => {
        if (!current) return current;
        return {
          ...applyTaskStatus(current, task.id, task.status),
          logs: (current.logs || []).filter((l) => !(l.id < 0 && l.messageText === ownerLine)),
        };
      });
      setHint("Couldn’t update that task. Try again.");
    } finally {
      setTaskWorking((n) => Math.max(0, n - 1));
    }
  }

  async function sendNote() {
    const text = note.trim();
    if (!profileId || !text || busy) return;
    setNote("");
    const server = await runWithOwnerTurn("send", text, () =>
      bizOsService.addMessage(profileId, planId, text, handoffId || undefined),
    );
    if (!server) {
      setNote(text);
      return;
    }
    const created = server.handoffs?.[0]?.id;
    if (!handoffId && created) {
      router.push(`/biz-os/battle-plans/${planId}?handoff=${created}`);
    }
  }

  async function askFunCrew() {
    if (!profileId || !plan || busy) return;
    if (!paidOs) {
      router.push("/biz-os/pricing");
      return;
    }
    setBusyKind("handoff");
    setHint(null);
    try {
      const server = await bizOsService.startFunCrewHandoff(profileId, planId);
      setPlan((current) => mergeFetchedPlan(current, server, inflightTasks.current));
      const created = server.handoffs?.[0]?.id;
      if (created) router.push(`/biz-os/battle-plans/${planId}?handoff=${created}`);
    } catch (err) {
      if (paidRequired(err)) {
        router.push("/biz-os/pricing");
        return;
      }
      setHint("Couldn’t loop in #FunCREW. Try again.");
    } finally {
      setBusyKind(null);
    }
  }

  async function approve() {
    if (!profileId || busy) return;
    if (unsent) {
      setHint("Send that message first, or clear it, then approve.");
      return;
    }
    await runWithOwnerTurn("approve", OWNER_APPROVE_LINE, () =>
      bizOsService.approvePlan(profileId, planId),
    );
  }

  async function keepEditing() {
    if (!profileId || busy) return;
    if (unsent) {
      setHint("Send that message first, or clear it, then try another draft.");
      return;
    }
    await runWithOwnerTurn("keep_editing", OWNER_KEEP_EDITING_LINE, () =>
      bizOsService.keepEditingPlan(profileId, planId),
    );
  }

  async function spawnFrom(log: BattlePlanLog) {
    if (!profileId || !plan || busy || log.id < 1) return;
    setBusyKind("spawn");
    setHint(null);
    try {
      const result = await bizOsService.spawnPlan(profileId, planId, log.id);
      setPlan((current) =>
        mergeFetchedPlan(current, result.sourcePlan, inflightTasks.current),
      );
      toast.success("New draft started.", {
        description: result.newPlan.title,
        action: {
          label: "Open",
          onClick: () => router.push(`/biz-os/battle-plans/${result.newPlan.id}`),
        },
      });
    } catch (err) {
      if (paidRequired(err)) {
        router.push("/biz-os/pricing");
        return;
      }
      setHint("Sky couldn’t start that plan. Try again.");
    } finally {
      setBusyKind(null);
    }
  }

  async function exportToDocs(log: BattlePlanLog) {
    if (!profileId || !plan || busy || log.id < 1) return;
    setBusyKind("export_doc");
    setHint(null);
    try {
      const returnTo = `/biz-os/battle-plans/${planId}?exportDoc=${log.id}`;
      const result = await bizOsService.exportPlanDoc(profileId, planId, log.id, returnTo);
      if (result.status === "auth_required" && result.authUrl) {
        window.location.href = result.authUrl;
        return;
      }
      if (result.status === "created" && result.sourcePlan) {
        setPlan((current) => mergeFetchedPlan(current, result.sourcePlan!, inflightTasks.current));
      }
    } catch (err) {
      if (paidRequired(err)) {
        router.push("/biz-os/pricing");
        return;
      }
      setHint(err instanceof Error ? err.message : "Sky couldn’t make that Doc. Try again.");
    } finally {
      setBusyKind((kind) => (kind === "export_doc" ? null : kind));
    }
  }

  async function runFunction(log: BattlePlanLog, id: FunctionId) {
    const title = plan?.title || "Battle Plan";
    const thread = conversationThrough(plan?.logs || [], log.id);
    const lines = transcriptLines(thread);
    const transcript = formatTranscript(title, lines);
    try {
      if (id === "copy") {
        await copyText(log.messageText || "");
        toast.success("Copied Sky’s answer");
        return;
      }
      if (id === "convert_pdf") {
        await downloadConversationPdf(title, lines);
        toast.success("PDF downloaded");
        return;
      }
      if (id === "export_docs") {
        await exportToDocs(log);
        return;
      }
      if (id === "draft_gmail") {
        await draftInGmail(`${title} — conversation`, transcript);
        toast.success("Copied the conversation — Gmail draft is open");
        return;
      }
      if (id === "convert_battle_plan") {
        await spawnFrom(log);
      }
    } catch {
      toast.error("Couldn’t run that function.");
    }
  }

  useEffect(() => {
    if (!pageReady || !profileId || !plan || !paidOs) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") === "failed") {
      window.history.replaceState({}, "", window.location.pathname);
      setHint("Google Docs didn’t connect. In Google Cloud, add this Authorized redirect URI, then try Export again: your API origin + /biz-os/oauth-callback (locally http://localhost:3001/biz-os/oauth-callback).");
      return;
    }
    const logId = Number(params.get("exportDoc"));
    if (!Number.isFinite(logId) || logId < 1) return;
    window.history.replaceState({}, "", window.location.pathname);
    const log = (plan.logs || []).find((row) => row.id === logId);
    if (log) void exportToDocs(log);
    // Retry once after Google Docs OAuth returns to this plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageReady, profileId, plan, paidOs, planId]);

  if (!pageReady) return <BizOsSkeleton />;
  if (!plan) {
    return (
      <BizOsPage>
        <BizOsHeader title="Battle Plan" description="This plan could not be loaded." />
        <Link className="text-sm font-medium text-violet-600" href="/biz-os/battle-plans">
          ← All plans
        </Link>
      </BizOsPage>
    );
  }

  const draft = plan.status === "draft";
  const live = plan.status === "active";
  const tasks = plan.tasks || [];
  const activeHandoff = handoffId ? plan.handoffs?.find((h) => h.id === handoffId) : null;
  const logs = (plan.logs || []).filter((l) =>
    activeHandoff ? l.threadId === activeHandoff.id : l.threadId == null,
  );
  const latestHandoff = plan.handoffs?.[0] || null;
  const done = live ? tasks.filter((t) => t.status === "completed").length : 0;
  const total = tasks.length;

  return (
    <BizOsPage className="flex h-[calc(100dvh-var(--biz-os-sticky-top,7rem)-4rem)] max-h-[calc(100dvh-var(--biz-os-sticky-top,7rem)-4rem)] min-h-0 flex-1 flex-col gap-6 space-y-0 overflow-hidden">
      <div className="shrink-0">
        <BizOsHeader
          eyebrow="Battle Plans"
          title={plan.title}
          description={plan.description || "Tell Sky what you’re working on. She drafts a plan, you shape it."}
          actions={
            <Link className="text-sm font-medium text-violet-600 hover:text-violet-800" href="/biz-os/battle-plans">
              ← All plans
            </Link>
          }
        />
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(16rem,1.15fr)] items-stretch gap-4 overflow-hidden lg:grid-cols-2 lg:grid-rows-none">
        <BizOsCard padded={false} className="order-2 flex min-h-0 flex-col overflow-hidden lg:order-1">
          <div className="flex shrink-0 items-center gap-2 border-b border-violet-50 bg-linear-to-r from-violet-50/80 to-cyan-50/40 px-4 py-3">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold">
              {activeHandoff ? "#FunCREW assist" : draft ? "Start a plan" : "Plan conversation"}
            </p>
            <div className="ml-auto flex items-center gap-2">
              {activeHandoff ? (
                <Link
                  className="text-xs font-medium text-violet-700 hover:text-violet-900"
                  href={`/biz-os/battle-plans/${plan.id}`}
                >
                  Back to main chat
                </Link>
              ) : latestHandoff ? (
                <Link
                  className="text-xs font-medium text-violet-700 hover:text-violet-900"
                  href={`/biz-os/battle-plans/${plan.id}?handoff=${latestHandoff.id}`}
                >
                  Join #FunCREW
                </Link>
              ) : live && paidOs ? (
                <button
                  type="button"
                  className="text-xs font-medium text-violet-700 hover:text-violet-900 disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void askFunCrew()}
                >
                  Ask #FunCREW
                </button>
              ) : null}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 text-sm">
            {logs.length ? (
              logs.map((l) => {
                const sky = isSky(l.senderType, l.senderName);
                const funCrew = l.senderType === "team";
                return (
                  <div
                    key={l.id}
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm",
                      funCrew
                        ? "mr-4 border border-emerald-200 bg-emerald-50 text-emerald-950"
                        : sky
                          ? "mr-4 bg-slate-50 text-slate-800"
                          : "ml-8 bg-violet-600 text-white",
                    )}
                  >
                    {funCrew ? (
                      <p className="mb-1 text-[11px] font-semibold text-emerald-700">{logSpeaker(l)}</p>
                    ) : null}
                    <div className="flex items-start gap-1">
                      <PlanMessageText text={l.messageText} />
                      {sky && l.id > 0 && !activeHandoff ? (
                        <PlanFunctionsMenu
                          disabled={Boolean(busyKind)}
                          paid={paidOs}
                          onLocked={() => router.push("/biz-os/pricing")}
                          onRun={(id) => runFunction(l, id)}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Tell Sky what you’re working on.</p>
            )}
            {skyWorkingText ? (
              <div className="mr-4 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                {skyWorkingText}
              </div>
            ) : null}
            <div ref={logEndRef} />
          </div>
          <form
            className="shrink-0 border-t border-slate-100 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendNote();
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                className="max-h-36 min-h-11 flex-1 resize-y rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                rows={2}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (hint) setHint(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendNote();
                  }
                }}
                placeholder={
                  busy
                    ? "Sky is working…"
                    : activeHandoff
                      ? "Talk with Sky and #FunCREW in this thread…"
                      : draft
                        ? "Tell Sky what you’re working on…"
                        : "Ask about a task, or what to do next…"
                }
                disabled={busy}
              />
              <Button type="submit" size="icon" className="mb-0.5 shrink-0" disabled={busy || !note.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {hint ? <p className="mt-2 text-xs text-amber-700">{hint}</p> : null}
          </form>
        </BizOsCard>
        <BizOsCard className="order-1 flex min-h-0 flex-col overflow-hidden lg:order-2">
          <div className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{plan.title}</h2>
              {live ? (
                <span className="text-sm font-medium text-slate-500">{plan.progress}%</span>
              ) : (
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                  Draft
                </span>
              )}
            </div>
            {live ? (
              <div className="mt-2">
                <BizOsProgress value={plan.progress} />
                <p className="mt-1 text-xs text-slate-400">
                  {done} of {total} complete
                </p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Proposal — not tracked until you approve.</p>
            )}
          </div>
          <ul className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
            {tasks.length ? (
              tasks.map((t) => (
                <TaskRow key={t.id} task={t} live={live} onToggle={(task) => void toggle(task)} />
              ))
            ) : (
              <li className="text-sm text-slate-500">
                No checklist yet. Tell Sky the goal and she’ll draft the steps here.
              </li>
            )}
          </ul>
          {draft ? (
            <div className="mt-4 flex shrink-0 flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button type="button" disabled={busy || !total} onClick={() => void approve()}>
                Approve plan
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => void keepEditing()}>
                Keep editing
              </Button>
            </div>
          ) : null}
        </BizOsCard>
      </div>
    </BizOsPage>
  );
}
