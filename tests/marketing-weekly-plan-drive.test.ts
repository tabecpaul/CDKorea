import assert from "node:assert/strict";
import test from "node:test";
import type { DriveFileMeta, MarketingDriveClient } from "../apps/www/src/features/marketing/server/drive.ts";
import { loadWeeklyContentPlan, WeeklyPlanDriveError } from "../apps/www/src/features/marketing/server/weeklyPlanDrive.ts";

const plan = (weekStart: string) => JSON.stringify({ schemaVersion: 1, weekStart, items: [{ slug: "career-topic", title: "제목", campaignKey: "campaign_key", status: "approved", schedules: [{ channel: "naver", scheduledAt: `${weekStart}T07:40:00+09:00` }] }] });

function drive(files: Record<string, string>): MarketingDriveClient {
  return {
    async metadata(id): Promise<DriveFileMeta> { return { id, name: "weekly-content-plan.json", mimeType: "application/json", size: files[id].length, parents: ["operations_folder"] }; },
    async download(id) { return new TextEncoder().encode(files[id]); },
    async isWithinOperationsFolder() { return true; },
    async createFolder() { throw new Error("not used"); }, async upload() { throw new Error("not used"); },
    async listManifestFiles() { return []; }, async listWeeklyPlanFiles() { return Object.keys(files); },
  };
}

test("loads exactly one plan for the requested week", async () => {
  const result = await loadWeeklyContentPlan(drive({ old: plan("2026-08-24"), next: plan("2026-08-31") }), "2026-08-31");
  assert.equal(result.weekStart, "2026-08-31");
});

test("rejects missing and duplicate weekly plans", async () => {
  await assert.rejects(() => loadWeeklyContentPlan(drive({ old: plan("2026-08-24") }), "2026-08-31"), (error) => error instanceof WeeklyPlanDriveError && error.code === "WEEKLY_PLAN_NOT_FOUND");
  await assert.rejects(() => loadWeeklyContentPlan(drive({ one: plan("2026-08-31"), two: plan("2026-08-31") }), "2026-08-31"), (error) => error instanceof WeeklyPlanDriveError && error.code === "WEEKLY_PLAN_DUPLICATE");
});
