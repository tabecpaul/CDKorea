import assert from "node:assert/strict";
import test from "node:test";
import { formatAnalyticsStartDate } from "../apps/www/src/features/analytics/dashboardDate.ts";

test("formats analytics dates after the server cache serializes them", () => {
  const date = new Date("2026-07-26T00:00:00.000Z");
  assert.equal(formatAnalyticsStartDate(date), formatAnalyticsStartDate(date.toISOString()));
});
