export type NaverCompletionRequest = {
  publishedUrl: string;
  ctaLinked: true;
  mobileDestinationChecked: true;
};

export function parseNaverCompletionRequest(value: unknown): NaverCompletionRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "ctaLinked,mobileDestinationChecked,publishedUrl") return null;
  if (record.ctaLinked !== true || record.mobileDestinationChecked !== true || typeof record.publishedUrl !== "string") return null;
  try {
    const url = new URL(record.publishedUrl.trim());
    if (url.protocol !== "https:" || url.hostname !== "blog.naver.com" || url.username || url.password) return null;
    return { publishedUrl: url.toString(), ctaLinked: true, mobileDestinationChecked: true };
  } catch {
    return null;
  }
}
