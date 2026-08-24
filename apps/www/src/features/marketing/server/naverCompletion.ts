import "server-only";

import { and, eq, sql } from "drizzle-orm";
import {
  db,
  marketingAuditLogs,
  marketingChannelSchedules,
  marketingContents,
  marketingContentVersions,
} from "@newland/db";
import type { NaverCompletionRequest } from "../naverCompletionRequest";

export type NaverCompletionErrorCode =
  | "CONTENT_NOT_FOUND"
  | "CONTENT_VERSION_NOT_FOUND"
  | "CONTENT_NOT_APPROVED"
  | "NAVER_COPY_MISSING"
  | "NAVER_SCHEDULE_NOT_FOUND"
  | "NAVER_SCHEDULE_MODE_INVALID"
  | "NAVER_SCHEDULE_CONFLICT";

export class NaverCompletionError extends Error {
  constructor(public code: NaverCompletionErrorCode) { super(code); }
}

export async function completeNaverPublication(contentId: number, request: NaverCompletionRequest, actor = "admin") {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${contentId})`);
    const [content] = await tx.select().from(marketingContents).where(eq(marketingContents.id, contentId)).limit(1);
    if (!content) throw new NaverCompletionError("CONTENT_NOT_FOUND");
    if (!content.currentVersionId) throw new NaverCompletionError("CONTENT_VERSION_NOT_FOUND");
    const [version] = await tx.select().from(marketingContentVersions).where(and(
      eq(marketingContentVersions.id, content.currentVersionId),
      eq(marketingContentVersions.contentId, content.id),
    )).limit(1);
    if (!version) throw new NaverCompletionError("CONTENT_VERSION_NOT_FOUND");
    if (version.status !== "approved" || !version.approvedSnapshotHash) throw new NaverCompletionError("CONTENT_NOT_APPROVED");
    if (!version.naverBody?.trim()) throw new NaverCompletionError("NAVER_COPY_MISSING");
    const [schedule] = await tx.select().from(marketingChannelSchedules).where(and(
      eq(marketingChannelSchedules.contentId, content.id),
      eq(marketingChannelSchedules.versionId, version.id),
      eq(marketingChannelSchedules.channel, "naver"),
    )).limit(1);
    if (!schedule) throw new NaverCompletionError("NAVER_SCHEDULE_NOT_FOUND");
    if (schedule.mode !== "manual") throw new NaverCompletionError("NAVER_SCHEDULE_MODE_INVALID");
    if (!schedule.utmUrl.trim()) throw new NaverCompletionError("NAVER_SCHEDULE_CONFLICT");
    if (schedule.status === "manual_published") {
      if (schedule.publishedUrl === request.publishedUrl && schedule.publishedAt) {
        return { duplicate: true, scheduleId: schedule.id, status: "manual_published" as const, publishedUrl: schedule.publishedUrl, publishedAt: schedule.publishedAt };
      }
      throw new NaverCompletionError("NAVER_SCHEDULE_CONFLICT");
    }
    if (schedule.publishedUrl || schedule.publishedAt) throw new NaverCompletionError("NAVER_SCHEDULE_CONFLICT");
    const now = new Date();
    await tx.update(marketingChannelSchedules).set({
      status: "manual_published",
      publishedUrl: request.publishedUrl,
      publishedAt: now,
      updatedAt: now,
      lastErrorCode: null,
    }).where(and(
      eq(marketingChannelSchedules.id, schedule.id),
      eq(marketingChannelSchedules.channel, "naver"),
    ));
    await tx.insert(marketingAuditLogs).values({
      contentId: content.id,
      versionId: version.id,
      scheduleId: schedule.id,
      actor,
      action: "naver_manual_published",
      details: { ctaLinked: true, mobileDestinationChecked: true, publishedHost: "blog.naver.com" },
    });
    return { duplicate: false, scheduleId: schedule.id, status: "manual_published" as const, publishedUrl: request.publishedUrl, publishedAt: now };
  });
}
