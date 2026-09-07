import { marketingChannels, type MarketingChannel } from "./domain";

export type ManualPublicationRequest = { publishedUrl: string; publishedAt: string };

const allowedHosts: Record<MarketingChannel, readonly string[]> = {
  naver: ["blog.naver.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  threads: ["threads.net", "www.threads.net", "threads.com", "www.threads.com"],
};

export function parseManualPublicationRequest(value: unknown, channel: MarketingChannel): ManualPublicationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "publishedAt,publishedUrl" || typeof record.publishedUrl !== "string" || typeof record.publishedAt !== "string") return null;
  try {
    const url = new URL(record.publishedUrl.trim());
    if (url.protocol !== "https:" || url.username || url.password || !allowedHosts[channel].includes(url.hostname)) return null;
    const publishedAt = new Date(record.publishedAt);
    if (Number.isNaN(publishedAt.getTime()) || publishedAt.getUTCFullYear() < 2020 || publishedAt.getUTCFullYear() > 2100) return null;
    return { publishedUrl: url.toString(), publishedAt: publishedAt.toISOString() };
  } catch { return null; }
}

export function isMarketingChannel(value: string): value is MarketingChannel {
  return marketingChannels.includes(value as MarketingChannel);
}
