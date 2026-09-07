export const marketingContentStatuses = [
  "proposal",
  "producing",
  "review_pending",
  "revision_requested",
  "approved",
  "scheduled",
  "published",
] as const;
export type MarketingContentStatus = (typeof marketingContentStatuses)[number];

export const marketingChannels = ["naver", "facebook", "instagram", "threads"] as const;
export type MarketingChannel = (typeof marketingChannels)[number];

export const marketingChannelStatuses = [
  "preparing",
  "approval_pending",
  "scheduled",
  "publishing",
  "published",
  "publish_failed",
  "action_required",
  "manual_published",
  "approval_expired",
] as const;
export type MarketingChannelStatus = (typeof marketingChannelStatuses)[number];

export const marketingApprovalStatuses = ["pending", "approved", "cancelled", "superseded"] as const;
export type MarketingApprovalStatus = (typeof marketingApprovalStatuses)[number];

export const duplicateGateStatuses = ["UNKNOWN", "PASS", "REVISE", "BLOCKED"] as const;
export type DuplicateGateStatus = (typeof duplicateGateStatuses)[number];

export const siteFirstStatuses = ["UNKNOWN", "NOT_PUBLISHED", "PUBLISHED", "FAILED"] as const;
export type SiteFirstStatus = (typeof siteFirstStatuses)[number];

export const canonicalReadbackStatuses = ["UNKNOWN", "PASS", "FAILED"] as const;
export type CanonicalReadbackStatus = (typeof canonicalReadbackStatuses)[number];

export const channelReadinessStatuses = ["HOLD", "READY", "ACTION_REQUIRED"] as const;
export type ChannelReadinessStatus = (typeof channelReadinessStatuses)[number];

export const marketingNotificationEvents = ["REVIEW_REQUIRED", "TODAY_READY", "HOLD_ACTION_REQUIRED", "PUBLISH_FAILED_OVERDUE"] as const;
export type MarketingNotificationEvent = (typeof marketingNotificationEvents)[number];

export type ApprovalSnapshot = {
  copyHash: string;
  assetHashes: readonly string[];
  ctaKind: string;
  utmUrls: Readonly<Partial<Record<MarketingChannel, string>>>;
  scheduledAt: Readonly<Partial<Record<MarketingChannel, string>>>;
};

export type MarketingChannelState = {
  channel: MarketingChannel;
  status: MarketingChannelStatus;
};
