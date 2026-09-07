import { canonicalReadbackStatuses, duplicateGateStatuses, siteFirstStatuses, type CanonicalReadbackStatus, type DuplicateGateStatus, type SiteFirstStatus } from "./domain";

export type MarketingGateRequest = {
  duplicateGate: DuplicateGateStatus;
  siteFirstStatus: SiteFirstStatus;
  canonicalUrl: string | null;
  expectedArticleIdentity: string | null;
};

function optionalText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

export function parseMarketingGateRequest(value: unknown): MarketingGateRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "canonicalUrl,duplicateGate,expectedArticleIdentity,siteFirstStatus") return null;
  if (typeof record.duplicateGate !== "string" || !duplicateGateStatuses.includes(record.duplicateGate as DuplicateGateStatus)) return null;
  if (typeof record.siteFirstStatus !== "string" || !siteFirstStatuses.includes(record.siteFirstStatus as SiteFirstStatus)) return null;
  const canonicalUrl = optionalText(record.canonicalUrl, 2048);
  const expectedArticleIdentity = optionalText(record.expectedArticleIdentity, 500);
  if (Boolean(canonicalUrl) !== Boolean(expectedArticleIdentity)) return null;
  if (canonicalUrl) {
    try {
      const url = new URL(canonicalUrl);
      if (url.protocol !== "https:" || url.username || url.password) return null;
      return { duplicateGate: record.duplicateGate as DuplicateGateStatus, siteFirstStatus: record.siteFirstStatus as SiteFirstStatus, canonicalUrl: url.toString(), expectedArticleIdentity };
    } catch { return null; }
  }
  return { duplicateGate: record.duplicateGate as DuplicateGateStatus, siteFirstStatus: record.siteFirstStatus as SiteFirstStatus, canonicalUrl: null, expectedArticleIdentity: null };
}

export function parseCanonicalReadbackRequest(value: unknown): { canonicalUrl: string; expectedArticleIdentity: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "canonicalUrl,expectedArticleIdentity") return null;
  const canonicalUrl = optionalText(record.canonicalUrl, 2048);
  const expectedArticleIdentity = optionalText(record.expectedArticleIdentity, 500);
  if (!canonicalUrl || !expectedArticleIdentity) return null;
  try {
    const url = new URL(canonicalUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return { canonicalUrl: url.toString(), expectedArticleIdentity };
  } catch { return null; }
}

export function isCanonicalReadbackStatus(value: string): value is CanonicalReadbackStatus {
  return canonicalReadbackStatuses.includes(value as CanonicalReadbackStatus);
}
