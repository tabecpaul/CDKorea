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
