import { validateMarketingPng, type ValidatedMarketingAsset } from "./assetValidation";
import { createMarketingDriveClient, readDriveText, type MarketingDriveClient } from "./drive";
import { parseContentPackageManifest, type ContentPackageManifest } from "./packageManifest";

export type PreparedMarketingPackage = {
  manifest: ContentPackageManifest;
  naverBody: string;
  metaCaption: string;
  threadsPosts: string[];
  assets: Array<ValidatedMarketingAsset & { driveFileId: string }>;
};

function validateCopy(value: string, kind: "naver" | "meta") {
  const trimmed = value.trim();
  const limit = kind === "naver" ? 30_000 : 5_000;
  if (!trimmed || trimmed.length > limit) throw new Error(`${kind.toUpperCase()}_COPY_INVALID`);
  return trimmed;
}

function parseThreads(value: string) {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("THREADS_COPY_INVALID"); }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 20 || parsed.some((item) => typeof item !== "string" || !item.trim() || item.length > 500)) throw new Error("THREADS_COPY_INVALID");
  return parsed.map((item) => (item as string).trim());
}

async function requireOperationsFile(client: MarketingDriveClient, fileId: string) {
  if (!(await client.isWithinOperationsFolder(fileId))) throw new Error("DRIVE_FILE_OUTSIDE_OPERATIONS_FOLDER");
}

export async function prepareMarketingPackage(manifestFileId: string, client: MarketingDriveClient = createMarketingDriveClient()): Promise<PreparedMarketingPackage> {
  await requireOperationsFile(client, manifestFileId);
  const manifest = parseContentPackageManifest(JSON.parse(await readDriveText(client, manifestFileId)) as unknown);
  const referenced = [manifest.driveFolderId, manifest.files.naver, manifest.files.meta, manifest.files.threads, ...manifest.files.images];
  await Promise.all(referenced.map((fileId) => requireOperationsFile(client, fileId)));
  const [naverBody, metaCaption, threadsRaw, ...imageBytes] = await Promise.all([
    readDriveText(client, manifest.files.naver), readDriveText(client, manifest.files.meta), readDriveText(client, manifest.files.threads),
    ...manifest.files.images.map((fileId) => client.download(fileId, 8 * 1024 * 1024)),
  ]);
  const imageMeta = await Promise.all(manifest.files.images.map((fileId) => client.metadata(fileId)));
  return {
    manifest, naverBody: validateCopy(naverBody as string, "naver"), metaCaption: validateCopy(metaCaption as string, "meta"), threadsPosts: parseThreads(threadsRaw as string),
    assets: imageBytes.map((bytes, index) => ({ ...validateMarketingPng(bytes as Uint8Array, imageMeta[index].name, imageMeta[index].mimeType), driveFileId: manifest.files.images[index] })),
  };
}
