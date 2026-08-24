import { createMarketingDriveClient } from "@/features/marketing/server/drive";
import { importMarketingPackage, marketingImportErrorCode } from "@/features/marketing/server/importJob";
import { completeJobRun, failJobRun, startJobRun } from "@/features/operations-monitor/server/jobRuns";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const runId = await startJobRun("marketing-import");
  try {
    const drive = createMarketingDriveClient();
    const manifestIds = await drive.listManifestFiles();
    const summary = { imported: 0, duplicate: 0, rejected: 0 };
    const errors: string[] = [];
    for (const manifestId of manifestIds) {
      try {
        const result = await importMarketingPackage(manifestId, drive, "chatgpt_work");
        summary[result.duplicate ? "duplicate" : "imported"] += 1;
      } catch (error) {
        summary.rejected += 1;
        errors.push(marketingImportErrorCode(error));
      }
    }
    await completeJobRun(runId, summary);
    return Response.json({ ok: true, ...summary, errorCodes: [...new Set(errors)].slice(0, 10) });
  } catch (error) {
    await failJobRun(runId, error).catch(() => undefined);
    return Response.json({ error: "marketing_import_failed" }, { status: 500 });
  }
}
