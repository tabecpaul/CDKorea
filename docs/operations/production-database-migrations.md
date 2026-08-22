# Production database migration guard

## Canonical production target

- Supabase project ref: `fytkptzbnhfsqsktmzpx`
- Supabase region: `ap-southeast-1` (Singapore)
- Transaction pooler: `aws-0-ap-southeast-1.pooler.supabase.com:6543`
- GitHub Actions secret: `PRODUCTION_DATABASE_URL`
- Vercel project: `cd-korea-www`
- Vercel environment variable: `DATABASE_URL`

The Vercel and GitHub connection strings must identify the same Supabase
project. Never copy a development or paused-project connection string into the
production secret.

## Required checks before a database change

1. Confirm the intended migration files and review them for destructive SQL.
2. Confirm Vercel Production `DATABASE_URL` identifies
   `fytkptzbnhfsqsktmzpx`.
3. Set GitHub `PRODUCTION_DATABASE_URL` from that same verified production
   connection string without printing it in logs.
4. Run the `Database Migration` workflow manually.
5. The workflow must pass `Verify production Supabase project` before Drizzle
   can apply pending migrations.
6. Confirm the migration result in Supabase and verify the affected Production
   application path.

If the target check fails, do not bypass it and do not run migrations against
another project. Correct the secret first.
