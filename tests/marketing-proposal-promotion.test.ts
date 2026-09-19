import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { DriveFileMeta, MarketingDriveClient } from "../apps/www/src/features/marketing/server/drive.ts";
import { parseProposalReviewManifest } from "../apps/www/src/features/marketing/server/proposalReviewManifest.ts";
import { prepareProposalReviewPackage } from "../apps/www/src/features/marketing/server/proposalReviewPreparation.ts";

const imageIds = Array.from({ length: 7 }, (_, index) => `drive_review_card_${index + 1}`);
const manifest = {
  schemaVersion: 1,
  kind: "proposal_review",
  packageId: "2026-09-21-review-594c9f7f7c00d832",
  proposalPackageId: "2026-09-21-proposal-594c9f7f7c00d832",
  driveFolderId: "drive_review_folder_123",
  content: {
    title: "전공을 고를 때 ‘좋아하는 과목’만 보면 놓치는 세 가지",
    ctaKind: "career-check",
  },
  files: {
    site: "drive_site_blog_file",
    naver: "drive_naver_review_file",
    meta: "drive_meta_review_file",
    threads: "drive_threads_review_file",
    images: imageIds,
  },
} as const;

function png() {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, 1080);
  view.setUint32(20, 1350);
  return bytes;
}

function fakeDrive(outside = new Set<string>()): MarketingDriveClient {
  const text = new Map<string, string>([
    ["review_manifest_file", JSON.stringify(manifest)],
    [manifest.files.site, "# 사이트 원문\n\n본문"],
    [manifest.files.naver, "# 네이버 원고\n\n본문"],
    [manifest.files.meta, "Meta 문안"],
    [manifest.files.threads, "1/2\n첫 글\n\n2/2\n둘째 글"],
  ]);
  return {
    async metadata(id): Promise<DriveFileMeta> {
      return {
        id,
        name: imageIds.includes(id) ? `${id}.png` : `${id}.md`,
        mimeType: imageIds.includes(id) ? "image/png" : id === "review_manifest_file" ? "application/json" : "text/markdown",
        size: imageIds.includes(id) ? 24 : (text.get(id)?.length ?? 1),
        parents: [manifest.driveFolderId],
      };
    },
    async download(id) { return imageIds.includes(id) ? png() : new TextEncoder().encode(text.get(id) ?? ""); },
    async isWithinOperationsFolder(id) { return !outside.has(id); },
    async createFolder() { throw new Error("not used"); },
    async upload() { throw new Error("not used"); },
    async listManifestFiles() { return ["review_manifest_file"]; },
    async listWeeklyPlanFiles() { return []; },
  };
}

test("review manifest links one produced package to one existing proposal without schedules", () => {
  const parsed = parseProposalReviewManifest(manifest);
  assert.equal(parsed.proposalPackageId, manifest.proposalPackageId);
  assert.equal(parsed.files.site, manifest.files.site);
  assert.equal(parsed.files.images.length, 7);
  assert.equal("schedules" in parsed, false);
  assert.throws(() => parseProposalReviewManifest({ ...manifest, schedules: [] }), /UNKNOWN_FIELD/);
  assert.throws(() => parseProposalReviewManifest({ ...manifest, packageId: manifest.proposalPackageId }), /REVIEW_PACKAGE_ID_INVALID/);
});

test("review preparation validates site-first copy, channel copy, cards and Drive boundaries", async () => {
  const prepared = await prepareProposalReviewPackage("review_manifest_file", fakeDrive());
  assert.match(prepared.siteBody, /사이트 원문/);
  assert.match(prepared.naverBody, /네이버 원고/);
  assert.deepEqual(prepared.threadsPosts, ["첫 글", "둘째 글"]);
  assert.equal(prepared.assets.length, 7);
  await assert.rejects(
    () => prepareProposalReviewPackage("review_manifest_file", fakeDrive(new Set([manifest.files.site]))),
    /DRIVE_FILE_OUTSIDE_OPERATIONS_FOLDER/,
  );
});

test("promotion job creates a new version only and never creates approval, schedule or publication evidence", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/server/proposalReviewImportJob.ts", import.meta.url), "utf8");
  assert.match(source, /status: "review_pending"/);
  assert.match(source, /proposalPackageId/);
  assert.match(source, /currentVersionId/);
  assert.match(source, /proposal_promoted_to_review/);
  assert.doesNotMatch(source, /insert\(marketingChannelSchedules\)|insert\(marketingApprovals\)|insert\(marketingPublishAttempts\)|insert\(marketingCanonicalReadbacks\)/);
});
