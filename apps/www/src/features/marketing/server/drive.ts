import { createSign, randomUUID } from "node:crypto";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const MAX_TEXT_BYTES = 256 * 1024;

export type DriveFileMeta = { id: string; name: string; mimeType: string; size: number; parents: string[] };

export interface MarketingDriveClient {
  metadata(fileId: string): Promise<DriveFileMeta>;
  download(fileId: string, maxBytes: number): Promise<Uint8Array>;
  isWithinOperationsFolder(fileId: string): Promise<boolean>;
  createFolder(name: string, parentId: string): Promise<string>;
  upload(name: string, parentId: string, mimeType: string, bytes: Uint8Array): Promise<string>;
  listManifestFiles(): Promise<string[]>;
}

export class DriveError extends Error {
  constructor(public code: string) { super(code); }
}

function base64url(value: string | Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

function config() {
  const rootFolderId = process.env.GOOGLE_DRIVE_OPERATIONS_FOLDER_ID?.trim();
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!rootFolderId || !clientEmail || !privateKey) throw new DriveError("DRIVE_NOT_CONFIGURED");
  return { rootFolderId, clientEmail, privateKey };
}

let tokenCache: { value: string; expiresAt: number } | null = null;

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  const { clientEmail, privateKey } = config();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({ iss: clientEmail, scope: "https://www.googleapis.com/auth/drive", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const assertion = `${header}.${claim}.${base64url(signer.sign(privateKey))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new DriveError(response.status === 401 || response.status === 403 ? "DRIVE_AUTH_FAILED" : "DRIVE_TOKEN_FAILED");
  const body = await response.json() as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new DriveError("DRIVE_TOKEN_INVALID");
  tokenCache = { value: body.access_token, expiresAt: Date.now() + Math.min(body.expires_in ?? 3600, 3600) * 1000 };
  return tokenCache.value;
}

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, headers: { authorization: `Bearer ${await accessToken()}`, ...init.headers }, signal: init.signal ?? AbortSignal.timeout(15_000) });
  if (!response.ok) throw new DriveError(response.status === 404 ? "DRIVE_FILE_NOT_FOUND" : response.status === 401 || response.status === 403 ? "DRIVE_ACCESS_DENIED" : response.status === 429 || response.status >= 500 ? "DRIVE_RETRYABLE" : "DRIVE_REQUEST_FAILED");
  return response;
}

export function createMarketingDriveClient(): MarketingDriveClient {
  const { rootFolderId } = config();
  const metadata = async (fileId: string): Promise<DriveFileMeta> => {
    const response = await authorizedFetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,size,parents`);
    const value = await response.json() as { id: string; name: string; mimeType: string; size?: string; parents?: string[] };
    return { id: value.id, name: value.name, mimeType: value.mimeType, size: Number(value.size ?? 0), parents: value.parents ?? [] };
  };
  return {
    metadata,
    async download(fileId, maxBytes) {
      const meta = await metadata(fileId);
      if (meta.size > maxBytes) throw new DriveError("DRIVE_FILE_TOO_LARGE");
      const response = await authorizedFetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > maxBytes) throw new DriveError("DRIVE_FILE_TOO_LARGE");
      return bytes;
    },
    async isWithinOperationsFolder(fileId) {
      let pending = [fileId];
      const visited = new Set<string>();
      for (let depth = 0; depth < 12 && pending.length; depth += 1) {
        const next: string[] = [];
        for (const id of pending) {
          if (id === rootFolderId) return true;
          if (visited.has(id)) continue;
          visited.add(id);
          next.push(...(await metadata(id)).parents);
        }
        pending = next;
      }
      return false;
    },
    async createFolder(name, parentId) {
      const response = await authorizedFetch(`${DRIVE_API}/files?supportsAllDrives=true&fields=id`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }) });
      return ((await response.json()) as { id: string }).id;
    },
    async upload(name, parentId, mimeType, bytes) {
      const boundary = `cdk-${randomUUID()}`;
      const prefix = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [parentId] })}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
      const suffix = Buffer.from(`\r\n--${boundary}--`);
      const body = Buffer.concat([prefix, Buffer.from(bytes), suffix]);
      const response = await authorizedFetch(`${DRIVE_UPLOAD}/files?uploadType=multipart&supportsAllDrives=true&fields=id`, { method: "POST", headers: { "content-type": `multipart/related; boundary=${boundary}` }, body });
      return ((await response.json()) as { id: string }).id;
    },
    async listManifestFiles() {
      const ids: string[] = [];
      let pageToken: string | undefined;
      do {
        const params = new URLSearchParams({ q: "name = 'content-package.json' and trashed = false", fields: "nextPageToken,files(id)", pageSize: "100", spaces: "drive" });
        if (pageToken) params.set("pageToken", pageToken);
        const response = await authorizedFetch(`${DRIVE_API}/files?${params}`);
        const body = await response.json() as { nextPageToken?: string; files?: Array<{ id: string }> };
        ids.push(...(body.files ?? []).map((file) => file.id));
        pageToken = body.nextPageToken;
      } while (pageToken && ids.length < 500);
      const within = await Promise.all(ids.map(async (id) => ({ id, valid: await this.isWithinOperationsFolder(id) })));
      return within.filter((item) => item.valid).map((item) => item.id);
    },
  };
}

export async function readDriveText(client: MarketingDriveClient, fileId: string) {
  const meta = await client.metadata(fileId);
  if (!meta.mimeType.startsWith("text/") && meta.mimeType !== "application/json") throw new DriveError("DRIVE_TEXT_MIME_INVALID");
  return new TextDecoder("utf-8", { fatal: true }).decode(await client.download(fileId, MAX_TEXT_BYTES));
}
