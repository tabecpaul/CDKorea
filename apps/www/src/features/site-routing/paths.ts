export const officialPublicPaths = [
  "/",
  "/assessment",
  "/pricing",
  "/consulting",
  "/organizations",
  "/consultant",
] as const;

export const startOwnedPrefixes = [
  "/career-check",
  "/assessment-consultation",
  "/callback-schedule",
  "/checkout",
  "/unsubscribe",
] as const;

export function isOfficialPublicPath(pathname: string) {
  return officialPublicPaths.includes(pathname as (typeof officialPublicPaths)[number]);
}

export function isStartOwnedPath(pathname: string) {
  return startOwnedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
