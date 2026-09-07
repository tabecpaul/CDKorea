export type NaverCompletionRequest = {
  publishedUrl: string;
  publishedAt: string;
  ctaLinked: true;
  mobileDestinationChecked: true;
};

export function parseNaverCompletionRequest(value: unknown): NaverCompletionRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "ctaLinked,mobileDestinationChecked,publishedAt,publishedUrl") return null;
  if (record.ctaLinked !== true || record.mobileDestinationChecked !== true || typeof record.publishedUrl !== "string" || typeof record.publishedAt !== "string") return null;
  try {
    const url = new URL(record.publishedUrl.trim());
    if (url.protocol !== "https:" || url.hostname !== "blog.naver.com" || url.username || url.password) return null;
    const publishedAt = new Date(record.publishedAt);
    if (Number.isNaN(publishedAt.getTime()) || publishedAt.getUTCFullYear() < 2020 || publishedAt.getUTCFullYear() > 2100) return null;
    return { publishedUrl: url.toString(), publishedAt: publishedAt.toISOString(), ctaLinked: true, mobileDestinationChecked: true };
  } catch {
    return null;
  }
}
