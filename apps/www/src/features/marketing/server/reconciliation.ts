import type { ContentPackageManifest } from "./packageManifest";
import type { WeeklyContentPlan, WeeklyPlanItem } from "./weeklyPlan";

export const reconciliationReasons = ["PACKAGE_MISSING", "IMPORT_FAILED", "IDENTIFIER_MISMATCH", "SOURCE_UNCONFIRMED"] as const;
export type ReconciliationReason = (typeof reconciliationReasons)[number];
export type ImportedSchedule = { packageId: string | null; slug: string; campaignKey: string; channel: string; scheduledAt: string };
export type ReconciliationEntry = { slug: string; title: string; campaignKey: string; note?: string; reason?: ReconciliationReason };
export type ReconciliationResult = {
  weekStart: string;
  imported: ReconciliationEntry[];
  missing: ReconciliationEntry[];
  completedOrHeld: ReconciliationEntry[];
};

function entry(item: WeeklyPlanItem, reason?: ReconciliationReason): ReconciliationEntry {
  return { slug: item.slug, title: item.title, campaignKey: item.campaignKey, ...(item.note ? { note: item.note } : {}), ...(reason ? { reason } : {}) };
}

function scheduleKey(channel: string, scheduledAt: string) {
  return `${channel}:${new Date(scheduledAt).toISOString()}`;
}

function sameSchedules(item: WeeklyPlanItem, values: Array<{ channel: string; scheduledAt: string }>) {
  const expected = new Set(item.schedules.map((schedule) => scheduleKey(schedule.channel, schedule.scheduledAt)));
  const actual = new Set(values.map((schedule) => scheduleKey(schedule.channel, schedule.scheduledAt)));
  return expected.size === actual.size && [...expected].every((key) => actual.has(key));
}

export function reconcileWeeklySchedule(plan: WeeklyContentPlan, manifests: ContentPackageManifest[], importedSchedules: ImportedSchedule[]): ReconciliationResult {
  const result: ReconciliationResult = { weekStart: plan.weekStart, imported: [], missing: [], completedOrHeld: [] };
  for (const item of plan.items) {
    if (item.status !== "approved") {
      result.completedOrHeld.push(entry(item));
      continue;
    }
    const exactManifest = manifests.find((manifest) => manifest.content.slug === item.slug && manifest.content.campaignKey === item.campaignKey);
    if (!exactManifest) {
      const conflicting = manifests.some((manifest) => manifest.content.slug === item.slug || manifest.content.title === item.title);
      result.missing.push(entry(item, conflicting ? "IDENTIFIER_MISMATCH" : "PACKAGE_MISSING"));
      continue;
    }
    if (!sameSchedules(item, exactManifest.schedules)) {
      result.missing.push(entry(item, "IDENTIFIER_MISMATCH"));
      continue;
    }
    const rows = importedSchedules.filter((row) => row.slug === item.slug && row.campaignKey === item.campaignKey && row.packageId === exactManifest.packageId);
    if (!sameSchedules(item, rows)) {
      result.missing.push(entry(item, "IMPORT_FAILED"));
      continue;
    }
    result.imported.push(entry(item));
  }
  return result;
}
