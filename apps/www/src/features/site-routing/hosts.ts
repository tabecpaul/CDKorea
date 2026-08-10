const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const START_SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr",
);

export const OFFICIAL_SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_OFFICIAL_SITE_URL ?? "https://www.careerdirect.kr",
);

export function normalizeHost(value: string | null) {
  return (value ?? "").split(":")[0].toLowerCase();
}

export function isOfficialHost(host: string) {
  return normalizeHost(host) === new URL(OFFICIAL_SITE_URL).hostname;
}

export function isOfficialSitePreview() {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/official-site"
  );
}

export function isStartHost(host: string) {
  return normalizeHost(host) === new URL(START_SITE_URL).hostname;
}

export function officialUrl(path = "/") {
  return new URL(path, `${OFFICIAL_SITE_URL}/`);
}

export function startUrl(path = "/") {
  return new URL(path, `${START_SITE_URL}/`);
}
