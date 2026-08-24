import { hasAdminSession } from "@/features/admin/server/auth";
import { AssetValidationError, createAssetRevision, MAX_MARKETING_UPLOAD_BYTES } from "@/features/marketing/server/assets";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_MARKETING_UPLOAD_BYTES + 1024 * 1024) return Response.json({ error: "UPLOAD_SIZE_INVALID" }, { status: 413 });
  try {
    const contentId = Number((await params).id);
    if (!Number.isSafeInteger(contentId) || contentId <= 0) return Response.json({ error: "content_id_invalid" }, { status: 400 });
    const form = await request.formData();
    const uploadId = form.get("uploadId");
    const revisionNote = form.get("revisionNote");
    const cards = form.getAll("cards");
    if (typeof uploadId !== "string" || (revisionNote !== null && typeof revisionNote !== "string") || cards.some((card) => !(card instanceof File))) return Response.json({ error: "upload_invalid" }, { status: 400 });
    const files = await Promise.all((cards as File[]).map(async (file) => ({ name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) })));
    return Response.json({ ok: true, ...(await createAssetRevision({ contentId, uploadId, revisionNote: revisionNote ?? "", files })) });
  } catch (error) {
    return Response.json({ error: error instanceof AssetValidationError ? error.code : "asset_upload_failed" }, { status: 422 });
  }
}
