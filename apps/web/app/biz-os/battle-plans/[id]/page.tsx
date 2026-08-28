"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { bizOsService } from "@/lib/services/biz-os";
import { useBizOsFetch } from "@/components/biz-os/use-biz-os-profile";
import {
  BizOsCard,
  BizOsHeader,
  BizOsPage,
  BizOsProgress,
  BizOsSkeleton,
} from "@/components/biz-os/biz-os-ui";
import { cn } from "@workspace/ui/lib/utils";

type PlanTask = {
  id: number;
  status: string;
  taskText: string;
  description?: string | null;
  actionHref?: string | null;
  targetDate?: string;
};

function TaskRow({
  task,
  onToggle,
}: {
  task: PlanTask;
  onToggle: (task: PlanTask) => void;
}) {
  const done = task.status === "completed";
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2.5 text-sm transition",
          done ? "border-emerald-100 bg-emerald-50/50" : "border-slate-200 hover:border-violet-200",
        )}
      >
        <input
          type="checkbox"
          className="mt-0.5"
          checked={done}
          onChange={() => onToggle(task)}
        />
        <span className="min-w-0 flex-1">
          <span className={done ? "text-slate-400 line-through" : "text-slate-800"}>
            {task.taskText}
            {task.targetDate ? (
              <span className="ml-2 text-xs text-slate-400">
                {new Date(task.targetDate).toLocaleDateString()}
              </span>
            ) : null}
          </span>
          {task.description ? (
            <span className="mt-1 block text-xs font-normal text-slate-500 no-underline">
              {task.description}
              {task.actionHref ? (
                <>
                  {" "}
                  <Link
                    href={task.actionHref}
                    className="font-medium text-violet-600 hover:text-violet-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open
                  </Link>
                </>
              ) : null}
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
}

export default function BattlePlanWorkspacePage() {
  const params = useParams<{ id: string }>();
  const planId = Number(params.id);
  const { data: plan, setData: setPlan, pageReady, profileId } = useBizOsFetch(
    (id) => bizOsService.getPlan(id, planId),
    null as any,
    planId,
  );
  const [note, setNote] = useState("");

  async function toggle(task: { id: number; status: string }) {
    if (!profileId) return;
    const next = task.status === "completed" ? "pending" : "completed";
    setPlan(await bizOsService.patchTask(profileId, planId, task.id, next));
  }

  async function sendNote() {
    if (!profileId || !note.trim()) return;
    setPlan(await bizOsService.addMessage(profileId, planId, note));
    setNote("");
  }

  async function requestTeam() {
    if (!profileId) return;
    await bizOsService.requestSupport(profileId, planId, "Owner requested JustMy Team Review.");
    setPlan(await bizOsService.getPlan(profileId, planId));
  }

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

  const done = plan.tasks?.filter((t: { status: string }) => t.status === "completed").length || 0;
  const total = plan.tasks?.length || 0;
  const openTasks = (plan.tasks || []).filter((t: { status: string }) => t.status !== "completed");
  const doneTasks = (plan.tasks || []).filter((t: { status: string }) => t.status === "completed");

  return (
    <BizOsPage>
      <BizOsHeader
        eyebrow={plan.primaryGoal || "Battle Plan"}
        title={plan.title}
        description={plan.description}
        actions={
          <Link className="text-sm font-medium text-violet-600 hover:text-violet-800" href="/biz-os/battle-plans">
            ← All plans
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <BizOsCard>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">
              {done} of {total} complete
            </span>
            <span className="font-semibold">{plan.progress}%</span>
          </div>
          <div className="mt-2">
            <BizOsProgress value={plan.progress} />
          </div>
          <ul className="mt-5 space-y-2">
            {openTasks.length ? (
              openTasks.map((t: PlanTask) => <TaskRow key={t.id} task={t} onToggle={(task) => void toggle(task)} />)
            ) : (
              <li className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-800">
                Everything on this plan is already done.
              </li>
            )}
          </ul>
          {doneTasks.length ? (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Already done ({doneTasks.length})
              </summary>
              <ul className="mt-2 space-y-2">
                {doneTasks.map((t: PlanTask) => (
                  <TaskRow key={t.id} task={t} onToggle={(task) => void toggle(task)} />
                ))}
              </ul>
            </details>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => void requestTeam()}>
              Request Team
            </Button>
            {plan.needsSupport ? (
              <p className="text-sm text-amber-700">FunCrew flagged · {plan.supportStatus}</p>
            ) : null}
          </div>
        </BizOsCard>
        <BizOsCard className="flex min-h-80 flex-col">
          <h2 className="font-semibold">Plan log</h2>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto text-sm">
            {plan.logs?.length ? (
              plan.logs.map((l: { id: number; senderName: string; messageText: string }) => (
                <div key={l.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-violet-700">{l.senderName}</p>
                  <p className="mt-0.5 text-slate-700">{l.messageText}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No notes yet. Leave the first one for your team.</p>
            )}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendNote();
            }}
          >
            <input
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
            />
            <Button type="submit">Send</Button>
          </form>
        </BizOsCard>
      </div>
    </BizOsPage>
  );
}
