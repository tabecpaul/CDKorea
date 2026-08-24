import assert from "node:assert/strict";
import test from "node:test";
import type { ApprovalSnapshot, MarketingChannelState } from "../apps/www/src/features/marketing/domain.ts";
import {
  canonicalApprovalSnapshot,
  canCancelChannelApproval,
  canTransitionContent,
  cancellableApprovalChannels,
  requiresReapproval,
  summarizeContentStatus,
} from "../apps/www/src/features/marketing/stateMachine.ts";
import { approvalCopyHash, approvalSnapshotHash, buildApprovalSnapshot } from "../apps/www/src/features/marketing/server/approvalSnapshot.ts";

const approvedSnapshot: ApprovalSnapshot = {
  copyHash: "copy-v1",
  assetHashes: ["slide-01", "slide-02", "slide-03", "slide-04", "slide-05"],
  ctaKind: "callback-20m",
  utmUrls: { naver: "https://example.test/naver", instagram: "https://example.test/instagram" },
  scheduledAt: { naver: "2026-08-29T22:40:00Z", instagram: "2026-08-30T01:00:00Z" },
};

test("rejects scheduling without an active approval", () => {
  assert.equal(canTransitionContent("approved", "scheduled"), false);
  assert.equal(canTransitionContent("approved", "scheduled", { hasActiveApproval: false }), false);
  assert.equal(canTransitionContent("approved", "scheduled", { hasActiveApproval: true }), true);
  assert.equal(canTransitionContent("review_pending", "scheduled", { hasActiveApproval: true }), false);
});

test("allows only the documented content workflow", () => {
  assert.equal(canTransitionContent("proposal", "producing"), true);
  assert.equal(canTransitionContent("producing", "review_pending"), true);
  assert.equal(canTransitionContent("review_pending", "revision_requested"), true);
  assert.equal(canTransitionContent("revision_requested", "review_pending"), true);
  assert.equal(canTransitionContent("published", "review_pending"), false);
});

test("requires reapproval for copy, image, CTA, UTM, or schedule changes", () => {
  assert.equal(requiresReapproval(approvedSnapshot, { ...approvedSnapshot }), false);
  assert.equal(requiresReapproval(approvedSnapshot, { ...approvedSnapshot, copyHash: "copy-v2" }), true);
  assert.equal(requiresReapproval(approvedSnapshot, { ...approvedSnapshot, assetHashes: [...approvedSnapshot.assetHashes.slice(0, 4), "slide-05-v2"] }), true);
  assert.equal(requiresReapproval(approvedSnapshot, { ...approvedSnapshot, ctaKind: "career-check" }), true);
  assert.equal(requiresReapproval(approvedSnapshot, { ...approvedSnapshot, utmUrls: { ...approvedSnapshot.utmUrls, instagram: "https://example.test/instagram-v2" } }), true);
  assert.equal(requiresReapproval(approvedSnapshot, { ...approvedSnapshot, scheduledAt: { ...approvedSnapshot.scheduledAt, instagram: "2026-08-30T02:00:00Z" } }), true);
});

test("builds deterministic approval snapshot hashes in fixed order", () => {
  const snapshot = buildApprovalSnapshot({
    copy: { naverBody: "naver", metaCaption: "meta", threadsPosts: ["one", "two"] },
    assetHashes: ["slide-01", "slide-02"],
    ctaKind: "career-check",
    schedules: [
      { channel: "threads", utmUrl: "https://example.test/threads", scheduledAt: new Date("2026-08-27T12:00:00Z") },
      { channel: "naver", utmUrl: "https://example.test/naver", scheduledAt: new Date("2026-08-26T23:00:00Z") },
    ],
  });
  assert.equal(snapshot.copyHash, approvalCopyHash({ naverBody: "naver", metaCaption: "meta", threadsPosts: ["one", "two"] }));
  assert.match(approvalSnapshotHash(snapshot), /^[0-9a-f]{64}$/);
  assert.equal(approvalSnapshotHash(snapshot), approvalSnapshotHash({ ...snapshot }));
  assert.equal(canonicalApprovalSnapshot(snapshot), canonicalApprovalSnapshot({ ...snapshot }));
  assert.notEqual(approvalSnapshotHash(snapshot), approvalSnapshotHash({ ...snapshot, assetHashes: ["slide-02", "slide-01"] }));
});

test("keeps partial publication scheduled and completes after Naver manual publication", () => {
  const partial: MarketingChannelState[] = [
    { channel: "facebook", status: "published" },
    { channel: "instagram", status: "publish_failed" },
    { channel: "naver", status: "approval_pending" },
  ];
  assert.equal(summarizeContentStatus("approved", partial), "scheduled");
  assert.equal(summarizeContentStatus("approved", [
    { channel: "facebook", status: "published" },
    { channel: "instagram", status: "published" },
    { channel: "naver", status: "manual_published" },
  ]), "published");
});

test("excludes published channels from approval cancellation", () => {
  assert.equal(canCancelChannelApproval("published"), false);
  assert.equal(canCancelChannelApproval("manual_published"), false);
  assert.deepEqual(cancellableApprovalChannels([
    { channel: "facebook", status: "published" },
    { channel: "instagram", status: "scheduled" },
    { channel: "naver", status: "manual_published" },
    { channel: "threads", status: "action_required" },
  ]), ["instagram", "threads"]);
});
