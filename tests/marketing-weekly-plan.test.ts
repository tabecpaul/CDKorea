import assert from "node:assert/strict";
import test from "node:test";
import { nextKstWeekStart, parseWeeklyContentPlan, WeeklyPlanError } from "../apps/www/src/features/marketing/server/weeklyPlan.ts";

const valid = {
  schemaVersion: 1,
  weekStart: "2026-08-31",
  items: [{
    slug: "career-topic",
    title: "콘텐츠 제목",
    campaignKey: "career_direction_2026q3",
    schedules: [{ channel: "naver", scheduledAt: "2026-08-31T07:40:00+09:00" }],
    status: "approved",
  }],
} as const;

test("parses an approved weekly plan", () => {
  const parsed = parseWeeklyContentPlan(valid);
  assert.equal(parsed.weekStart, "2026-08-31");
  assert.equal(parsed.items[0].schedules[0].channel, "naver");
});

test("rejects invalid weeks, duplicate channels and unknown states", () => {
  assert.throws(() => parseWeeklyContentPlan({ ...valid, weekStart: "2026-09-01" }), (error) => error instanceof WeeklyPlanError && error.code === "WEEK_START_NOT_MONDAY");
  assert.throws(() => parseWeeklyContentPlan({ ...valid, items: [{ ...valid.items[0], schedules: [valid.items[0].schedules[0], valid.items[0].schedules[0]] }] }), (error) => error instanceof WeeklyPlanError && error.code === "DUPLICATE_CHANNEL");
  assert.throws(() => parseWeeklyContentPlan({ ...valid, items: [{ ...valid.items[0], status: "draft" }] }), (error) => error instanceof WeeklyPlanError && error.code === "INVALID_STATUS");
  assert.throws(() => parseWeeklyContentPlan({ ...valid, items: [{ ...valid.items[0], schedules: [{ channel: "naver", scheduledAt: "2026-09-07T07:40:00+09:00" }] }] }), (error) => error instanceof WeeklyPlanError && error.code === "SCHEDULE_OUTSIDE_WEEK");
});

test("selects the next Monday in Korea", () => {
  assert.equal(nextKstWeekStart(new Date("2026-08-28T01:00:00Z")), "2026-08-31");
  assert.equal(nextKstWeekStart(new Date("2026-08-31T00:00:00Z")), "2026-09-07");
});
