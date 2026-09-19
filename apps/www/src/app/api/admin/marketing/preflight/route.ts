import { hasAdminSession } from "@/features/admin/server/auth";
import { prepareMarketingPackage } from "@/features/marketing/server/packagePreparation";
import { prepareProposalPackage } from "@/features/marketing/server/proposalImportJob";

export async function GET(request: Request) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const manifestFileId = url.searchParams.get("manifestFileId");
  if ((kind !== "proposal" && kind !== "produced") || !manifestFileId || !/^[A-Za-z0-9_-]{10,160}$/.test(manifestFileId)) return Response.json({ error: "invalid_preflight_request" }, { status: 400 });
  try {
    if (kind === "proposal") {
      const manifest = await prepareProposalPackage(manifestFileId);
      return Response.json({ ok: true, kind, packageId: manifest.packageId, title: manifest.content.title, proposedDate: manifest.content.proposedDate, sourceFileCount: manifest.recovery.sourceFileIds.length, schedules: 0, writes: 0 }, { headers: { "cache-control": "no-store" } });
    }
    const prepared = await prepareMarketingPackage(manifestFileId);
    return Response.json({ ok: true, kind, packageId: prepared.manifest.packageId, title: prepared.manifest.content.title, assetCount: prepared.assets.length, naverCopy: Boolean(prepared.naverBody), metaCopy: Boolean(prepared.metaCaption), threadsPosts: prepared.threadsPosts.length, schedules: prepared.manifest.schedules.length, writes: 0 }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error && /^[A-Z0-9_]{2,100}$/.test(error.message) ? error.message : error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "PREFLIGHT_FAILED";
    return Response.json({ error: code, writes: 0 }, { status: 422, headers: { "cache-control": "no-store" } });
  }
}
