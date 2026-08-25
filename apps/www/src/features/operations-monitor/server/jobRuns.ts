import { and, desc, eq } from "drizzle-orm";
import { db, systemJobRuns } from "@newland/db";
import { monitoredJobNames, type MonitoredJobName, type SystemJobName } from "../domain";
import { collectLatestSuccessfulRuns } from "./latestSuccessfulRuns";

function safeErrorCode(value: unknown) {
  return value instanceof Error ? (value.message || value.name).slice(0, 80) : "JOB_FAILED";
}

export async function startJobRun(jobName: SystemJobName) {
  if (![...monitoredJobNames, "marketing-import", "marketing-reconciliation"].includes(jobName)) throw new Error("JOB_NAME_INVALID");
  const [run] = await db.insert(systemJobRuns).values({ jobName }).returning({ id: systemJobRuns.id });
  return run.id;
}

export async function hasSentMarketingReconciliation(weekStart: string) {
  const runs = await db.select({ summary: systemJobRuns.summary }).from(systemJobRuns)
    .where(and(eq(systemJobRuns.jobName, "marketing-reconciliation"), eq(systemJobRuns.status, "succeeded")))
    .orderBy(desc(systemJobRuns.completedAt))
    .limit(20);
  return runs.some((run) => run.summary?.weekStart === weekStart && run.summary.notified === "yes");
}

export async function completeJobRun(id: number, summary: Record<string, number | string | null> = {}) {
  await db.update(systemJobRuns).set({ status: "succeeded", completedAt: new Date(), summary, errorCode: null }).where(and(eq(systemJobRuns.id, id), eq(systemJobRuns.status, "running")));
}

export async function failJobRun(id: number, error: unknown) {
  await db.update(systemJobRuns).set({ status: "failed", completedAt: new Date(), errorCode: safeErrorCode(error) }).where(and(eq(systemJobRuns.id, id), eq(systemJobRuns.status, "running")));
}

export async function latestSuccessfulRuns(jobNames: readonly MonitoredJobName[] = monitoredJobNames) {
  return collectLatestSuccessfulRuns(jobNames, async (jobName) => {
    const run = await db.query.systemJobRuns.findFirst({
      where: and(eq(systemJobRuns.jobName, jobName), eq(systemJobRuns.status, "succeeded")),
      orderBy: [desc(systemJobRuns.completedAt)],
    });
    return run?.completedAt ?? null;
  });
}
