import { hasAdminSession } from "@/features/admin/server/auth";
import { importMarketingPackage, marketingImportErrorCode } from "@/features/marketing/server/importJob";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { manifestFileId?: unknown };
    if (typeof body.manifestFileId !== "string" || !/^[A-Za-z0-9_-]{10,160}$/.test(body.manifestFileId)) return Response.json({ error: "manifest_file_id_invalid" }, { status: 400 });
    return Response.json({ ok: true, ...(await importMarketingPackage(body.manifestFileId, undefined, "admin")) });
  } catch (error) {
    return Response.json({ error: marketingImportErrorCode(error) }, { status: 422 });
  }
}
