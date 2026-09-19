import { eq, sql } from "drizzle-orm";
import { db, marketingAuditLogs, marketingContents, marketingContentVersions } from "@newland/db";
import { createMarketingDriveClient, readDriveText, type MarketingDriveClient } from "./drive";
import { parseProposalPackageManifest } from "./proposalManifest";
import { buildProposalRows } from "./proposalRows";

export async function prepareProposalPackage(manifestFileId: string, drive: MarketingDriveClient = createMarketingDriveClient()) {
  if (!(await drive.isWithinOperationsFolder(manifestFileId))) throw new Error("DRIVE_FILE_OUTSIDE_OPERATIONS_FOLDER");
  const manifest = parseProposalPackageManifest(JSON.parse(await readDriveText(drive, manifestFileId)) as unknown);
  const sourceIds = [manifest.driveFolderId, ...manifest.recovery.sourceFileIds];
  for (const id of sourceIds) if (!(await drive.isWithinOperationsFolder(id))) throw new Error("DRIVE_FILE_OUTSIDE_OPERATIONS_FOLDER");
  for (const id of manifest.recovery.sourceFileIds) {
    const metadata = await drive.metadata(id);
    if (!metadata.parents.includes(manifest.driveFolderId)) throw new Error("RECOVERY_SOURCE_PARENT_MISMATCH");
  }
  return manifest;
}

export async function importProposalPackage(manifestFileId: string, drive?: MarketingDriveClient, actor = "admin") {
  const manifest = await prepareProposalPackage(manifestFileId, drive);
  const [priorPackage] = await db.select({ id: marketingContentVersions.id, contentId: marketingContentVersions.contentId }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, manifest.packageId)).limit(1);
  if (priorPackage) return { duplicate: true, contentId: priorPackage.contentId, versionId: priorPackage.id };

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${manifest.content.title}))`);
    const [samePackage] = await tx.select({ id: marketingContentVersions.id, contentId: marketingContentVersions.contentId }).from(marketingContentVersions).where(eq(marketingContentVersions.sourcePackageId, manifest.packageId)).limit(1);
    if (samePackage) return { duplicate: true, contentId: samePackage.contentId, versionId: samePackage.id };
    const [sameSlug] = await tx.select({ id: marketingContents.id }).from(marketingContents).where(eq(marketingContents.slug, manifest.content.slug)).limit(1);
    const [sameTitle] = await tx.select({ id: marketingContents.id }).from(marketingContents).where(eq(marketingContents.title, manifest.content.title)).limit(1);
    if (sameSlug || sameTitle) throw new Error("PROPOSAL_CONTENT_COLLISION");

    const rows = buildProposalRows(manifest, actor, manifestFileId);
    const [content] = await tx.insert(marketingContents).values(rows.content).returning({ id: marketingContents.id });
    const [version] = await tx.insert(marketingContentVersions).values({ ...rows.version, contentId: content.id }).returning({ id: marketingContentVersions.id });
    await tx.update(marketingContents).set({ currentVersionId: version.id }).where(eq(marketingContents.id, content.id));
    await tx.insert(marketingAuditLogs).values({ ...rows.audit, contentId: content.id, versionId: version.id });
    return { duplicate: false, contentId: content.id, versionId: version.id };
  });
}
