import { collectWeeklyReconciliation } from "@/features/marketing/server/reconciliationService";
import { sendReconciliationEmail } from "@/features/marketing/server/reconciliationEmail";
import { nextKstWeekStart } from "@/features/marketing/server/weeklyPlan";
import { completeJobRun, failJobRun, hasSentMarketingReconciliation, startJobRun } from "@/features/operations-monitor/server/jobRuns";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });

  const weekStart = nextKstWeekStart();
  if (await hasSentMarketingReconciliation(weekStart)) return Response.json({ ok: true, weekStart, notified: false, duplicate: true });

  const runId = await startJobRun("marketing-reconciliation");
  try {
    const snapshot = await collectWeeklyReconciliation(weekStart);
    const email = await sendReconciliationEmail(snapshot);
    if (!email.ok) {
      await failJobRun(runId, new Error(email.errorCode));
      return Response.json({ error: "notification_failed", weekStart }, { status: 503 });
    }
    await completeJobRun(runId, {
      weekStart,
      imported: snapshot.imported.length,
      missing: snapshot.missing.length,
      completedOrHeld: snapshot.completedOrHeld.length,
      rejectedManifests: snapshot.rejectedManifests,
      notified: "yes",
    });
    return Response.json({
      ok: true,
      weekStart,
      imported: snapshot.imported.length,
      missing: snapshot.missing.length,
      completedOrHeld: snapshot.completedOrHeld.length,
      rejectedManifests: snapshot.rejectedManifests,
      notified: true,
      duplicate: false,
    });
  } catch (error) {
    await failJobRun(runId, error).catch(() => undefined);
    console.error("Marketing reconciliation cron failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "marketing_reconciliation_failed", weekStart }, { status: 500 });
  }
}
