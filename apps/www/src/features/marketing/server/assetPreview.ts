import "server-only";

import { and, eq } from "drizzle-orm";
import { db, marketingContentAssets, marketingContents } from "@newland/db";
import { AssetPreviewError, verifyAssetPreviewBytes } from "../assetPreviewValidation";
import { MAX_MARKETING_IMAGE_BYTES } from "./assetValidation";
import { createMarketingDriveClient, DriveError, type MarketingDriveClient } from "./drive";

export { AssetPreviewError } from "../assetPreviewValidation";

export async function loadCurrentMarketingAssetPreview(contentId: number, assetId: number, drive: MarketingDriveClient = createMarketingDriveClient()) {
  const [asset] = await db.select({
    id: marketingContentAssets.id,
    driveFileId: marketingContentAssets.driveFileId,
    mimeType: marketingContentAssets.mimeType,
    byteSize: marketingContentAssets.byteSize,
    sha256: marketingContentAssets.sha256,
  }).from(marketingContents).innerJoin(
    marketingContentAssets,
    eq(marketingContentAssets.versionId, marketingContents.currentVersionId),
  ).where(and(eq(marketingContents.id, contentId), eq(marketingContentAssets.id, assetId))).limit(1);
  if (!asset) throw new AssetPreviewError("ASSET_NOT_FOUND");
  try {
    const meta = await drive.metadata(asset.driveFileId);
    if (!(await drive.isWithinOperationsFolder(asset.driveFileId))) throw new AssetPreviewError("ASSET_INTEGRITY_MISMATCH");
    const bytes = await drive.download(asset.driveFileId, MAX_MARKETING_IMAGE_BYTES);
    return verifyAssetPreviewBytes(asset, meta, bytes, MAX_MARKETING_IMAGE_BYTES);
  } catch (error) {
    if (error instanceof AssetPreviewError) throw error;
    if (error instanceof DriveError) throw new AssetPreviewError("DRIVE_PREVIEW_UNAVAILABLE");
    throw error;
  }
}
