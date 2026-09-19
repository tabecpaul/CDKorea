import { createMarketingDriveClient, readDriveText, type MarketingDriveClient } from "./drive";
import { parseContentPackageManifest, type ContentPackageManifest } from "./packageManifest";
import { getImportedSchedulesForWeek } from "./queries";
import { reconcileWeeklySchedule } from "./reconciliation";
import { loadWeeklyContentPlan } from "./weeklyPlanDrive";
import { shouldAutoImportManifest } from "./automaticImportPolicy";

export async function collectWeeklyReconciliation(
  weekStart: string,
  drive: MarketingDriveClient = createMarketingDriveClient(),
) {
  const plan = await loadWeeklyContentPlan(drive, weekStart);
  const manifestIds = await drive.listManifestFiles();
  const manifests: ContentPackageManifest[] = [];
  let rejectedManifests = 0;
  for (const id of manifestIds) {
    try {
      const raw = JSON.parse(await readDriveText(drive, id)) as unknown;
      if (!shouldAutoImportManifest(raw)) continue;
      manifests.push(parseContentPackageManifest(raw));
    } catch {
      rejectedManifests += 1;
    }
  }
  const result = reconcileWeeklySchedule(plan, manifests, await getImportedSchedulesForWeek(weekStart));
  return { ...result, rejectedManifests };
}
