import assert from "node:assert/strict";
import test from "node:test";
import { AssetValidationError, validateAssetCount, validateMarketingPng } from "../apps/www/src/features/marketing/server/assetValidation.ts";

function png(width = 1080, height = 1350) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

test("accepts real PNG signatures at the approved social dimensions", () => {
  const result = validateMarketingPng(png(), "slide-01.png");
  assert.equal(result.width, 1080);
  assert.equal(result.height, 1350);
  assert.match(result.sha256, /^[0-9a-f]{64}$/);
});

test("rejects MIME disguises and wrong dimensions", () => {
  assert.throws(() => validateMarketingPng(png(), "slide.jpg", "image/jpeg"), (error) => error instanceof AssetValidationError && error.code === "PNG_MIME_REQUIRED");
  assert.throws(() => validateMarketingPng(new Uint8Array(24), "fake.png"), (error) => error instanceof AssetValidationError && error.code === "PNG_SIGNATURE_INVALID");
  assert.throws(() => validateMarketingPng(png(1080, 1080), "square.png"), (error) => error instanceof AssetValidationError && error.code === "IMAGE_DIMENSIONS_INVALID");
});

test("allows four through eight assets only", () => {
  for (const count of [4, 5, 8]) assert.doesNotThrow(() => validateAssetCount(count));
  for (const count of [3, 9]) assert.throws(() => validateAssetCount(count), (error) => error instanceof AssetValidationError && error.code === "IMAGE_COUNT");
});
