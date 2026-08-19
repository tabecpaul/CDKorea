# Public Table RLS Hardening Implementation Plan

1. Generate a custom Drizzle migration after `0011_fancy_odin`.
2. In that migration, enable RLS on the five tables reported by Supabase Security Advisor.
3. Revoke all table privileges for `anon` and `authenticated`, without changing owner or `service_role` access.
4. Validate the migration SQL, Drizzle journal entry, repository formatting, and application builds.
5. Commit and publish a focused PR from the latest CDKorea `main`.
6. Apply the migration to the production database using the configured server-side `DATABASE_URL`.
7. Verify the organization inquiry server route and confirm all five Security Advisor errors clear.
