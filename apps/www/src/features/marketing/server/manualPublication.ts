import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db, marketingAuditLogs, marketingChannelSchedules, marketingContents, marketingContentVersions } from "@newland/db";
import type { MarketingChannel } from "../domain";
import type { ManualPublicationRequest } from "../manualPublicationRequest";

export type ManualPublicationErrorCode = "CONTENT_NOT_FOUND" | "CONTENT_VERSION_NOT_FOUND" | "CONTENT_NOT_APPROVED" | "CHANNEL_SCHEDULE_NOT_FOUND" | "CHANNEL_SCHEDULE_MODE_INVALID" | "CHANNEL_SCHEDULE_CONFLICT";

export class ManualPublicationError extends Error {
  constructor(public code: ManualPublicationErrorCode) { super(code); }
}

export async function completeManualPublication(input: { contentId: number; channel: MarketingChannel; request: ManualPublicationRequest; actor?: string; action?: string; details?: Record<string, string | number | boolean | null> }) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${input.contentId})`);
    const [content] = await tx.select().from(marketingContents).where(eq(marketingContents.id, input.contentId)).limit(1);
    if (!content) throw new ManualPublicationError("CONTENT_NOT_FOUND");
    if (!content.currentVersionId) throw new ManualPublicationError("CONTENT_VERSION_NOT_FOUND");
    const [version] = await tx.select().from(marketingContentVersions).where(and(eq(marketingContentVersions.id, content.currentVersionId), eq(marketingContentVersions.contentId, content.id))).limit(1);
    if (!version) throw new ManualPublicationError("CONTENT_VERSION_NOT_FOUND");
    if (version.status !== "approved" || !version.approvedSnapshotHash) throw new ManualPublicationError("CONTENT_NOT_APPROVED");
    const [schedule] = await tx.select().from(marketingChannelSchedules).where(and(eq(marketingChannelSchedules.contentId, content.id), eq(marketingChannelSchedules.versionId, version.id), eq(marketingChannelSchedules.channel, input.channel))).limit(1);
    if (!schedule) throw new ManualPublicationError("CHANNEL_SCHEDULE_NOT_FOUND");
    if (schedule.mode !== "manual") throw new ManualPublicationError("CHANNEL_SCHEDULE_MODE_INVALID");
    if (!schedule.utmUrl.trim()) throw new ManualPublicationError("CHANNEL_SCHEDULE_CONFLICT");
    if (schedule.status === "manual_published") {
      if (schedule.publishedUrl === input.request.publishedUrl && schedule.publishedAt) return { duplicate: true, scheduleId: schedule.id, status: "manual_published" as const, publishedUrl: schedule.publishedUrl, publishedAt: schedule.publishedAt };
      throw new ManualPublicationError("CHANNEL_SCHEDULE_CONFLICT");
    }
    if (schedule.publishedUrl || schedule.publishedAt) throw new ManualPublicationError("CHANNEL_SCHEDULE_CONFLICT");
    const publishedAt = new Date(input.request.publishedAt);
    const now = new Date();
    await tx.update(marketingChannelSchedules).set({ status: "manual_published", publishedUrl: input.request.publishedUrl, publishedAt, updatedAt: now, lastErrorCode: null }).where(eq(marketingChannelSchedules.id, schedule.id));
    await tx.insert(marketingAuditLogs).values({ contentId: content.id, versionId: version.id, scheduleId: schedule.id, actor: input.actor ?? "admin", action: input.action ?? `${input.channel}_manual_published`, details: { publishedHost: new URL(input.request.publishedUrl).hostname, actualPublishedAt: publishedAt.toISOString(), ...(input.details ?? {}) } });
    return { duplicate: false, scheduleId: schedule.id, status: "manual_published" as const, publishedUrl: input.request.publishedUrl, publishedAt };
  });
}
