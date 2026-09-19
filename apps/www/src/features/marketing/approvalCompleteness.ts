type ApprovalCandidate = {
  siteBody: string | null;
  ctaKind: string;
  naverBody: string | null;
  metaCaption: string | null;
  threadsPosts: string[] | null;
  assetHashes: readonly string[];
};

export function isApprovalSnapshotComplete(candidate: ApprovalCandidate) {
  return Boolean(
    candidate.siteBody?.trim()
    && ["callback", "callback-20m", "career-check"].includes(candidate.ctaKind)
    && candidate.naverBody?.trim()
    && candidate.metaCaption?.trim()
    && candidate.threadsPosts?.length
    && candidate.threadsPosts.every((post) => post.trim())
    && candidate.assetHashes.length >= 4
    && candidate.assetHashes.length <= 8
  );
}
