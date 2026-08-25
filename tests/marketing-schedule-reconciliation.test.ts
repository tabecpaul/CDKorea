import assert from "node:assert/strict";
import test from "node:test";
import type { ContentPackageManifest } from "../apps/www/src/features/marketing/server/packageManifest.ts";
import { reconcileWeeklySchedule } from "../apps/www/src/features/marketing/server/reconciliation.ts";
import type { WeeklyContentPlan } from "../apps/www/src/features/marketing/server/weeklyPlan.ts";

const plan: WeeklyContentPlan = {
  schemaVersion: 1,
  weekStart: "2026-08-31",
  items: [
    { slug: "ready", title: "준비 완료", campaignKey: "campaign_key", status: "approved", schedules: [{ channel: "naver", scheduledAt: "2026-08-31T07:40:00+09:00" }] },
    { slug: "missing", title: "패키지 없음", campaignKey: "campaign_key", status: "approved", schedules: [{ channel: "threads", scheduledAt: "2026-09-01T10:00:00+09:00" }] },
    { slug: "held", title: "보류", campaignKey: "campaign_key", status: "on_hold", note: "관리자 보류", schedules: [{ channel: "facebook", scheduledAt: "2026-09-02T19:00:00+09:00" }] },
  ],
};

const manifest = {
  schemaVersion: 1, packageId: "pkg-ready", driveFolderId: "drive_folder_12345",
  content: { slug: "ready", title: "준비 완료", campaignKey: "campaign_key", ctaKind: "career-check", naverCategory: "이직·커리어 전환" },
  files: { naver: "drive_naver_file", meta: "drive_meta_file_1", threads: "drive_threads_01", images: ["drive_image_01", "drive_image_02", "drive_image_03", "drive_image_04"] },
  schedules: [{ channel: "naver", scheduledAt: "2026-08-31T07:40:00+09:00", mode: "manual", utmUrl: "https://start.careerdirect.kr/career-check?utm_source=naver&utm_medium=organic_social&utm_campaign=campaign_key" }],
} satisfies ContentPackageManifest;

test("separates imported, missing and completed or held items", () => {
  const result = reconcileWeeklySchedule(plan, [manifest], [{ packageId: "pkg-ready", slug: "ready", campaignKey: "campaign_key", channel: "naver", scheduledAt: "2026-08-30T22:40:00.000Z" }]);
  assert.deepEqual(result.imported.map((item) => item.slug), ["ready"]);
  assert.deepEqual(result.missing.map((item) => [item.slug, item.reason]), [["missing", "PACKAGE_MISSING"]]);
  assert.deepEqual(result.completedOrHeld.map((item) => item.slug), ["held"]);
});

test("reports identifier and import mismatches", () => {
  const wrongCampaign = { ...manifest, content: { ...manifest.content, campaignKey: "other_campaign" } };
  const identifier = reconcileWeeklySchedule({ ...plan, items: [plan.items[0]] }, [wrongCampaign], []);
  assert.equal(identifier.missing[0].reason, "IDENTIFIER_MISMATCH");
  const notImported = reconcileWeeklySchedule({ ...plan, items: [plan.items[0]] }, [manifest], []);
  assert.equal(notImported.missing[0].reason, "IMPORT_FAILED");
});
