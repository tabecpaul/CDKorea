import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseMarketingApprovalRequest } from "../apps/www/src/features/marketing/approvalRequest.ts";
import { isApprovalSnapshotComplete } from "../apps/www/src/features/marketing/approvalCompleteness.ts";

test("accepts only the two documented approval request shapes", () => {
  assert.deepEqual(parseMarketingApprovalRequest({ action: "approve" }), { action: "approve" });
  assert.deepEqual(parseMarketingApprovalRequest({ action: "request_revision", note: "문구를 수정해 주세요." }), { action: "request_revision", note: "문구를 수정해 주세요." });
  assert.equal(parseMarketingApprovalRequest({ action: "approve", publish: true }), null);
  assert.equal(parseMarketingApprovalRequest({ action: "request_revision" }), null);
  assert.equal(parseMarketingApprovalRequest(null), null);
});

test("approval service does not update schedules or connect publishing and Drive clients", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/server/approval.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /update\(marketingChannelSchedules\)/);
  assert.doesNotMatch(source, /createMarketingDriveClient|publishMarketing|fetch\(/);
  assert.match(source, /action: "content_approved"/);
  assert.match(source, /action: "content_revision_requested"/);
});

test("approval UI states clearly that every channel remains manual", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/components/ApprovalActions.tsx", import.meta.url), "utf8");
  assert.match(source, /승인은 자동 게시하지 않습니다/);
  assert.match(source, /모두 수동 발행 상태로 유지됩니다/);
  assert.match(source, /"최종 승인"/);
  assert.match(source, /"수정 요청"/);
});

test("incomplete proposals cannot pass approval even after a later state transition", () => {
  const ready = { campaignKey: "blog_launch_2026q3", ctaKind: "callback-20m", naverCategory: "이직·커리어 전환", naverBody: "원고", metaCaption: "문안", threadsPosts: ["게시문"], assetHashes: ["a", "b", "c", "d"], schedules: [{ channel: "naver", utmUrl: "https://example.com", scheduledAt: new Date() }] };
  assert.equal(isApprovalSnapshotComplete(ready), true);
  assert.equal(isApprovalSnapshotComplete({ ...ready, campaignKey: "" }), false);
  assert.equal(isApprovalSnapshotComplete({ ...ready, ctaKind: "" }), false);
  assert.equal(isApprovalSnapshotComplete({ ...ready, naverBody: null, assetHashes: [], schedules: [] }), false);
});
