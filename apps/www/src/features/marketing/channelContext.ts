import { marketingChannels, type MarketingChannel } from "./domain";

export type ChannelContextQuery = { channel?: string | string[]; schedule?: string | string[] };
export type ChannelContextSchedule = { id: number; contentId: number; versionId: number; channel: string };

export type MarketingChannelContext<T extends ChannelContextSchedule> =
  | { kind: "overview" }
  | { kind: "invalid" }
  | { kind: "channel"; channel: MarketingChannel; schedule: T };

export function selectMarketingChannelContext<T extends ChannelContextSchedule>(
  query: ChannelContextQuery,
  contentId: number,
  currentVersionId: number | null,
  schedules: readonly T[],
): MarketingChannelContext<T> {
  const channelValue = query.channel;
  const scheduleValue = query.schedule;
  if (channelValue === undefined && scheduleValue === undefined) return { kind: "overview" };
  if (typeof channelValue !== "string" || typeof scheduleValue !== "string") return { kind: "invalid" };
  if (!marketingChannels.includes(channelValue as MarketingChannel)) return { kind: "invalid" };
  const scheduleId = Number(scheduleValue);
  if (!Number.isSafeInteger(scheduleId) || scheduleId <= 0 || !currentVersionId) return { kind: "invalid" };
  const schedule = schedules.find((item) => item.id === scheduleId);
  if (!schedule || schedule.contentId !== contentId || schedule.versionId !== currentVersionId || schedule.channel !== channelValue) return { kind: "invalid" };
  return { kind: "channel", channel: channelValue as MarketingChannel, schedule };
}
