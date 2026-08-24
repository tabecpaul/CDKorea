import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isOfficialPublicPath, isStartOwnedPath } from "../apps/www/src/features/site-routing/paths.ts";
import { giftsTalentsStrengthsArticle } from "../apps/www/src/features/official-site/blog/giftsTalentsStrengths.ts";

const naver = fs.readFileSync("campaigns/faith-calling-series-2026q3/copy/naver-blog-03.md", "utf8");
const meta = fs.readFileSync("campaigns/faith-calling-series-2026q3/copy/instagram-facebook.md", "utf8");
const threads = fs.readFileSync("campaigns/faith-calling-series-2026q3/copy/threads-03.md", "utf8");

test("official article route belongs only to the official host", () => {
  assert.equal(isOfficialPublicPath("/blog/gifts-talents-strengths"), true);
  assert.equal(isStartOwnedPath("/blog/gifts-talents-strengths"), false);
});

test("article preserves the four distinct concepts", () => {
  assert.deepEqual(
    giftsTalentsStrengthsArticle.definitions.map(({ term }) => term),
    ["영적 은사", "재능", "기술", "강점"],
  );
});

test("channel copy uses the single career-check CTA", () => {
  for (const copy of [naver, meta.slice(meta.indexOf("## 03 · 은사·재능·강점")), threads]) {
    assert.match(copy, /career-check/);
    assert.doesNotMatch(copy, /assessment-consultation/);
  }
  assert.match(naver, /utm_source=naver/);
  assert.match(threads, /utm_source=threads/);
});

test("naver copy keeps the approved category and mobile link check", () => {
  assert.match(naver, /이직·커리어 전환/);
  assert.match(naver, /모바일에서 CTA를 눌러/);
});
