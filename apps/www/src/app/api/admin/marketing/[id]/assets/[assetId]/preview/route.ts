import { hasAdminSession } from "@/features/admin/server/auth";
import { AssetPreviewError, loadCurrentMarketingAssetPreview } from "@/features/marketing/server/assetPreview";

function errorResponse(code: string, status: number) {
  return Response.json({ error: code }, { status, headers: { "cache-control": "private, no-store" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  if (!(await hasAdminSession())) return errorResponse("unauthorized", 401);
  const values = await params;
  const contentId = Number(values.id);
  const assetId = Number(values.assetId);
  if (!Number.isSafeInteger(contentId) || contentId <= 0 || !Number.isSafeInteger(assetId) || assetId <= 0) return errorResponse("asset_id_invalid", 400);
  try {
    const preview = await loadCurrentMarketingAssetPreview(contentId, assetId);
    return new Response(Buffer.from(preview.bytes), { headers: {
      "content-type": preview.mimeType,
      "content-length": String(preview.bytes.byteLength),
      "content-disposition": "inline",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof AssetPreviewError) {
      if (error.code === "ASSET_NOT_FOUND") return errorResponse(error.code, 404);
      if (error.code === "ASSET_INTEGRITY_MISMATCH") return errorResponse(error.code, 409);
      return errorResponse(error.code, 502);
    }
    return errorResponse("DRIVE_PREVIEW_UNAVAILABLE", 502);
  }
}
