import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { selectMarketingChannelContext } from "../apps/www/src/features/marketing/channelContext.ts";

const schedules = [
  { id: 1, contentId: 7, versionId: 10, channel: "naver" },
  { id: 2, contentId: 7, versionId: 10, channel: "threads" },
  { id: 3, contentId: 8, versionId: 10, channel: "threads" },
  { id: 4, contentId: 7, versionId: 9, channel: "threads" },
];

test("selects overview only when channel context is completely absent", () => {
  assert.deepEqual(selectMarketingChannelContext({}, 7, 10, schedules), { kind: "overview" });
  assert.equal(selectMarketingChannelContext({ channel: "threads" }, 7, 10, schedules).kind, "invalid");
  assert.equal(selectMarketingChannelContext({ schedule: "2" }, 7, 10, schedules).kind, "invalid");
  assert.equal(selectMarketingChannelContext({ channel: ["threads"], schedule: "2" }, 7, 10, schedules).kind, "invalid");
});

test("accepts only the matching current content schedule and channel", () => {
  const selected = selectMarketingChannelContext({ channel: "threads", schedule: "2" }, 7, 10, schedules);
  assert.equal(selected.kind, "channel");
  if (selected.kind === "channel") assert.equal(selected.schedule.id, 2);
  assert.equal(selectMarketingChannelContext({ channel: "facebook", schedule: "2" }, 7, 10, schedules).kind, "invalid");
  assert.equal(selectMarketingChannelContext({ channel: "threads", schedule: "3" }, 7, 10, schedules).kind, "invalid");
  assert.equal(selectMarketingChannelContext({ channel: "threads", schedule: "4" }, 7, 10, schedules).kind, "invalid");
  assert.equal(selectMarketingChannelContext({ channel: "unknown", schedule: "2" }, 7, 10, schedules).kind, "invalid");
});

test("calendar preserves channel and schedule while direct content links stay unchanged", () => {
  const calendar = readFileSync(new URL("../apps/www/src/features/marketing/components/MarketingCalendar.tsx", import.meta.url), "utf8");
  const list = readFileSync(new URL("../apps/www/src/features/marketing/components/ContentList.tsx", import.meta.url), "utf8");
  assert.match(calendar, /query: \{ channel: item\.channel, schedule: String\(item\.id\) \}/);
  assert.match(list, /href=\{`\/admin\/marketing\/\$\{item\.id\}`\}/);
});

test("only Facebook and Instagram reuse cards while Naver and Threads are text-only", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/components/ChannelContentDetail.tsx", import.meta.url), "utf8");
  assert.match(source, /const usesCards = channel === "facebook" \|\| channel === "instagram"/);
  assert.match(source, /네이버 블로그는 장문 원고와 글 하단 CTA 링크로 수동 발행합니다/);
  assert.match(source, /Threads는 현재 이미지 없이 문안으로 발행합니다/);
  assert.match(source, /usesCards \? <AssetPreviewGallery/);
  assert.match(source, /channel === "naver" \? <NaverPublishingPanel/);
  assert.doesNotMatch(source, /<NaverPublishingPanel[^>]*assets=/s);
  assert.doesNotMatch(source, /ApprovalActions|AssetUploader/);
});

test("invalid context is explicit and never silently replaced with overview", () => {
  const page = readFileSync(new URL("../apps/www/src/app/admin/marketing/[id]/page.tsx", import.meta.url), "utf8");
  const invalid = readFileSync(new URL("../apps/www/src/features/marketing/components/InvalidChannelContext.tsx", import.meta.url), "utf8");
  assert.match(page, /context\.kind === "overview"/);
  assert.match(page, /context\.kind === "channel"/);
  assert.match(page, /<InvalidChannelContext/);
  assert.match(invalid, /선택한 채널 일정을 찾을 수 없습니다/);
});
