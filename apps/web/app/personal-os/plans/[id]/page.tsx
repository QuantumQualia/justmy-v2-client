"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, CalendarDays, Check, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { SkyAvatar } from "@workspace/ui/components/sky-avatar";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { bizOsService, type BattlePlan, type BattlePlanLog, type BattlePlanTask } from "@/lib/services/biz-os";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsHeader,
  BizOsPage,
  BizOsProgress,
  BizOsSkeleton,
  PlanPaneSwitch,
} from "@/components/biz-os/biz-os-ui";
import { AskSkyUserAvatar } from "@/components/asksky/asksky-user-avatar";
import { AskSkyGrowTextarea } from "@/components/asksky/asksky-grow-textarea";
import { PlanCalendarsDialog } from "@/components/personal-os/plan-calendars-dialog";
import {
  AskSkyTypedText,
  askSkyMsgInClass,
  useAskSkyFreshMessageIds,
} from "@workspace/ui/components/asksky-typed-text";

const OWNER_APPROVE_LINE = "Approved this plan.";
const OWNER_KEEP_EDITING_LINE = "Try another draft.";

type BusyKind = "send" | "approve" | "keep_editing" | "calendar";

function busyStatus(kind: BusyKind) {
  if (kind === "approve") return "Sky is making this live…";
  if (kind === "keep_editing") return "Sky is trying another draft…";
  if (kind === "calendar") return "Sky is syncing your calendar…";
  return "Sky is drafting…";
}

function isSky(senderType: string, senderName?: string | null) {
  const type = senderType.toLowerCase();
  const name = (senderName || "").toLowerCase();
  return type === "asksky" || type === "system" || name.includes("sky");
}

function PlanMessageText({ text }: { text: string }) {
  return <p className="min-w-0 flex-1 whitespace-pre-wrap">{text}</p>;
}

function PersonalPlanThread({
  logs,
  skyWorkingText,
}: {
  logs: BattlePlanLog[];
  skyWorkingText: string | null;
}) {
  const freshIds = useAskSkyFreshMessageIds(logs.map((l) => l.id));
  return (
    <>
      {logs.length ? (
        logs.map((l) => {
          const sky = isSky(l.senderType, l.senderName);
          const animate = freshIds.has(String(l.id));
          return (
            <div
              key={l.id}
              className={cn(
                "text-sm",
                askSkyMsgInClass(animate),
                sky ? "mr-4 flex items-end gap-2" : "flex items-end justify-end gap-2 pl-8",
              )}
              data-asksky-theme="light"
            >
              {sky ? (
                <>
                  <SkyAvatar size={28} className="mb-0.5" />
                  <div className="asksky-sky-bubble-assistant min-w-0 flex-1">
                    <AskSkyTypedText text={l.messageText} animate={animate}>
                      <PlanMessageText text={l.messageText} />
                    </AskSkyTypedText>
                  </div>
                </>
              ) : (
                <>
                  <div className="asksky-sky-bubble-user min-w-0">
                    <PlanMessageText text={l.messageText} />
                  </div>
                  <AskSkyUserAvatar className="mb-0.5" />
                </>
              )}
            </div>
          );
        })
      ) : (
        <p className="text-sm text-slate-500">Tell Sky what you’re working on.</p>
      )}
      {skyWorkingText ? (
        <div className={cn("mr-4 flex items-end gap-2", askSkyMsgInClass(true))} data-asksky-theme="light">
          <SkyAvatar size={28} className="mb-0.5" />
          <div className="asksky-sky-bubble-assistant text-sm text-white/90">{skyWorkingText}</div>
        </div>
      ) : null}
    </>
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
  const place = task.location?.trim() || "";
  const parts: string[] = [];
  if (task.status === "completed") {
    parts.push(due ? `Done ${due}` : "Done");
  } else if (due) {
    parts.push(`Due ${due}`);
  }
  if (place) parts.push(place);
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

export default function PersonalOsPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const planId = Number(params.id);
  const { data: plan, pageReady, profileId, setData: setPlan } = useBizOsFetch(
    (id) => bizOsService.getPlan(id, planId),
    null as BattlePlan | null,
    planId,
  );
  const [note, setNote] = useState("");
  const [busyKind, setBusyKind] = useState<BusyKind | null>(null);
  const [taskWorking, setTaskWorking] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [calendarsOpen, setCalendarsOpen] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "working" | "copied">("idle");
  const [mobilePane, setMobilePane] = useState<"chat" | "plan">("chat");
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

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("calendars") === "1") {
      setCalendarsOpen(true);
    }
  }, []);

  function pushOwnerLine(messageText: string) {
    if (!plan) return;
    const optimistic: BattlePlanLog = {
      id: -Date.now(),
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

  async function sendNote() {
    const text = note.trim();
    if (!profileId || !text || busy) return;
    setNote("");
    const server = await runWithOwnerTurn("send", text, () =>
      bizOsService.addMessage(profileId, planId, text),
    );
    if (!server) setNote(text);
  }

  async function approve() {
    if (!profileId || busy) return;
    if (unsent) {
      setHint("Send that message first, or clear it, then make it live.");
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

  async function share() {
    if (!profileId || plan?.status !== "active" || shareState === "working") return;
    setShareState("working");
    try {
      const shared = await bizOsService.sharePlan(profileId, planId);
      await navigator.clipboard.writeText(shared.url);
      setShareState("copied");
      toast.success("Share link copied. RSVP via Sky rides along quietly.");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch (err) {
      setShareState("idle");
      toast.error(err instanceof Error ? err.message : "Couldn't share.");
    }
  }

  if (!pageReady) return <BizOsSkeleton />;
  if (!plan) {
    return (
      <BizOsPage>
        <BizOsHeader
          title="myPLAN"
          description="This plan could not be loaded."
          back={{ href: "/personal-os/plans", label: "myPLANS" }}
        />
      </BizOsPage>
    );
  }

  const draft = plan.status === "draft";
  const live = plan.status === "active";
  const tasks = plan.tasks || [];
  const logs = plan.logs || [];
  const done = live ? tasks.filter((t) => t.status === "completed").length : 0;
  const total = tasks.length;

  return (
    <BizOsPage className="flex h-full min-h-0 flex-1 flex-col gap-3 space-y-0 overflow-hidden lg:gap-6">
      <div className="shrink-0 space-y-3">
        <BizOsHeader
          title={plan.title}
          description={plan.description || "Tell Sky what you’re working on. She drafts a plan, you shape it."}
          back={{ href: "/personal-os/plans", label: "myPLANS" }}
          actions={
            <div className="flex items-center gap-1.5 sm:gap-2">
              {live ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={shareState === "working" ? "Copying share link" : shareState === "copied" ? "Copied" : "Share"}
                  disabled={shareState === "working"}
                  onClick={() => void share()}
                >
                  {shareState === "working" ? (
                    <Loader2 className="animate-spin" />
                  ) : shareState === "copied" ? (
                    <Check />
                  ) : (
                    <Share2 />
                  )}
                  <span className="hidden sm:inline">
                    {shareState === "working" ? "Copying…" : shareState === "copied" ? "Copied" : "Share"}
                  </span>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Calendars"
                onClick={() => setCalendarsOpen(true)}
              >
                <CalendarDays />
                <span className="hidden sm:inline">Calendars</span>
              </Button>
            </div>
          }
        />
        <PlanPaneSwitch value={mobilePane} onChange={setMobilePane} />
        <PlanCalendarsDialog
          open={calendarsOpen}
          onOpenChange={setCalendarsOpen}
          profileId={profileId}
          planId={planId}
          busy={busy}
          onBusyChange={(next) => setBusyKind(next ? "calendar" : null)}
          onSynced={async () => {
            if (!profileId) return;
            const next = await bizOsService.getPlan(profileId, planId);
            setPlan((current) => mergeFetchedPlan(current, next, inflightTasks.current));
          }}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 items-stretch gap-4 overflow-hidden lg:grid-cols-2 lg:grid-rows-none">
        <BizOsCard
          padded={false}
          className={cn(
            "min-h-0 flex-col overflow-hidden lg:order-1 lg:flex",
            mobilePane === "chat" ? "flex" : "max-lg:!hidden",
          )}
        >
          <div
            className="flex shrink-0 items-center gap-2 border-b px-4 py-3"
            style={{ borderColor: "var(--asksky-panel-border)" }}
            data-asksky-theme="light"
          >
            <SkyAvatar size={28} />
            <p className="text-sm font-semibold">{draft ? "Start a plan" : "Plan conversation"}</p>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 text-sm">
            <PersonalPlanThread logs={logs} skyWorkingText={skyWorkingText} />
            <div ref={logEndRef} />
          </div>
          <form
            className="shrink-0 p-3"
            style={{ borderTop: "1px solid var(--asksky-panel-border)" }}
            data-asksky-theme="light"
            onSubmit={(e) => {
              e.preventDefault();
              void sendNote();
            }}
          >
            <div className="flex items-end gap-2">
              <AskSkyGrowTextarea
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
                    : draft
                      ? "Tell Sky what you’re working on…"
                      : "Ask about a task, or what to do next…"
                }
                disabled={busy}
              />
              <Button
                type="submit"
                size="icon"
                className="asksky-sky-send mb-0.5 h-11 w-11 shrink-0 rounded-full"
                disabled={busy || !note.trim()}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {hint ? <p className="mt-2 text-xs text-amber-700">{hint}</p> : null}
          </form>
        </BizOsCard>

        <BizOsCard
          className={cn(
            "min-h-0 flex-col overflow-hidden lg:order-2 lg:flex",
            mobilePane === "plan" ? "flex" : "max-lg:!hidden",
          )}
        >
          <div className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">
                <span className="lg:hidden">Steps</span>
                <span className="hidden lg:inline">{plan.title}</span>
              </h2>
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
              <p className="mt-1 text-xs text-slate-400">Proposal — not tracked until you make it live.</p>
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
              <Button type="button" variant="primary" disabled={busy || !total} onClick={() => void approve()}>
                Make it live
              </Button>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void keepEditing()}>
                Keep editing
              </Button>
            </div>
          ) : null}
        </BizOsCard>
      </div>
    </BizOsPage>
  );
}
