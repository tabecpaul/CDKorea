import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { AssetPreviewError, verifyAssetPreviewBytes } from "../apps/www/src/features/marketing/assetPreviewValidation.ts";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const record = { id: 1, driveFileId: "drive-file", mimeType: "image/png", byteSize: png.byteLength, sha256: createHash("sha256").update(png).digest("hex") };
const meta = { id: "drive-file", mimeType: "image/png", size: png.byteLength };

test("accepts only PNG bytes matching Drive metadata and the stored hash", () => {
  assert.equal(verifyAssetPreviewBytes(record, meta, png, 1024).mimeType, "image/png");
  assert.throws(() => verifyAssetPreviewBytes(record, { ...meta, mimeType: "image/jpeg" }, png, 1024), (error) => error instanceof AssetPreviewError && error.code === "ASSET_INTEGRITY_MISMATCH");
  assert.throws(() => verifyAssetPreviewBytes(record, { ...meta, size: png.byteLength + 1 }, png, 1024), AssetPreviewError);
  assert.throws(() => verifyAssetPreviewBytes(record, meta, Uint8Array.from([1, 2, 3, 4]), 1024), AssetPreviewError);
  assert.throws(() => verifyAssetPreviewBytes({ ...record, sha256: "0".repeat(64) }, meta, png, 1024), AssetPreviewError);
});

test("preview service limits lookup to the current content version and never mutates storage", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/server/assetPreview.ts", import.meta.url), "utf8");
  assert.match(source, /eq\(marketingContentAssets\.versionId, marketingContents\.currentVersionId\)/);
  assert.match(source, /isWithinOperationsFolder/);
  assert.match(source, /verifyAssetPreviewBytes/);
  assert.doesNotMatch(source, /\.update\(|\.insert\(|\.delete\(|\.upload\(/);
});

test("admin preview route requires authentication and returns private inline PNG headers", () => {
  const source = readFileSync(new URL("../apps/www/src/app/api/admin/marketing/[id]/assets/[assetId]/preview/route.ts", import.meta.url), "utf8");
  assert.match(source, /hasAdminSession/);
  assert.match(source, /"content-disposition": "inline"/);
  assert.match(source, /"cache-control": "private, no-store"/);
  assert.match(source, /"x-content-type-options": "nosniff"/);
  assert.doesNotMatch(source, /attachment|drive\.google\.com|redirect\(/);
});

test("gallery renders ordered internal previews and a per-card failure message", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/components/AssetPreviewGallery.tsx", import.meta.url), "utf8");
  assert.match(source, /현재 승인 대상/);
  assert.match(source, /\/api\/admin\/marketing\/\$\{contentId\}\/assets\/\$\{asset\.id\}\/preview/);
  assert.match(source, /미리보기를 불러오지 못했습니다/);
  assert.match(source, /sm:grid-cols-2/);
  assert.doesNotMatch(source, /다운로드|driveFileId/);
});
