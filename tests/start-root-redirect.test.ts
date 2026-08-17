import assert from "node:assert/strict";
import test from "node:test";
import { startRootRedirectUrl } from "../apps/www/src/features/site-routing/hosts.ts";

test("redirects the start host root to the career check landing", () => {
  assert.equal(
    startRootRedirectUrl("start.careerdirect.kr", "/")?.toString(),
    "https://start.careerdirect.kr/career-check",
  );
});

test("preserves campaign query parameters on the root redirect", () => {
  assert.equal(
    startRootRedirectUrl(
      "start.careerdirect.kr",
      "/",
      "?utm_source=naver_blog&utm_campaign=blog_launch_2026q3",
    )?.toString(),
    "https://start.careerdirect.kr/career-check?utm_source=naver_blog&utm_campaign=blog_launch_2026q3",
  );
});

test("does not redirect other start paths or the official host", () => {
  assert.equal(startRootRedirectUrl("start.careerdirect.kr", "/career-check"), null);
  assert.equal(startRootRedirectUrl("www.careerdirect.kr", "/"), null);
});
