import assert from "node:assert/strict";
import test from "node:test";
import { formatKoreaAdminDateTime } from "../apps/www/src/features/assessment-callback/adminDateTime.ts";

test("separates a Korea date and morning time without seconds", () => {
  assert.deepEqual(formatKoreaAdminDateTime(new Date("2026-08-15T00:38:48Z")), {
    date: "2026. 8. 15.",
    time: "오전 9:38",
  });
});

test("formats Korea noon and midnight correctly", () => {
  assert.equal(formatKoreaAdminDateTime(new Date("2026-08-15T03:00:00Z")).time, "오후 12:00");
  assert.equal(formatKoreaAdminDateTime(new Date("2026-08-15T15:00:00Z")).time, "오전 12:00");
});
