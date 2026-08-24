import {
  marketingChannels,
  type ApprovalSnapshot,
  type MarketingChannel,
  type MarketingChannelState,
  type MarketingChannelStatus,
  type MarketingContentStatus,
} from "./domain";

const contentTransitions: Record<MarketingContentStatus, readonly MarketingContentStatus[]> = {
  proposal: ["producing"],
  producing: ["review_pending"],
  review_pending: ["revision_requested", "approved"],
  revision_requested: ["review_pending"],
  approved: ["review_pending", "scheduled"],
  scheduled: ["review_pending", "approved", "published"],
  published: [],
};

export function canTransitionContent(
  from: MarketingContentStatus,
  to: MarketingContentStatus,
  context: { hasActiveApproval?: boolean } = {},
) {
  if (!contentTransitions[from].includes(to)) return false;
  if (to === "scheduled") return context.hasActiveApproval === true;
  return true;
}

function orderedChannelValues(values: Readonly<Partial<Record<MarketingChannel, string>>>) {
  return marketingChannels.map((channel) => [channel, values[channel] ?? null] as const);
}

export function canonicalApprovalSnapshot(snapshot: ApprovalSnapshot) {
  return JSON.stringify({
    copyHash: snapshot.copyHash,
    assetHashes: [...snapshot.assetHashes],
    ctaKind: snapshot.ctaKind,
    utmUrls: orderedChannelValues(snapshot.utmUrls),
    scheduledAt: orderedChannelValues(snapshot.scheduledAt),
  });
}

export function requiresReapproval(previous: ApprovalSnapshot, next: ApprovalSnapshot) {
  return canonicalApprovalSnapshot(previous) !== canonicalApprovalSnapshot(next);
}

const publishedChannelStatuses = new Set<MarketingChannelStatus>(["published", "manual_published"]);
const scheduledChannelStatuses = new Set<MarketingChannelStatus>([
  "scheduled",
  "publishing",
  "published",
  "publish_failed",
  "action_required",
  "manual_published",
]);

export function canCancelChannelApproval(status: MarketingChannelStatus) {
  return !publishedChannelStatuses.has(status);
}

export function cancellableApprovalChannels(states: readonly MarketingChannelState[]) {
  return states.filter(({ status }) => canCancelChannelApproval(status)).map(({ channel }) => channel);
}

export function summarizeContentStatus(
  versionStatus: MarketingContentStatus,
  channelStates: readonly MarketingChannelState[],
): MarketingContentStatus {
  if (!channelStates.length) return versionStatus;
  if (channelStates.every(({ status }) => publishedChannelStatuses.has(status))) return "published";
  if (channelStates.some(({ status }) => scheduledChannelStatuses.has(status))) return "scheduled";
  if (versionStatus === "published") return "approved";
  return versionStatus;
}
