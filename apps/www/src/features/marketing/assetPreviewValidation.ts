import { createHash, timingSafeEqual } from "node:crypto";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export type AssetPreviewErrorCode = "ASSET_NOT_FOUND" | "ASSET_INTEGRITY_MISMATCH" | "DRIVE_PREVIEW_UNAVAILABLE";

export class AssetPreviewError extends Error {
  constructor(public code: AssetPreviewErrorCode) { super(code); }
}

export type PreviewAssetRecord = {
  id: number;
  driveFileId: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
};

export function verifyAssetPreviewBytes(asset: PreviewAssetRecord, driveMeta: { id: string; mimeType: string; size: number }, bytes: Uint8Array, maxBytes: number) {
  if (asset.mimeType !== "image/png" || driveMeta.mimeType !== "image/png" || driveMeta.id !== asset.driveFileId) throw new AssetPreviewError("ASSET_INTEGRITY_MISMATCH");
  if (asset.byteSize <= 0 || asset.byteSize > maxBytes || driveMeta.size !== asset.byteSize || bytes.byteLength !== asset.byteSize) throw new AssetPreviewError("ASSET_INTEGRITY_MISMATCH");
  if (bytes.byteLength < PNG_SIGNATURE.byteLength || !timingSafeEqual(Buffer.from(bytes.subarray(0, PNG_SIGNATURE.byteLength)), PNG_SIGNATURE)) throw new AssetPreviewError("ASSET_INTEGRITY_MISMATCH");
  if (!/^[0-9a-f]{64}$/.test(asset.sha256)) throw new AssetPreviewError("ASSET_INTEGRITY_MISMATCH");
  const actualHash = createHash("sha256").update(bytes).digest();
  if (!timingSafeEqual(actualHash, Buffer.from(asset.sha256, "hex"))) throw new AssetPreviewError("ASSET_INTEGRITY_MISMATCH");
  return { bytes, mimeType: "image/png" as const };
}
