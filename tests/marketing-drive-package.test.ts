import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { MarketingDriveClient, DriveFileMeta } from "../apps/www/src/features/marketing/server/drive.ts";
import { prepareMarketingPackage } from "../apps/www/src/features/marketing/server/packagePreparation.ts";

function png(width = 1080, height = 1350) {
  const bytes = new Uint8Array(24); bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer); view.setUint32(16, width); view.setUint32(20, height); return bytes;
}

const imageIds = ["drive_image_01", "drive_image_02", "drive_image_03", "drive_image_04", "drive_image_05"];
const manifest = {
  schemaVersion: 1, packageId: "2026-08-31-career-topic", driveFolderId: "drive_folder_12345",
  content: { slug: "career-topic", title: "콘텐츠 제목", campaignKey: "campaign_key", ctaKind: "callback-20m", naverCategory: "이직·커리어 전환" },
  files: { naver: "drive_naver_file", meta: "drive_meta_file_1", threads: "drive_threads_01", images: imageIds },
  schedules: [{ channel: "naver", scheduledAt: "2026-08-31T07:40:00+09:00", mode: "manual", utmUrl: "https://start.careerdirect.kr/career-check?utm_source=naver&utm_medium=organic_social&utm_campaign=campaign_key" }],
};

function fakeDrive(outside = new Set<string>(), threads = JSON.stringify(["첫 글", "둘째 글"]), historical = false): MarketingDriveClient {
  const text = new Map<string, string>([
    ["manifest_file_01", JSON.stringify(historical ? { ...manifest, schedules: [], recovery: { kind: "historical_recovery", sourceStatus: "produced_unpublished", sourceFileIds: [manifest.files.naver] } } : manifest)], [manifest.files.naver, "네이버 원고"], [manifest.files.meta, "Meta 문안"], [manifest.files.threads, threads],
  ]);
  return {
    async metadata(id): Promise<DriveFileMeta> { return { id, name: imageIds.includes(id) ? `${id}.png` : `${id}.txt`, mimeType: imageIds.includes(id) ? "image/png" : id === "manifest_file_01" ? "application/json" : "text/plain", size: 24, parents: ["drive_folder_12345"] }; },
    async download(id) { return imageIds.includes(id) ? png(...(historical ? [1350, 1687] as const : [])) : new TextEncoder().encode(text.get(id) ?? ""); },
    async isWithinOperationsFolder(id) { return !outside.has(id); },
    async createFolder() { throw new Error("not used"); }, async upload() { throw new Error("not used"); }, async listManifestFiles() { return ["manifest_file_01"]; }, async listWeeklyPlanFiles() { return []; },
  };
}

test("prepares copy and ordered image hashes without changing Drive", async () => {
  const prepared = await prepareMarketingPackage("manifest_file_01", fakeDrive());
  assert.equal(prepared.assets.length, 5);
  assert.equal(prepared.assets[0].driveFileId, imageIds[0]);
  assert.deepEqual(prepared.threadsPosts, ["첫 글", "둘째 글"]);
});

test("prepares verified historical cards at their unchanged source dimensions", async () => {
  const prepared = await prepareMarketingPackage("manifest_file_01", fakeDrive(new Set(), JSON.stringify(["첫 글"]), true));
  assert.equal(prepared.assets.length, 5);
  assert.equal(prepared.assets[0].width, 1350);
  assert.equal(prepared.assets[0].height, 1687);
  assert.deepEqual(prepared.manifest.schedules, []);
});

test("preserves source numbered Threads Markdown as four posts for historical recovery", async () => {
  const original = "1/4\n첫 글\n\n2/4\n둘째 글\n\n3/4\n셋째 글\n\n4/4\n넷째 글\n";
  const prepared = await prepareMarketingPackage("manifest_file_01", fakeDrive(new Set(), original));
  assert.deepEqual(prepared.threadsPosts, ["첫 글", "둘째 글", "셋째 글", "넷째 글"]);
});

test("rejects references outside the configured operations folder", async () => {
  await assert.rejects(() => prepareMarketingPackage("manifest_file_01", fakeDrive(new Set([imageIds[2]]))), /DRIVE_FILE_OUTSIDE_OPERATIONS_FOLDER/);
});

test("historical complete import has a collision guard before creating a version", () => {
  const source = readFileSync(new URL("../apps/www/src/features/marketing/server/importJob.ts", import.meta.url), "utf8");
  assert.match(source, /HISTORICAL_RECOVERY_COLLISION/);
  assert.match(source, /prepared\.manifest\.recovery/);
});
