import assert from "node:assert/strict";
import test from "node:test";
import { formatKoreanMobilePhone } from "../apps/www/src/features/assessment-callback/phone.ts";

test("keeps short input readable while the user types", () => {
  assert.equal(formatKoreanMobilePhone("010"), "010");
  assert.equal(formatKoreanMobilePhone("0105"), "010-5");
  assert.equal(formatKoreanMobilePhone("0105231"), "010-5231");
});

test("formats ten and eleven digit mobile numbers", () => {
  assert.equal(formatKoreanMobilePhone("0111234567"), "011-123-4567");
  assert.equal(formatKoreanMobilePhone("01052311059"), "010-5231-1059");
});

test("normalizes pasted separators and non-digit characters", () => {
  assert.equal(formatKoreanMobilePhone("010 5231-1059"), "010-5231-1059");
  assert.equal(formatKoreanMobilePhone("010abc5231xyz1059"), "010-5231-1059");
});

test("limits input to eleven digits", () => {
  assert.equal(formatKoreanMobilePhone("0105231105999"), "010-5231-1059");
});
