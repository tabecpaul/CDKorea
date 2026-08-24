import { and, desc, eq } from "drizzle-orm";
import { db, systemJobRuns } from "@newland/db";
import { monitoredJobNames, type MonitoredJobName, type SystemJobName } from "../domain";
import { collectLatestSuccessfulRuns } from "./latestSuccessfulRuns";

function safeErrorCode(value: unknown) {
  return value instanceof Error ? (value.message || value.name).slice(0, 80) : "JOB_FAILED";
}

export async function startJobRun(jobName: SystemJobName) {
  if (![...monitoredJobNames, "marketing-import"].includes(jobName)) throw new Error("JOB_NAME_INVALID");
  const [run] = await db.insert(systemJobRuns).values({ jobName }).returning({ id: systemJobRuns.id });
  return run.id;
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
