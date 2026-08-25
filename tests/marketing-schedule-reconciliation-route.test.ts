import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("../apps/www/src/app/api/cron/marketing-reconciliation/route.ts", import.meta.url), "utf8");
const sql = readFileSync(new URL("../packages/db/operations/schedule-marketing-reconciliation-cron.sql", import.meta.url), "utf8");

test("weekly reconciliation cron stays authenticated, idempotent and non-publishing", () => {
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /hasSentMarketingReconciliation/);
  assert.match(route, /collectWeeklyReconciliation/);
  assert.match(route, /sendReconciliationEmail/);
  assert.doesNotMatch(route, /publish|META_|facebook|instagram|threads/i);
});

test("cron runs Friday at 10 KST without replacing the import cron", () => {
  assert.match(sql, /career-direct-marketing-reconciliation/);
  assert.match(sql, /'0 1 \* \* 5'/);
  assert.match(sql, /\/api\/cron\/marketing-reconciliation/);
  assert.doesNotMatch(sql, /career-direct-marketing-import/);
});
