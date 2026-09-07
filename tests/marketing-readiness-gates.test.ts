import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalReadbackResult, channelReadiness, hasValidAdminApproval, notificationBoundary } from "../apps/www/src/features/marketing/gates.ts";
import { parseCanonicalReadbackRequest, parseMarketingGateRequest } from "../apps/www/src/features/marketing/gateRequest.ts";

test("validates explicit gate request values and does not accept partial canonical evidence", () => {
  assert.deepEqual(parseMarketingGateRequest({ duplicateGate: "PASS", siteFirstStatus: "NOT_PUBLISHED", canonicalUrl: "", expectedArticleIdentity: "" }), { duplicateGate: "PASS", siteFirstStatus: "NOT_PUBLISHED", canonicalUrl: null, expectedArticleIdentity: null });
  assert.equal(parseMarketingGateRequest({ duplicateGate: "PASS", siteFirstStatus: "PUBLISHED", canonicalUrl: "https://careerdirect.kr/a", expectedArticleIdentity: "" }), null);
  assert.equal(parseMarketingGateRequest({ duplicateGate: "AUTO", siteFirstStatus: "PUBLISHED", canonicalUrl: "", expectedArticleIdentity: "" }), null);
  assert.equal(parseCanonicalReadbackRequest({ canonicalUrl: "https://www.careerdirect.kr/a", expectedArticleIdentity: "일하는 환경" })?.canonicalUrl, "https://www.careerdirect.kr/a");
});

test("readiness cannot become READY without every authoritative gate", () => {
  const ready = { duplicateGate: "PASS" as const, hasAdminApproval: true, siteFirstStatus: "PUBLISHED" as const, canonicalReadbackStatus: "PASS" as const };
  assert.equal(channelReadiness(ready), "READY");
  assert.equal(channelReadiness({ ...ready, hasAdminApproval: false }), "HOLD");
  assert.equal(channelReadiness({ ...ready, duplicateGate: "UNKNOWN" }), "HOLD");
  assert.equal(channelReadiness({ ...ready, duplicateGate: "REVISE" }), "ACTION_REQUIRED");
  assert.equal(channelReadiness({ ...ready, duplicateGate: "BLOCKED" }), "ACTION_REQUIRED");
  assert.equal(channelReadiness({ ...ready, siteFirstStatus: "FAILED" }), "ACTION_REQUIRED");
  assert.equal(channelReadiness({ ...ready, canonicalReadbackStatus: "FAILED" }), "ACTION_REQUIRED");
});

test("only an active matching approval snapshot is authoritative approval evidence", () => {
  assert.equal(hasValidAdminApproval({ versionStatus: "approved", approvedSnapshotHash: "a", approvalStatus: "approved", approvalSnapshotHash: "a" }), true);
  assert.equal(hasValidAdminApproval({ versionStatus: "approved", approvedSnapshotHash: "a", approvalStatus: "approved", approvalSnapshotHash: "b" }), false);
  assert.equal(hasValidAdminApproval({ versionStatus: "review_pending", approvedSnapshotHash: "a", approvalStatus: "approved", approvalSnapshotHash: "a" }), false);
});

test("404 and article identity mismatch always fail Production canonical read-back", () => {
  assert.equal(canonicalReadbackResult({ httpStatus: 404, expectedArticleIdentity: "직업 이름보다 먼저", observedTitle: "직업 이름보다 먼저", responseText: "직업 이름보다 먼저" }), "FAILED");
  assert.equal(canonicalReadbackResult({ httpStatus: 200, expectedArticleIdentity: "직업 이름보다 먼저", observedTitle: "다른 글", responseText: "본문" }), "FAILED");
  assert.equal(canonicalReadbackResult({ httpStatus: 200, expectedArticleIdentity: "직업 이름보다 먼저", observedTitle: "직업 이름보다 먼저 확인해야 할 일하는 환경", responseText: "본문" }), "PASS");
});

test("notification boundary remains an event classification, not a notification integration", () => {
  assert.equal(notificationBoundary({ versionStatus: "review_pending", readiness: "HOLD", scheduledToday: false, hasFailedOrOverduePublication: false }), "REVIEW_REQUIRED");
  assert.equal(notificationBoundary({ versionStatus: "approved", readiness: "READY", scheduledToday: true, hasFailedOrOverduePublication: false }), "TODAY_READY");
  assert.equal(notificationBoundary({ versionStatus: "approved", readiness: "ACTION_REQUIRED", scheduledToday: false, hasFailedOrOverduePublication: false }), "HOLD_ACTION_REQUIRED");
  assert.equal(notificationBoundary({ versionStatus: "approved", readiness: "READY", scheduledToday: true, hasFailedOrOverduePublication: true }), "PUBLISH_FAILED_OVERDUE");
});

test("schema and server implementation preserve append-only evidence and production-domain allowlist", () => {
  const schema = readFileSync(new URL("../packages/db/src/schema.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../packages/db/drizzle/0015_marketing_readiness_gates.sql", import.meta.url), "utf8");
  const service = readFileSync(new URL("../apps/www/src/features/marketing/server/gates.ts", import.meta.url), "utf8");
  assert.match(schema, /marketingCanonicalReadbacks/);
  assert.match(migration, /duplicate_gate.*UNKNOWN/);
  assert.match(migration, /marketing_canonical_readbacks/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL PRIVILEGES/);
  assert.match(service, /careerdirect\.kr/);
  assert.doesNotMatch(service, /start\.careerdirect\.kr/);
  assert.match(service, /tx\.insert\(marketingCanonicalReadbacks\)/);
  assert.match(service, /cache: "no-store"/);
});
