import assert from "node:assert/strict";
import test from "node:test";
import { parseProposalPackageManifest, proposalSlug } from "../apps/www/src/features/marketing/server/proposalManifest.ts";

const proposal = {
  schemaVersion: 1,
  kind: "proposal",
  packageId: "2026-09-14-proposal-06e2aa89ecf49d69",
  driveFolderId: "1LzOoDhq3ja6mwzEVpLeJNk6YXz379xxg",
  content: { slug: "proposal-06e2aa89ecf49d69", title: "‘잘할 수 있는 일’과 ‘오래 할 수 있는 일’은 다릅니다", proposedDate: "2026-09-14" },
  recovery: { kind: "historical_recovery", sourceStatus: "proposal", sourceFileIds: ["1DMHvZHJNxQSKtxsM3_eAKt9MAkfLTEfH", "1-uZfgKJBT3OwqSAElkBnNSssy86MrYLs"] },
} as const;

test("proposal manifest preserves only observed facts and the date's proposal meaning", () => {
  const parsed = parseProposalPackageManifest(proposal);
  assert.equal(parsed.content.proposedDate, "2026-09-14");
  assert.equal(parsed.content.slug, proposalSlug(parsed.content.proposedDate, parsed.content.title));
  assert.deepEqual(parsed.recovery.sourceFileIds, proposal.recovery.sourceFileIds);
  assert.equal("schedules" in parsed, false);
  assert.equal("files" in parsed, false);
});

test("proposal manifest rejects publication-shaped fields and ambiguous dates", () => {
  assert.throws(() => parseProposalPackageManifest({ ...proposal, schedules: [] }));
  assert.throws(() => parseProposalPackageManifest({ ...proposal, content: { ...proposal.content, scheduledAt: "2026-09-14T08:00:00+09:00" } }));
  assert.throws(() => parseProposalPackageManifest({ ...proposal, content: { ...proposal.content, proposedDate: "2026-09-31" } }));
  assert.throws(() => parseProposalPackageManifest({ ...proposal, campaignKey: "blog_launch_2026q3" }));
});

test("proposal manifest requires unique source IDs and deterministic date-slug ID", () => {
  assert.throws(() => parseProposalPackageManifest({ ...proposal, packageId: "arbitrary-id" }));
  assert.throws(() => parseProposalPackageManifest({ ...proposal, content: { ...proposal.content, slug: "invented-semantic-slug" }, packageId: "2026-09-14-invented-semantic-slug" }));
  assert.throws(() => parseProposalPackageManifest({ ...proposal, recovery: { ...proposal.recovery, sourceFileIds: [proposal.recovery.sourceFileIds[0], proposal.recovery.sourceFileIds[0]] } }));
});
