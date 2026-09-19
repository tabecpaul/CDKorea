import { validateMarketingPng, type ValidatedMarketingAsset } from "./assetValidation";
import { createMarketingDriveClient, readDriveText, type MarketingDriveClient } from "./drive";
import { parseProposalReviewManifest, type ProposalReviewManifest } from "./proposalReviewManifest";

export type PreparedProposalReviewPackage = {
  manifest: ProposalReviewManifest;
  siteBody: string;
  naverBody: string;
  metaCaption: string;
  threadsPosts: string[];
  assets: Array<ValidatedMarketingAsset & { driveFileId: string }>;
};

function copy(value: string, name: string, limit: number) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > limit) throw new Error(`${name}_COPY_INVALID`);
  return trimmed;
}

function threads(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  const matches = [...normalized.matchAll(/(?:^|\n)(\d{1,2})\/(\d{1,2})\s*\n/g)];
  if (!matches.length || matches[0].index !== 0) throw new Error("THREADS_COPY_INVALID");
  const total = Number(matches[0][2]);
  if (total < 1 || total > 20 || matches.length !== total || matches.some((match, index) => Number(match[1]) !== index + 1 || Number(match[2]) !== total)) throw new Error("THREADS_COPY_INVALID");
  const posts = matches.map((match, index) => normalized.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? normalized.length).trim());
  if (posts.some((post) => !post || post.length > 500)) throw new Error("THREADS_COPY_INVALID");
  return posts;
}

export async function prepareProposalReviewPackage(manifestFileId: string, drive: MarketingDriveClient = createMarketingDriveClient()): Promise<PreparedProposalReviewPackage> {
  if (!(await drive.isWithinOperationsFolder(manifestFileId))) throw new Error("DRIVE_FILE_OUTSIDE_OPERATIONS_FOLDER");
  const manifest = parseProposalReviewManifest(JSON.parse(await readDriveText(drive, manifestFileId)) as unknown);
  const referenced = [manifest.driveFolderId, manifest.files.site, manifest.files.naver, manifest.files.meta, manifest.files.threads, ...manifest.files.images];
  for (const id of referenced) if (!(await drive.isWithinOperationsFolder(id))) throw new Error("DRIVE_FILE_OUTSIDE_OPERATIONS_FOLDER");
  for (const id of [manifest.files.site, manifest.files.naver, manifest.files.meta, manifest.files.threads, ...manifest.files.images]) {
    if (!(await drive.metadata(id)).parents.includes(manifest.driveFolderId)) throw new Error("REVIEW_SOURCE_PARENT_MISMATCH");
  }
  const [siteBody, naverBody, metaCaption, threadsRaw, ...imageBytes] = await Promise.all([
    readDriveText(drive, manifest.files.site),
    readDriveText(drive, manifest.files.naver),
    readDriveText(drive, manifest.files.meta),
    readDriveText(drive, manifest.files.threads),
    ...manifest.files.images.map((id) => drive.download(id, 8 * 1024 * 1024)),
  ]);
  const imageMeta = await Promise.all(manifest.files.images.map((id) => drive.metadata(id)));
  return {
    manifest,
    siteBody: copy(siteBody as string, "SITE", 40_000),
    naverBody: copy(naverBody as string, "NAVER", 30_000),
    metaCaption: copy(metaCaption as string, "META", 5_000),
    threadsPosts: threads(threadsRaw as string),
    assets: imageBytes.map((bytes, index) => ({ ...validateMarketingPng(bytes as Uint8Array, imageMeta[index].name, imageMeta[index].mimeType), driveFileId: manifest.files.images[index] })),
  };
}
