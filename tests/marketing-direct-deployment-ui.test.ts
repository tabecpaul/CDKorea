import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("authenticated dashboard displays deployment SHA and Production project ref", () => {
  const source = readFileSync(new URL("../apps/www/src/app/admin/marketing/page.tsx", import.meta.url), "utf8");
  assert.match(source, /projectRefFromDatabaseUrl\(process\.env\.DATABASE_URL\)/);
  assert.match(source, /process\.env\.VERCEL_GIT_COMMIT_SHA/);
});

test("dashboard import and proposal promotion flows offer read-only package preflight", () => {
  for (const name of ["ImportPackageForm", "ImportProposalForm"]) {
    const source = readFileSync(new URL(`../apps/www/src/features/marketing/components/${name}.tsx`, import.meta.url), "utf8");
    assert.match(source, /\/api\/admin\/marketing\/preflight/);
    assert.match(source, /읽기 전용 점검/);
  }
  const promotion = readFileSync(new URL("../apps/www/src/features/marketing/components/PromoteProposalForm.tsx", import.meta.url), "utf8");
  assert.match(promotion, /proposal_review/);
  assert.match(promotion, /\/api\/admin\/marketing\/preflight/);
  assert.match(promotion, /읽기 전용 점검/);
});
