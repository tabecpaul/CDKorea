export function shouldAutoImportManifest(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return true;
  const parsed = value as Record<string, unknown>;
  if (parsed.kind === "proposal") return false;
  if (parsed.recovery && typeof parsed.recovery === "object" && !Array.isArray(parsed.recovery) && (parsed.recovery as Record<string, unknown>).kind === "historical_recovery") return false;
  return true;
}
