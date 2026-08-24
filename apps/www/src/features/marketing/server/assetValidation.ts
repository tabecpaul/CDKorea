import { createHash } from "node:crypto";

export const MAX_MARKETING_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_MARKETING_UPLOAD_BYTES = 48 * 1024 * 1024;

export type ValidatedMarketingAsset = { filename: string; mimeType: "image/png"; byteSize: number; sha256: string; width: 1080; height: 1350; bytes: Uint8Array };

export class AssetValidationError extends Error {
  constructor(public code: string, public filename: string) { super(`${code}:${filename}`); }
}

export function validateMarketingPng(bytes: Uint8Array, filename: string, declaredMime = "image/png"): ValidatedMarketingAsset {
  if (declaredMime !== "image/png") throw new AssetValidationError("PNG_MIME_REQUIRED", filename);
  if (!bytes.length || bytes.length > MAX_MARKETING_IMAGE_BYTES) throw new AssetValidationError("IMAGE_SIZE_INVALID", filename);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) throw new AssetValidationError("PNG_SIGNATURE_INVALID", filename);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16); const height = view.getUint32(20);
  if (width !== 1080 || height !== 1350) throw new AssetValidationError("IMAGE_DIMENSIONS_INVALID", filename);
  return { filename, mimeType: "image/png", byteSize: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), width, height, bytes };
}

export function validateAssetCount(count: number) {
  if (!Number.isSafeInteger(count) || count < 4 || count > 8) throw new AssetValidationError("IMAGE_COUNT", "images");
}
