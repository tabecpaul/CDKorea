import assert from "node:assert/strict";
import test from "node:test";
import { collectLatestSuccessfulRuns } from "../apps/www/src/features/operations-monitor/server/latestSuccessfulRuns.ts";
import type { MonitoredJobName } from "../apps/www/src/features/operations-monitor/domain.ts";

test("looks up the latest success independently for every monitored job", async () => {
  const operationsCompletedAt = new Date("2026-08-16T00:00:04Z");
  const completedAt = new Map<MonitoredJobName, Date>([
    ["lead-emails", new Date("2026-08-17T00:00:01Z")],
    ["callback-reminders", new Date("2026-08-16T23:55:03Z")],
    ["operations-monitor", operationsCompletedAt],
  ]);
  const calls: MonitoredJobName[] = [];

  const result = await collectLatestSuccessfulRuns(
    ["lead-emails", "callback-reminders", "operations-monitor"],
    async (jobName) => {
      calls.push(jobName);
      return completedAt.get(jobName) ?? null;
    },
  );

  assert.deepEqual(calls.sort(), ["callback-reminders", "lead-emails", "operations-monitor"]);
  assert.equal(result.find((run) => run.jobName === "operations-monitor")?.completedAt, operationsCompletedAt);
});

test("returns null only for a job with no successful run", async () => {
  const result = await collectLatestSuccessfulRuns(
    ["lead-emails", "operations-monitor"],
    async (jobName) => jobName === "lead-emails" ? new Date("2026-08-17T00:00:01Z") : null,
  );

  assert.equal(result[0]?.jobName, "lead-emails");
  assert.equal(result[1]?.jobName, "operations-monitor");
  assert.equal(result[1]?.completedAt, null);
});
