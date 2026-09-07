import "server-only";

import { and, eq } from "drizzle-orm";
import {
  db,
  marketingContents,
  marketingContentVersions,
} from "@newland/db";
import type { NaverCompletionRequest } from "../naverCompletionRequest";
import { completeManualPublication, ManualPublicationError } from "./manualPublication";

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
  const [content] = await db.select().from(marketingContents).where(eq(marketingContents.id, contentId)).limit(1);
  if (!content) throw new NaverCompletionError("CONTENT_NOT_FOUND");
  if (!content.currentVersionId) throw new NaverCompletionError("CONTENT_VERSION_NOT_FOUND");
  const [version] = await db.select().from(marketingContentVersions).where(and(
    eq(marketingContentVersions.id, content.currentVersionId),
    eq(marketingContentVersions.contentId, content.id),
  )).limit(1);
  if (!version) throw new NaverCompletionError("CONTENT_VERSION_NOT_FOUND");
  if (version.status !== "approved" || !version.approvedSnapshotHash) throw new NaverCompletionError("CONTENT_NOT_APPROVED");
  if (!version.naverBody?.trim()) throw new NaverCompletionError("NAVER_COPY_MISSING");
  try {
    return await completeManualPublication({ contentId, channel: "naver", request, actor, action: "naver_manual_published", details: { ctaLinked: true, mobileDestinationChecked: true } });
  } catch (error) {
    if (!(error instanceof ManualPublicationError)) throw error;
    const codeMap: Record<ManualPublicationError["code"], NaverCompletionErrorCode> = {
      CONTENT_NOT_FOUND: "CONTENT_NOT_FOUND", CONTENT_VERSION_NOT_FOUND: "CONTENT_VERSION_NOT_FOUND", CONTENT_NOT_APPROVED: "CONTENT_NOT_APPROVED",
      CHANNEL_SCHEDULE_NOT_FOUND: "NAVER_SCHEDULE_NOT_FOUND", CHANNEL_SCHEDULE_MODE_INVALID: "NAVER_SCHEDULE_MODE_INVALID", CHANNEL_SCHEDULE_CONFLICT: "NAVER_SCHEDULE_CONFLICT",
    };
    throw new NaverCompletionError(codeMap[error.code]);
  }
}
