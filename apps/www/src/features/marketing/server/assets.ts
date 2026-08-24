import { desc, eq, sql } from "drizzle-orm";
import { db, marketingAuditLogs, marketingChannelSchedules, marketingContentAssets, marketingContents, marketingContentVersions } from "@newland/db";
import { createMarketingDriveClient, type MarketingDriveClient } from "./drive";
import { AssetValidationError, MAX_MARKETING_UPLOAD_BYTES, validateAssetCount, validateMarketingPng } from "./assetValidation";
export { AssetValidationError, MAX_MARKETING_IMAGE_BYTES, MAX_MARKETING_UPLOAD_BYTES, validateAssetCount, validateMarketingPng } from "./assetValidation";

export async function createAssetRevision(input: { contentId: number; uploadId: string; revisionNote: string; files: Array<{ name: string; type: string; bytes: Uint8Array }> }, drive: MarketingDriveClient = createMarketingDriveClient()) {
  validateAssetCount(input.files.length);
  if (!/^[0-9a-f-]{36}$/i.test(input.uploadId)) throw new AssetValidationError("UPLOAD_ID_INVALID", "uploadId");
  if (input.revisionNote.length > 500) throw new AssetValidationError("REVISION_NOTE_INVALID", "revisionNote");
  const sourcePackageId = `manual-upload-${input.contentId}-${input.uploadId}`;
  const duplicate = await db.select({ id: marketingContentVersions.id }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, sourcePackageId)).limit(1);
  if (duplicate[0]) return { duplicate: true, versionId: duplicate[0].id };
  const [content] = await db.select().from(marketingContents).where(eq(marketingContents.id, input.contentId)).limit(1);
  if (!content?.currentVersionId) throw new AssetValidationError("CONTENT_VERSION_NOT_FOUND", "contentId");
  const [current] = await db.select().from(marketingContentVersions).where(eq(marketingContentVersions.id, content.currentVersionId)).limit(1);
  if (!current || current.status === "published") throw new AssetValidationError("CONTENT_NOT_EDITABLE", "contentId");
  if (!current.driveFolderId) throw new AssetValidationError("DRIVE_FOLDER_MISSING", "contentId");
  const assets = input.files.map((file, index) => validateMarketingPng(file.bytes, `slide-${String(index + 1).padStart(2, "0")}.png`, file.type));
  if (assets.reduce((sum, asset) => sum + asset.byteSize, 0) > MAX_MARKETING_UPLOAD_BYTES) throw new AssetValidationError("UPLOAD_SIZE_INVALID", "images");
  const folderId = await drive.createFolder(`manual-${input.uploadId}`, current.driveFolderId);
  const uploadedIds: string[] = [];
  for (const asset of assets) uploadedIds.push(await drive.upload(asset.filename, folderId, asset.mimeType, asset.bytes));
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${content.slug}))`);
    const again = await tx.select({ id: marketingContentVersions.id }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, sourcePackageId)).limit(1);
    if (again[0]) return { duplicate: true, versionId: again[0].id };
    const [latest] = await tx.select({ version: marketingContentVersions.version }).from(marketingContentVersions).where(eq(marketingContentVersions.contentId, content.id)).orderBy(desc(marketingContentVersions.version)).limit(1);
    const [version] = await tx.insert(marketingContentVersions).values({
      contentId: content.id, version: (latest?.version ?? 0) + 1, status: "review_pending", naverBody: current.naverBody,
      metaCaption: current.metaCaption, threadsPosts: current.threadsPosts, sourcePackageId, driveFolderId: folderId,
      canvaDesignUrl: current.canvaDesignUrl, createdBy: "admin", revisionNote: input.revisionNote.trim() || "Canva 수정본 업로드",
    }).returning({ id: marketingContentVersions.id });
    await tx.insert(marketingContentAssets).values(assets.map((asset, index) => ({ versionId: version.id, position: index + 1, driveFileId: uploadedIds[index], filename: asset.filename, mimeType: asset.mimeType, byteSize: asset.byteSize, sha256: asset.sha256, width: asset.width, height: asset.height })));
    const schedules = await tx.select().from(marketingChannelSchedules).where(eq(marketingChannelSchedules.versionId, current.id));
    if (schedules.length) await tx.insert(marketingChannelSchedules).values(schedules.map((schedule) => ({ contentId: content.id, versionId: version.id, channel: schedule.channel, scheduledAt: schedule.scheduledAt, mode: schedule.mode, utmUrl: schedule.utmUrl, status: "approval_pending" })));
    await tx.update(marketingContents).set({ currentVersionId: version.id, updatedAt: new Date() }).where(eq(marketingContents.id, content.id));
    await tx.insert(marketingAuditLogs).values({ contentId: content.id, versionId: version.id, actor: "admin", action: "asset_revision_uploaded", details: { assetCount: assets.length, sourcePackageId } });
    return { duplicate: false, versionId: version.id };
  });
}
