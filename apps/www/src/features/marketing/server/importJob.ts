import { and, desc, eq, sql } from "drizzle-orm";
import { db, marketingAuditLogs, marketingChannelSchedules, marketingContentAssets, marketingContents, marketingContentVersions } from "@newland/db";
import type { MarketingDriveClient } from "./drive";
import { ManifestError } from "./packageManifest";
import { prepareMarketingPackage, type PreparedMarketingPackage } from "./packagePreparation";

function safeCode(error: unknown) {
  if (error instanceof ManifestError) return error.code;
  if (error instanceof Error && /^[A-Z0-9_:-]{1,100}$/.test(error.message)) return error.message.slice(0, 100);
  return error instanceof Error ? error.name.slice(0, 100) : "IMPORT_FAILED";
}

export async function persistMarketingPackage(prepared: PreparedMarketingPackage, actor = "chatgpt_work") {
  const existing = await db.select({ id: marketingContentVersions.id, contentId: marketingContentVersions.contentId }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, prepared.manifest.packageId)).limit(1);
  if (existing[0]) return { duplicate: true, versionId: existing[0].id, contentId: existing[0].contentId };

  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${prepared.manifest.content.slug}))`);
      await tx.insert(marketingContents).values({
        slug: prepared.manifest.content.slug,
        title: prepared.manifest.content.title,
        campaignKey: prepared.manifest.content.campaignKey,
        ctaKind: prepared.manifest.content.ctaKind,
        naverCategory: prepared.manifest.content.naverCategory,
      }).onConflictDoNothing({ target: marketingContents.slug });
      const [content] = await tx.select().from(marketingContents).where(eq(marketingContents.slug, prepared.manifest.content.slug)).limit(1);
      if (!content) throw new Error("CONTENT_CREATE_FAILED");
      const [latest] = await tx.select({ version: marketingContentVersions.version }).from(marketingContentVersions).where(eq(marketingContentVersions.contentId, content.id)).orderBy(desc(marketingContentVersions.version)).limit(1);
      const [version] = await tx.insert(marketingContentVersions).values({
        contentId: content.id,
        version: (latest?.version ?? 0) + 1,
        status: "review_pending",
        naverBody: prepared.naverBody,
        metaCaption: prepared.metaCaption,
        threadsPosts: prepared.threadsPosts,
        sourcePackageId: prepared.manifest.packageId,
        driveFolderId: prepared.manifest.driveFolderId,
        canvaDesignUrl: prepared.manifest.canvaDesignUrl,
        createdBy: actor,
        revisionNote: "Drive 콘텐츠 패키지 가져오기",
      }).returning({ id: marketingContentVersions.id });
      await tx.insert(marketingContentAssets).values(prepared.assets.map((asset, index) => ({
        versionId: version.id, position: index + 1, driveFileId: asset.driveFileId, filename: asset.filename,
        mimeType: asset.mimeType, byteSize: asset.byteSize, sha256: asset.sha256, width: asset.width, height: asset.height,
      })));
      await tx.insert(marketingChannelSchedules).values(prepared.manifest.schedules.map((schedule) => ({
        contentId: content.id, versionId: version.id, channel: schedule.channel, scheduledAt: new Date(schedule.scheduledAt),
        mode: schedule.mode, utmUrl: schedule.utmUrl, status: "approval_pending",
      })));
      await tx.update(marketingContents).set({ currentVersionId: version.id, updatedAt: new Date() }).where(and(eq(marketingContents.id, content.id), eq(marketingContents.slug, prepared.manifest.content.slug)));
      await tx.insert(marketingAuditLogs).values({ contentId: content.id, versionId: version.id, actor, action: "package_imported", details: { packageId: prepared.manifest.packageId, assetCount: prepared.assets.length } });
      return { duplicate: false, versionId: version.id, contentId: content.id };
    });
  } catch (error) {
    const duplicate = await db.select({ id: marketingContentVersions.id, contentId: marketingContentVersions.contentId }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, prepared.manifest.packageId)).limit(1);
    if (duplicate[0]) return { duplicate: true, versionId: duplicate[0].id, contentId: duplicate[0].contentId };
    throw error;
  }
}

export async function importMarketingPackage(manifestFileId: string, client?: MarketingDriveClient, actor = "chatgpt_work") {
  try {
    return await persistMarketingPackage(await prepareMarketingPackage(manifestFileId, client), actor);
  } catch (error) {
    await db.insert(marketingAuditLogs).values({ actor, action: "package_import_failed", details: { errorCode: safeCode(error) } }).catch(() => undefined);
    throw error;
  }
}

export function marketingImportErrorCode(error: unknown) { return safeCode(error); }
