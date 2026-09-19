type ApprovalCandidate = {
  campaignKey: string;
  ctaKind: string;
  naverCategory: string | null;
  naverBody: string | null;
  metaCaption: string | null;
  threadsPosts: string[] | null;
  assetHashes: readonly string[];
  schedules: readonly { channel: string; utmUrl: string; scheduledAt: Date }[];
};

export function isApprovalSnapshotComplete(candidate: ApprovalCandidate) {
  return Boolean(
    candidate.campaignKey.trim()
    && ["callback", "callback-20m", "career-check"].includes(candidate.ctaKind)
    && candidate.naverCategory?.trim()
    && candidate.naverBody?.trim()
    && candidate.metaCaption?.trim()
    && candidate.threadsPosts?.length
    && candidate.threadsPosts.every((post) => post.trim())
    && candidate.assetHashes.length >= 4
    && candidate.assetHashes.length <= 8
    && candidate.schedules.length
    && candidate.schedules.every((schedule) => schedule.utmUrl.trim() && !Number.isNaN(schedule.scheduledAt.getTime()))
  );
}
