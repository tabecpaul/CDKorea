import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseManualPublicationRequest } from "../apps/www/src/features/marketing/manualPublicationRequest.ts";

test("validates each manual social channel URL and actual publication time", () => {
  for (const [channel, url] of [["facebook", "https://www.facebook.com/careerdirect/posts/1"], ["instagram", "https://www.instagram.com/p/example/"], ["threads", "https://www.threads.net/@careerdirect_korea/post/example"]] as const) {
    const parsed = parseManualPublicationRequest({ publishedUrl: url, publishedAt: "2026-09-07T09:10:00+09:00" }, channel);
    assert.equal(parsed?.publishedUrl, url);
    assert.equal(parsed?.publishedAt, "2026-09-07T00:10:00.000Z");
  }
  assert.equal(parseManualPublicationRequest({ publishedUrl: "https://example.test/post", publishedAt: "2026-09-07T09:10:00+09:00" }, "instagram"), null);
  assert.equal(parseManualPublicationRequest({ publishedUrl: "https://www.instagram.com/p/example/", publishedAt: "not-a-date" }, "instagram"), null);
});

test("common manual publication service records actual URL/time while preserving the Naver wrapper", () => {
  const service = readFileSync(new URL("../apps/www/src/features/marketing/server/manualPublication.ts", import.meta.url), "utf8");
  const naver = readFileSync(new URL("../apps/www/src/features/marketing/server/naverCompletion.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../apps/www/src/app/api/admin/marketing/[id]/channels/[channel]/complete/route.ts", import.meta.url), "utf8");
  assert.match(service, /const publishedAt = new Date\(input\.request\.publishedAt\)/);
  assert.match(service, /status: "manual_published"/);
  assert.match(service, /actualPublishedAt/);
  assert.match(naver, /completeManualPublication/);
  assert.match(naver, /NAVER_COPY_MISSING/);
  assert.match(route, /values\.channel === "naver"/);
  assert.doesNotMatch(service, /fetch\(/);
});

test("dashboard surfaces gate state and actual manual publication evidence", () => {
  const list = readFileSync(new URL("../apps/www/src/features/marketing/components/ContentList.tsx", import.meta.url), "utf8");
  const detail = readFileSync(new URL("../apps/www/src/features/marketing/components/ContentDetail.tsx", import.meta.url), "utf8");
  const channel = readFileSync(new URL("../apps/www/src/features/marketing/components/ChannelContentDetail.tsx", import.meta.url), "utf8");
  assert.match(list, /Duplicate/);
  assert.match(list, /Production Read-back|Read-back/);
  assert.match(list, /Channel Readiness/);
  assert.match(detail, /GateControlPanel/);
  assert.match(detail, /실제 게시:/);
  assert.match(channel, /ManualPublicationPanel/);
});
