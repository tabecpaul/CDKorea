import { createHash } from "node:crypto";
import type { ApprovalSnapshot, MarketingChannel } from "../domain";
import { canonicalApprovalSnapshot } from "../stateMachine";

export type ApprovalCopy = { naverBody: string | null; metaCaption: string | null; threadsPosts: string[] | null };

export function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function approvalCopyHash(copy: ApprovalCopy) {
  return sha256(JSON.stringify([copy.naverBody ?? "", copy.metaCaption ?? "", copy.threadsPosts ?? []]));
}

export function approvalSnapshotHash(snapshot: ApprovalSnapshot) {
  return sha256(canonicalApprovalSnapshot(snapshot));
}

export function buildApprovalSnapshot(input: {
  copy: ApprovalCopy;
  assetHashes: readonly string[];
  ctaKind: string;
  schedules: readonly { channel: MarketingChannel; utmUrl: string; scheduledAt: Date }[];
}): ApprovalSnapshot {
  const utmUrls: Partial<Record<MarketingChannel, string>> = {};
  const scheduledAt: Partial<Record<MarketingChannel, string>> = {};
  for (const schedule of input.schedules) {
    utmUrls[schedule.channel] = schedule.utmUrl;
    scheduledAt[schedule.channel] = schedule.scheduledAt.toISOString();
  }
  return { copyHash: approvalCopyHash(input.copy), assetHashes: [...input.assetHashes], ctaKind: input.ctaKind, utmUrls, scheduledAt };
}
