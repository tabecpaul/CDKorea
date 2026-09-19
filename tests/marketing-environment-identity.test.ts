import assert from "node:assert/strict";
import test from "node:test";
import { projectRefFromDatabaseUrl } from "../apps/www/src/features/marketing/server/environmentIdentity.ts";

test("reads only the validated Supabase project ref from direct or pooled connections", () => {
  assert.equal(projectRefFromDatabaseUrl("postgresql://postgres:secret@db.fytkptzbnhfsqsktmzpx.supabase.co:5432/postgres"), "fytkptzbnhfsqsktmzpx");
  assert.equal(projectRefFromDatabaseUrl("postgresql://postgres.fytkptzbnhfsqsktmzpx:secret@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"), "fytkptzbnhfsqsktmzpx");
});

test("does not guess a ref from unrelated connection URLs", () => {
  assert.equal(projectRefFromDatabaseUrl("postgresql://postgres:secret@example.com:5432/postgres"), null);
  assert.equal(projectRefFromDatabaseUrl("invalid"), null);
  assert.equal(projectRefFromDatabaseUrl(undefined), null);
});
