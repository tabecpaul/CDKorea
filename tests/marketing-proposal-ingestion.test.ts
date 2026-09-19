import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildProposalRows } from "../apps/www/src/features/marketing/server/proposalRows.ts";
import { shouldAutoImportManifest } from "../apps/www/src/features/marketing/server/automaticImportPolicy.ts";

const manifest = {
  schemaVersion: 1, kind: "proposal", packageId: "2026-09-14-capability-versus-sustainability",
  driveFolderId: "1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg",
  content: { slug: "capability-versus-sustainability", title: "‘잘할 수 있는 일’과 ‘오래 할 수 있는 일’은 다릅니다", proposedDate: "2026-09-14" },
  recovery: { kind: "historical_recovery", sourceStatus: "proposal", sourceFileIds: ["1DMHvZHJNxQSKtxsM3_eAKt9MAkfLTEfH", "1-uZfgKJBT3OwqSAElkBnNSssy86MrYLs"] },
} as const;

test("proposal persistence input has no campaign, CTA, copy, assets or schedules", () => {
  const rows = buildProposalRows(manifest);
  assert.equal(rows.content.campaignKey, "");
  assert.equal(rows.content.ctaKind, "");
  assert.equal(rows.version.version, 1);
  assert.equal(rows.version.status, "proposal");
  assert.equal(rows.version.naverBody, null);
  assert.equal(rows.version.metaCaption, null);
  assert.equal(rows.version.threadsPosts, null);
  assert.equal(rows.audit.details.proposedDate, "2026-09-14");
  assert.equal("schedules" in rows, false);
  assert.equal("assets" in rows, false);
});

test("historical recovery manifests are never picked up by automatic import", () => {
  assert.equal(shouldAutoImportManifest(manifest), false);
  assert.equal(shouldAutoImportManifest({ ...manifest, kind: undefined }), false);
  assert.equal(shouldAutoImportManifest({ schemaVersion: 1, packageId: "ordinary", files: {}, schedules: [] }), true);
});

test("proposal importer does not write schedules, approvals, attempts, or readbacks", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/server/proposalImportJob.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /insert\(marketingChannelSchedules\)|insert\(marketingApprovals\)|insert\(marketingPublishAttempts\)|insert\(marketingCanonicalReadbacks\)/);
  assert.match(source, /insert\(marketingAuditLogs\)/);
});
