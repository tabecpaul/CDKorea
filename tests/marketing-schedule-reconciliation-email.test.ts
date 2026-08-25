import assert from "node:assert/strict";
import test from "node:test";
import { buildReconciliationEmail } from "../apps/www/src/features/marketing/server/reconciliationEmail.ts";

test("renders the three fixed groups and Naver manual checks", () => {
  const email = buildReconciliationEmail({
    weekStart: "2026-08-31",
    imported: [{ slug: "ready", title: "준비 완료", campaignKey: "campaign" }],
    missing: [{ slug: "missing", title: "<누락>", campaignKey: "campaign", reason: "PACKAGE_MISSING" }],
    completedOrHeld: [{ slug: "held", title: "보류", campaignKey: "campaign", note: "관리자 확인" }],
    rejectedManifests: 1,
  }, "https://start.careerdirect.kr");
  assert.match(email.subject, /조치 1건/);
  assert.match(email.html, /임포트 완료 1건/);
  assert.match(email.html, /준비·임포트 누락 1건/);
  assert.match(email.html, /발행 완료·보류 1건/);
  assert.match(email.html, /CTA 링크를 직접 연결/);
  assert.match(email.html, /&lt;누락&gt;/);
  assert.doesNotMatch(email.html, /<누락>/);
});
