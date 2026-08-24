import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseNaverCompletionRequest } from "../apps/www/src/features/marketing/naverCompletionRequest.ts";

test("accepts only a confirmed HTTPS blog.naver.com publication URL", () => {
  assert.deepEqual(parseNaverCompletionRequest({
    publishedUrl: " https://blog.naver.com/careerdirect/123?from=post#section ",
    ctaLinked: true,
    mobileDestinationChecked: true,
  }), {
    publishedUrl: "https://blog.naver.com/careerdirect/123?from=post#section",
    ctaLinked: true,
    mobileDestinationChecked: true,
  });
  assert.equal(parseNaverCompletionRequest({ publishedUrl: "https://blog.naver.com/a", ctaLinked: false, mobileDestinationChecked: true }), null);
  assert.equal(parseNaverCompletionRequest({ publishedUrl: "http://blog.naver.com/a", ctaLinked: true, mobileDestinationChecked: true }), null);
  assert.equal(parseNaverCompletionRequest({ publishedUrl: "https://blog.naver.com.evil.test/a", ctaLinked: true, mobileDestinationChecked: true }), null);
  assert.equal(parseNaverCompletionRequest({ publishedUrl: "https://user@blog.naver.com/a", ctaLinked: true, mobileDestinationChecked: true }), null);
  assert.equal(parseNaverCompletionRequest({ publishedUrl: "https://blog.naver.com/a", ctaLinked: true, mobileDestinationChecked: true, publish: true }), null);
});

test("Naver completion service updates only the matching Naver schedule and writes a limited audit record", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/server/naverCompletion.ts", import.meta.url), "utf8");
  assert.match(source, /status: "manual_published"/);
  assert.match(source, /eq\(marketingChannelSchedules\.channel, "naver"\)/);
  assert.match(source, /action: "naver_manual_published"/);
  assert.match(source, /publishedHost: "blog\.naver\.com"/);
  assert.doesNotMatch(source, /update\(marketingContentVersions\)/);
  assert.doesNotMatch(source, /createMarketingDriveClient|publishMarketing|fetch\(/);
});

test("Naver panel requires both confirmations and exposes the approved publishing material", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/components/NaverPublishingPanel.tsx", import.meta.url), "utf8");
  assert.match(source, /CTA 문구에 링크를 직접 연결했습니다/);
  assert.match(source, /모바일에서 신청 화면이 정상적으로 열리는지 확인했습니다/);
  assert.match(source, /네이버 게시 URL/);
  assert.match(source, /수동 발행 완료/);
  assert.match(source, /ctaLinked && mobileChecked && publishedUrl/);
});

test("admin route keeps authentication and delegates only a validated request", () => {
  const source = readFileSync(new URL("../apps/www/src/app/api/admin/marketing/[id]/naver-complete/route.ts", import.meta.url), "utf8");
  assert.match(source, /hasAdminSession/);
  assert.match(source, /parseNaverCompletionRequest/);
  assert.match(source, /completeNaverPublication/);
  assert.doesNotMatch(source, /fetch\(/);
});
