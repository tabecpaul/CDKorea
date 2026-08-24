import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  marketingApprovals,
  marketingAuditLogs,
  marketingChannelSchedules,
  marketingContentAssets,
  marketingContents,
  marketingContentVersions,
} from "@newland/db";
import type { MarketingChannel, MarketingContentStatus } from "../domain";
import { canTransitionContent } from "../stateMachine";
import { approvalSnapshotHash, buildApprovalSnapshot } from "./approvalSnapshot";

export type MarketingApprovalErrorCode = "CONTENT_NOT_FOUND" | "CONTENT_VERSION_NOT_FOUND" | "CONTENT_STATE_CONFLICT" | "REVISION_NOTE_INVALID";

export class MarketingApprovalError extends Error {
  constructor(public code: MarketingApprovalErrorCode) { super(code); }
}

type MarketingTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function currentApprovalData(tx: MarketingTransaction, contentId: number) {
  const [content] = await tx.select().from(marketingContents).where(eq(marketingContents.id, contentId)).limit(1);
  if (!content) throw new MarketingApprovalError("CONTENT_NOT_FOUND");
  if (!content.currentVersionId) throw new MarketingApprovalError("CONTENT_VERSION_NOT_FOUND");
  const [version] = await tx.select().from(marketingContentVersions).where(and(eq(marketingContentVersions.id, content.currentVersionId), eq(marketingContentVersions.contentId, content.id))).limit(1);
  if (!version) throw new MarketingApprovalError("CONTENT_VERSION_NOT_FOUND");
  const [assets, schedules, approvals] = await Promise.all([
    tx.select().from(marketingContentAssets).where(eq(marketingContentAssets.versionId, version.id)).orderBy(asc(marketingContentAssets.position)),
    tx.select().from(marketingChannelSchedules).where(eq(marketingChannelSchedules.versionId, version.id)).orderBy(asc(marketingChannelSchedules.channel)),
    tx.select().from(marketingApprovals).where(eq(marketingApprovals.versionId, version.id)),
  ]);
  return { content, version, assets, schedules, approvals };
}

export async function approveMarketingContent(contentId: number, actor = "admin") {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${contentId})`);
    const current = await currentApprovalData(tx, contentId);
    const snapshot = buildApprovalSnapshot({
      copy: { naverBody: current.version.naverBody, metaCaption: current.version.metaCaption, threadsPosts: current.version.threadsPosts },
      assetHashes: current.assets.map((asset) => asset.sha256),
      ctaKind: current.content.ctaKind,
      schedules: current.schedules.map((schedule) => ({ channel: schedule.channel as MarketingChannel, utmUrl: schedule.utmUrl, scheduledAt: schedule.scheduledAt })),
    });
    const snapshotHash = approvalSnapshotHash(snapshot);
    const existing = current.approvals.find((approval) => approval.status === "approved" && approval.snapshotHash === snapshotHash);
    if (current.version.status === "approved" && current.version.approvedSnapshotHash === snapshotHash && existing) {
      return { duplicate: true, contentId, versionId: current.version.id, status: "approved" as const, snapshotHash };
    }
    if (!canTransitionContent(current.version.status as MarketingContentStatus, "approved")) throw new MarketingApprovalError("CONTENT_STATE_CONFLICT");
    const now = new Date();
    const activeIds = current.approvals.filter((approval) => approval.status === "approved" || approval.status === "pending").map((approval) => approval.id);
    if (activeIds.length) await tx.update(marketingApprovals).set({ status: "superseded", cancelledAt: now }).where(inArray(marketingApprovals.id, activeIds));
    await tx.insert(marketingApprovals).values({ versionId: current.version.id, status: "approved", snapshotHash, approvedBy: actor, approvedAt: now });
    await tx.update(marketingContentVersions).set({ status: "approved", approvedSnapshotHash: snapshotHash }).where(and(eq(marketingContentVersions.id, current.version.id), eq(marketingContentVersions.status, "review_pending")));
    await tx.update(marketingContents).set({ updatedAt: now }).where(eq(marketingContents.id, contentId));
    await tx.insert(marketingAuditLogs).values({ contentId, versionId: current.version.id, actor, action: "content_approved", details: { snapshotHash } });
    return { duplicate: false, contentId, versionId: current.version.id, status: "approved" as const, snapshotHash };
  });
}

export async function requestMarketingRevision(contentId: number, noteValue: string, actor = "admin") {
  const note = noteValue.trim();
  if (!note || note.length > 1000) throw new MarketingApprovalError("REVISION_NOTE_INVALID");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${contentId})`);
    const current = await currentApprovalData(tx, contentId);
    if (!canTransitionContent(current.version.status as MarketingContentStatus, "revision_requested")) throw new MarketingApprovalError("CONTENT_STATE_CONFLICT");
    const now = new Date();
    const activeIds = current.approvals.filter((approval) => approval.status === "approved" || approval.status === "pending").map((approval) => approval.id);
    if (activeIds.length) await tx.update(marketingApprovals).set({ status: "cancelled", cancelledAt: now }).where(inArray(marketingApprovals.id, activeIds));
    await tx.update(marketingContentVersions).set({ status: "revision_requested", revisionNote: note, approvedSnapshotHash: null }).where(and(eq(marketingContentVersions.id, current.version.id), eq(marketingContentVersions.status, "review_pending")));
    await tx.update(marketingContents).set({ updatedAt: now }).where(eq(marketingContents.id, contentId));
    await tx.insert(marketingAuditLogs).values({ contentId, versionId: current.version.id, actor, action: "content_revision_requested", details: { noteLength: note.length } });
    return { contentId, versionId: current.version.id, status: "revision_requested" as const };
  });
}
