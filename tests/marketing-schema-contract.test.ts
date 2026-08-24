import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../packages/db/drizzle/0013_clever_hulk.sql", import.meta.url),
  "utf8",
);
const migrationWorkflow = readFileSync(
  new URL("../.github/workflows/db-migrate.yml", import.meta.url),
  "utf8",
);

const marketingTables = [
  "marketing_contents",
  "marketing_content_versions",
  "marketing_content_assets",
  "marketing_channel_schedules",
  "marketing_approvals",
  "marketing_publish_attempts",
  "marketing_connections",
  "marketing_audit_logs",
] as const;

test("creates the complete marketing dashboard schema", () => {
  for (const table of marketingTables) {
    assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  }

  assert.match(migration, /marketing_content_versions_content_id_marketing_contents_id_fk/);
  assert.match(migration, /marketing_channel_schedules_version_id_marketing_content_versions_id_fk/);
  assert.match(migration, /marketing_publish_attempts_schedule_id_marketing_channel_schedules_id_fk/);
});

test("enforces version, channel, scheduling, and publishing uniqueness", () => {
  assert.match(migration, /marketing_content_versions_content_version_unique/);
  assert.match(migration, /marketing_channel_schedules_version_channel_unique/);
  assert.match(migration, /marketing_channel_schedules_status_scheduled_idx/);
  assert.match(migration, /marketing_publish_attempts_publish_key_unique/);
  assert.match(migration, /marketing_publish_attempts_schedule_attempt_unique/);
});

test("blocks direct anon and authenticated access to every marketing table", () => {
  for (const table of marketingTables) {
    assert.match(
      migration,
      new RegExp(`ALTER TABLE "public"\\."${table}" ENABLE ROW LEVEL SECURITY;`),
    );
    assert.match(
      migration,
      new RegExp(`REVOKE ALL PRIVILEGES ON TABLE "public"\\."${table}" FROM "anon", "authenticated";`),
    );
  }

  assert.doesNotMatch(migration, /CREATE POLICY/i);
  assert.doesNotMatch(migration, /GRANT\s+.+\s+TO\s+"?(anon|authenticated)"?/i);
});

test("production migration workflow rejects a mismatched Supabase target", () => {
  assert.match(migrationWorkflow, /workflow_dispatch/);
  assert.match(migrationWorkflow, /EXPECTED_SUPABASE_PROJECT_REF: fytkptzbnhfsqsktmzpx/);
  assert.match(migrationWorkflow, /if \(!connectionIdentity\.includes\(expectedRef\)\)/);
  assert.match(migrationWorkflow, /Migration target mismatch/);
});
