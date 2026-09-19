import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("authenticated direct-deployment preflight prepares both package types without imports", () => {
  const source = readFileSync(new URL("../apps/www/src/app/api/admin/marketing/preflight/route.ts", import.meta.url), "utf8");
  assert.match(source, /hasAdminSession\(\)/);
  assert.match(source, /prepareProposalPackage\(manifestFileId\)/);
  assert.match(source, /prepareMarketingPackage\(manifestFileId\)/);
  assert.doesNotMatch(source, /importProposalPackage|importMarketingPackage|\.insert\(|\.update\(|\.delete\(/);
});
