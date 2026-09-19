const REF = /^[a-z]{20}$/;

export function projectRefFromDatabaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return null;
    const direct = /^db\.([a-z]{20})\.supabase\.co$/.exec(url.hostname);
    if (direct) return direct[1];
    if (!url.hostname.endsWith(".pooler.supabase.com")) return null;
    const pooled = /^postgres\.([a-z]{20})$/.exec(decodeURIComponent(url.username));
    return pooled && REF.test(pooled[1]) ? pooled[1] : null;
  } catch { return null; }
}
