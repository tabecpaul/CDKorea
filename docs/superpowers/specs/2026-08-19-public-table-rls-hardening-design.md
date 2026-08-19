# Public Table RLS Hardening Design

## Context

Supabase Security Advisor reports `RLS Disabled in Public` for five tables in the `pro` production project:

- `public.content_notification_deliveries`
- `public.content_performance_snapshots`
- `public.organization_inquiries`
- `public.content_operation_items`
- `public.content_channel_tasks`

`organization_inquiries` contains contact names, email addresses, phone numbers, consent records, and inquiry text. The application writes it through the server-side Drizzle client using `DATABASE_URL`; it does not need browser Data API access.

## Decision

Add one forward-only database migration that:

1. Enables row-level security on exactly the five reported tables.
2. Revokes all table privileges from the Supabase `anon` and `authenticated` roles.
3. Leaves owner/direct database access and `service_role` permissions unchanged.

No permissive RLS policies will be added because these operational tables have no public or end-user access requirement.

## Alternatives Considered

### Enable RLS and add public policies

Rejected because it would preserve unnecessary Data API exposure and expand the authorization surface.

### Revoke grants without enabling RLS

Rejected because Security Advisor would continue to report the exposed-schema configuration and future grants could reopen access.

### Remove `public` from the exposed Data API schemas

Not selected for this fix because it is broader than the five findings and could affect unrelated Supabase integrations.

## Deployment and Verification

- Apply the migration to the production database through the existing database migration workflow.
- Confirm the migration completes atomically.
- Verify the server-side organization inquiry API can still insert and update a record through `DATABASE_URL`.
- Refresh Supabase Security Advisor and require all five errors to clear.
- Confirm `anon` and `authenticated` have no direct table privileges on the five tables.

## Rollback

If an undocumented Data API consumer fails, restore only its required privilege and add a narrowly scoped RLS policy after identifying the caller. Do not disable RLS as a general rollback.

## Scope Boundaries

This change does not modify forms, customer data, content workflows, advertising, authentication, or any table not listed above.
