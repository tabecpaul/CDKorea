import { and, desc, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db, marketingAuditLogs, marketingContentAssets, marketingContents, marketingContentVersions } from "@newland/db";
import type { MarketingDriveClient } from "./drive";
import { prepareProposalReviewPackage, type PreparedProposalReviewPackage } from "./proposalReviewPreparation";

export async function persistProposalReviewPackage(prepared: PreparedProposalReviewPackage, actor = "admin", manifestFileId?: string) {
  const [duplicate] = await db.select({ id: marketingContentVersions.id, contentId: marketingContentVersions.contentId }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, prepared.manifest.packageId)).limit(1);
  if (duplicate) return { duplicate: true, contentId: duplicate.contentId, versionId: duplicate.id };

  return db.transaction(async (tx) => {
    const [proposalVersion] = await tx.select().from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, prepared.manifest.proposalPackageId)).limit(1);
    if (!proposalVersion) throw new Error("SOURCE_PROPOSAL_NOT_FOUND");
    await tx.execute(sql`select pg_advisory_xact_lock(${proposalVersion.contentId})`);
    const [samePackage] = await tx.select({ id: marketingContentVersions.id, contentId: marketingContentVersions.contentId }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, prepared.manifest.packageId)).limit(1);
    if (samePackage) return { duplicate: true, contentId: samePackage.contentId, versionId: samePackage.id };
    const [content] = await tx.select().from(marketingContents).where(eq(marketingContents.id, proposalVersion.contentId)).limit(1);
    if (!content || content.currentVersionId !== proposalVersion.id || proposalVersion.status !== "proposal") throw new Error("SOURCE_PROPOSAL_STATE_CONFLICT");
    if (content.title !== prepared.manifest.content.title) throw new Error("SOURCE_PROPOSAL_TITLE_MISMATCH");
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
      createdBy: actor,
      revisionNote: "제안 콘텐츠 제작 완료 · 관리자 검토 대기",
    }).returning({ id: marketingContentVersions.id });
    await tx.insert(marketingContentAssets).values(prepared.assets.map((asset, index) => ({
      versionId: version.id,
      position: index + 1,
      driveFileId: asset.driveFileId,
      filename: asset.filename,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      sha256: asset.sha256,
      width: asset.width,
      height: asset.height,
    })));
    await tx.update(marketingContents).set({ currentVersionId: version.id, ctaKind: prepared.manifest.content.ctaKind, updatedAt: new Date() }).where(and(eq(marketingContents.id, content.id), eq(marketingContents.currentVersionId, proposalVersion.id)));
    await tx.insert(marketingAuditLogs).values({
      contentId: content.id,
      versionId: version.id,
      actor,
      action: "proposal_promoted_to_review",
      details: {
        packageId: prepared.manifest.packageId,
        proposalPackageId: prepared.manifest.proposalPackageId,
        ...(manifestFileId ? { manifestFileId } : {}),
        siteFileId: prepared.manifest.files.site,
        siteBody: prepared.siteBody,
        siteBodySha256: createHash("sha256").update(prepared.siteBody, "utf8").digest("hex"),
        assetCount: prepared.assets.length,
        schedulesCreated: 0,
        approvalsCreated: 0,
        publicationEvidenceCreated: 0,
      },
    });
    return { duplicate: false, contentId: content.id, versionId: version.id };
  });
}

export async function importProposalReviewPackage(manifestFileId: string, drive?: MarketingDriveClient, actor = "admin") {
  return persistProposalReviewPackage(await prepareProposalReviewPackage(manifestFileId, drive), actor, manifestFileId);
}
