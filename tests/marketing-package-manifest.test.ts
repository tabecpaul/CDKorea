import assert from "node:assert/strict";
import test from "node:test";
import { ManifestError, parseContentPackageManifest } from "../apps/www/src/features/marketing/server/packageManifest.ts";

const driveIds = Array.from({ length: 8 }, (_, index) => `drive_image_file_${index + 1}`);
const valid = {
  schemaVersion: 1,
  packageId: "2026-08-31-career-topic",
  driveFolderId: "drive_folder_12345",
  canvaDesignUrl: "https://www.canva.com/design/example/view",
  content: { slug: "career-topic", title: "콘텐츠 제목", campaignKey: "campaign_key", ctaKind: "callback-20m", naverCategory: "이직·커리어 전환" },
  files: { naver: "drive_naver_file_1", meta: "drive_meta_file_12", threads: "drive_threads_file", images: driveIds.slice(0, 5) },
  schedules: [{ channel: "naver", scheduledAt: "2026-08-31T07:40:00+09:00", mode: "manual", utmUrl: "https://start.careerdirect.kr/career-check?utm_source=naver&utm_medium=organic_social&utm_campaign=campaign_key" }],
} as const;

test("accepts complete packages with four through eight cards", () => {
  for (const count of [4, 5, 8]) {
    const parsed = parseContentPackageManifest({ ...valid, files: { ...valid.files, images: driveIds.slice(0, count) } });
    assert.equal(parsed.files.images.length, count);
    assert.equal(parsed.schedules[0].channel, "naver");
  }
});

test("rejects three or nine cards and duplicate image ids", () => {
  assert.throws(() => parseContentPackageManifest({ ...valid, files: { ...valid.files, images: driveIds.slice(0, 3) } }), (error) => error instanceof ManifestError && error.code === "IMAGE_COUNT");
  assert.throws(() => parseContentPackageManifest({ ...valid, files: { ...valid.files, images: [...driveIds, "drive_image_file_9"] } }), (error) => error instanceof ManifestError && error.code === "IMAGE_COUNT");
  assert.throws(() => parseContentPackageManifest({ ...valid, files: { ...valid.files, images: [driveIds[0], driveIds[1], driveIds[2], driveIds[3], driveIds[0]] } }), (error) => error instanceof ManifestError && error.code === "DUPLICATE_IMAGE");
});

test("rejects unknown fields and incomplete UTM parameters", () => {
  assert.throws(() => parseContentPackageManifest({ ...valid, publishNow: true }), (error) => error instanceof ManifestError && error.code === "UNKNOWN_FIELD");
  assert.throws(() => parseContentPackageManifest({ ...valid, schedules: [{ ...valid.schedules[0], utmUrl: "https://start.careerdirect.kr/career-check?utm_source=naver" }] }), (error) => error instanceof ManifestError && error.code === "UTM_REQUIRED");
});

test("keeps Naver manual and requires explicit KST offsets", () => {
  assert.throws(() => parseContentPackageManifest({ ...valid, schedules: [{ ...valid.schedules[0], mode: "automatic" }] }), (error) => error instanceof ManifestError && error.code === "INVALID_MODE");
  assert.throws(() => parseContentPackageManifest({ ...valid, schedules: [{ ...valid.schedules[0], scheduledAt: "2026-08-31T07:40:00Z" }] }), (error) => error instanceof ManifestError && error.code === "INVALID_KST_TIME");
});
