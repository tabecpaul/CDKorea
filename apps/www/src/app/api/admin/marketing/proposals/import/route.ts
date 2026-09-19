import { hasAdminSession } from "@/features/admin/server/auth";
import { importProposalPackage } from "@/features/marketing/server/proposalImportJob";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { manifestFileId?: unknown };
    if (typeof body.manifestFileId !== "string" || !/^[A-Za-z0-9_-]{10,160}$/.test(body.manifestFileId)) return Response.json({ error: "manifest_file_id_invalid" }, { status: 400 });
    return Response.json({ ok: true, ...(await importProposalPackage(body.manifestFileId)) });
  } catch (error) {
    const code = error instanceof Error && /^[A-Z0-9_]{2,100}$/.test(error.message) ? error.message : "PROPOSAL_IMPORT_FAILED";
    return Response.json({ error: code }, { status: 422 });
  }
}
