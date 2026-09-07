import type {
  CanonicalReadbackStatus,
  ChannelReadinessStatus,
  DuplicateGateStatus,
  MarketingContentStatus,
  MarketingNotificationEvent,
  SiteFirstStatus,
} from "./domain";

export type MarketingGateState = {
  duplicateGate: DuplicateGateStatus;
  hasAdminApproval: boolean;
  siteFirstStatus: SiteFirstStatus;
  canonicalReadbackStatus: CanonicalReadbackStatus;
};

export function channelReadiness(gates: MarketingGateState): ChannelReadinessStatus {
  if (gates.duplicateGate === "REVISE" || gates.duplicateGate === "BLOCKED" || gates.siteFirstStatus === "FAILED" || gates.canonicalReadbackStatus === "FAILED") return "ACTION_REQUIRED";
  if (gates.duplicateGate !== "PASS" || !gates.hasAdminApproval || gates.siteFirstStatus !== "PUBLISHED" || gates.canonicalReadbackStatus !== "PASS") return "HOLD";
  return "READY";
}

export function hasValidAdminApproval(input: { versionStatus: string; approvedSnapshotHash: string | null; approvalStatus?: string | null; approvalSnapshotHash?: string | null }) {
  return input.versionStatus === "approved" && Boolean(input.approvedSnapshotHash) && input.approvalStatus === "approved" && input.approvalSnapshotHash === input.approvedSnapshotHash;
}

export function notificationBoundary(input: { versionStatus: MarketingContentStatus; readiness: ChannelReadinessStatus; scheduledToday: boolean; hasFailedOrOverduePublication: boolean }): MarketingNotificationEvent | null {
  if (input.hasFailedOrOverduePublication) return "PUBLISH_FAILED_OVERDUE";
  if (input.readiness === "ACTION_REQUIRED") return "HOLD_ACTION_REQUIRED";
  if (input.readiness === "READY" && input.scheduledToday) return "TODAY_READY";
  if (input.versionStatus === "review_pending") return "REVIEW_REQUIRED";
  return null;
}

export function canonicalReadbackResult(input: { httpStatus: number | null; expectedArticleIdentity: string; observedTitle: string | null; responseText: string | null }): "PASS" | "FAILED" {
  if (!input.httpStatus || input.httpStatus < 200 || input.httpStatus >= 300) return "FAILED";
  const expected = normalize(input.expectedArticleIdentity);
  if (!expected) return "FAILED";
  return normalize(`${input.observedTitle ?? ""} ${input.responseText ?? ""}`).includes(expected) ? "PASS" : "FAILED";
}

export function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("ko-KR");
}
