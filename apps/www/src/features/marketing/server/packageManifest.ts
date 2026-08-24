import { marketingChannels, type MarketingChannel } from "../domain";

const PACKAGE_ID = /^[a-z0-9][a-z0-9._-]{2,179}$/;
const SLUG = /^[a-z0-9][a-z0-9-]{1,158}[a-z0-9]$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{10,160}$/;
const allowedCtas = ["callback", "callback-20m", "career-check"] as const;
const allowedModes = ["manual", "automatic"] as const;

export type ContentPackageSchedule = {
  channel: MarketingChannel;
  scheduledAt: string;
  mode: (typeof allowedModes)[number];
  utmUrl: string;
};

export type ContentPackageManifest = {
  schemaVersion: 1;
  packageId: string;
  driveFolderId: string;
  canvaDesignUrl?: string;
  content: { slug: string; title: string; campaignKey: string; ctaKind: (typeof allowedCtas)[number]; naverCategory: string };
  files: { naver: string; meta: string; threads: string; images: string[] };
  schedules: ContentPackageSchedule[];
};

export class ManifestError extends Error {
  constructor(public code: string, public path: string) { super(`${code}:${path}`); }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManifestError("EXPECTED_OBJECT", path);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new ManifestError("UNKNOWN_FIELD", `${path}.${key}`);
}

function string(value: unknown, path: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new ManifestError("INVALID_STRING", path);
  return value.trim();
}

function driveId(value: unknown, path: string) {
  const parsed = string(value, path, 160);
  if (!DRIVE_ID.test(parsed)) throw new ManifestError("INVALID_DRIVE_ID", path);
  return parsed;
}

function httpsUrl(value: unknown, path: string, requireUtm = false) {
  const parsed = string(value, path, 2048);
  let url: URL;
  try { url = new URL(parsed); } catch { throw new ManifestError("INVALID_URL", path); }
  if (url.protocol !== "https:") throw new ManifestError("INVALID_URL", path);
  if (requireUtm && (!url.searchParams.get("utm_source") || !url.searchParams.get("utm_medium") || !url.searchParams.get("utm_campaign"))) {
    throw new ManifestError("UTM_REQUIRED", path);
  }
  return url.toString();
}

export function parseContentPackageManifest(input: unknown): ContentPackageManifest {
  const root = record(input, "$contentPackage");
  exactKeys(root, ["schemaVersion", "packageId", "driveFolderId", "canvaDesignUrl", "content", "files", "schedules"], "$contentPackage");
  if (root.schemaVersion !== 1) throw new ManifestError("UNSUPPORTED_SCHEMA", "$contentPackage.schemaVersion");
  const packageId = string(root.packageId, "$contentPackage.packageId", 180);
  if (!PACKAGE_ID.test(packageId)) throw new ManifestError("INVALID_PACKAGE_ID", "$contentPackage.packageId");

  const content = record(root.content, "$contentPackage.content");
  exactKeys(content, ["slug", "title", "campaignKey", "ctaKind", "naverCategory"], "$contentPackage.content");
  const slug = string(content.slug, "$contentPackage.content.slug", 160);
  if (!SLUG.test(slug)) throw new ManifestError("INVALID_SLUG", "$contentPackage.content.slug");
  const ctaKind = string(content.ctaKind, "$contentPackage.content.ctaKind", 40);
  if (!allowedCtas.includes(ctaKind as never)) throw new ManifestError("INVALID_CTA", "$contentPackage.content.ctaKind");

  const files = record(root.files, "$contentPackage.files");
  exactKeys(files, ["naver", "meta", "threads", "images"], "$contentPackage.files");
  if (!Array.isArray(files.images) || files.images.length < 4 || files.images.length > 8) throw new ManifestError("IMAGE_COUNT", "$contentPackage.files.images");
  const images = files.images.map((value, index) => driveId(value, `$contentPackage.files.images[${index}]`));
  if (new Set(images).size !== images.length) throw new ManifestError("DUPLICATE_IMAGE", "$contentPackage.files.images");

  if (!Array.isArray(root.schedules) || root.schedules.length < 1 || root.schedules.length > marketingChannels.length) throw new ManifestError("INVALID_SCHEDULES", "$contentPackage.schedules");
  const seen = new Set<string>();
  const schedules = root.schedules.map((entry, index) => {
    const item = record(entry, `$contentPackage.schedules[${index}]`);
    exactKeys(item, ["channel", "scheduledAt", "mode", "utmUrl"], `$contentPackage.schedules[${index}]`);
    const channel = string(item.channel, `$contentPackage.schedules[${index}].channel`, 24);
    if (!marketingChannels.includes(channel as MarketingChannel) || seen.has(channel)) throw new ManifestError("INVALID_CHANNEL", `$contentPackage.schedules[${index}].channel`);
    seen.add(channel);
    const mode = string(item.mode, `$contentPackage.schedules[${index}].mode`, 16);
    if (!allowedModes.includes(mode as never) || (channel === "naver" && mode !== "manual")) throw new ManifestError("INVALID_MODE", `$contentPackage.schedules[${index}].mode`);
    const scheduledAt = string(item.scheduledAt, `$contentPackage.schedules[${index}].scheduledAt`, 40);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(scheduledAt) || Number.isNaN(Date.parse(scheduledAt))) throw new ManifestError("INVALID_KST_TIME", `$contentPackage.schedules[${index}].scheduledAt`);
    return { channel: channel as MarketingChannel, mode: mode as ContentPackageSchedule["mode"], scheduledAt, utmUrl: httpsUrl(item.utmUrl, `$contentPackage.schedules[${index}].utmUrl`, true) };
  });

  return {
    schemaVersion: 1, packageId, driveFolderId: driveId(root.driveFolderId, "$contentPackage.driveFolderId"),
    ...(root.canvaDesignUrl === undefined ? {} : { canvaDesignUrl: httpsUrl(root.canvaDesignUrl, "$contentPackage.canvaDesignUrl") }),
    content: { slug, title: string(content.title, "$contentPackage.content.title", 240), campaignKey: string(content.campaignKey, "$contentPackage.content.campaignKey", 120), ctaKind: ctaKind as ContentPackageManifest["content"]["ctaKind"], naverCategory: string(content.naverCategory, "$contentPackage.content.naverCategory", 80) },
    files: { naver: driveId(files.naver, "$contentPackage.files.naver"), meta: driveId(files.meta, "$contentPackage.files.meta"), threads: driveId(files.threads, "$contentPackage.files.threads"), images }, schedules,
  };
}
