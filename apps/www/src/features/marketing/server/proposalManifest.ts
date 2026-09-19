import { createHash } from "node:crypto";
import { parseRecoveryProvenance, type RecoveryProvenance } from "./recoveryProvenance";

const DRIVE_ID = /^[A-Za-z0-9_-]{10,160}$/;
const SLUG = /^[a-z0-9][a-z0-9-]{1,158}[a-z0-9]$/;

export type ProposalPackageManifest = {
  schemaVersion: 1;
  kind: "proposal";
  packageId: string;
  driveFolderId: string;
  content: { slug: string; title: string; proposedDate: string };
  recovery: RecoveryProvenance;
};

function record(value: unknown, allowed: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}_INVALID`);
  const parsed = value as Record<string, unknown>;
  if (Object.keys(parsed).some((key) => !allowed.includes(key))) throw new Error(`${label}_UNKNOWN_FIELD`);
  return parsed;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function proposalSlug(proposedDate: string, title: string) {
  const digest = createHash("sha256").update(`${proposedDate}\n${title.normalize("NFC")}`, "utf8").digest("hex").slice(0, 16);
  return `proposal-${digest}`;
}

export function parseProposalPackageManifest(value: unknown): ProposalPackageManifest {
  const root = record(value, ["schemaVersion", "kind", "packageId", "driveFolderId", "content", "recovery"], "PROPOSAL");
  const content = record(root.content, ["slug", "title", "proposedDate"], "PROPOSAL_CONTENT");
  if (root.schemaVersion !== 1 || root.kind !== "proposal") throw new Error("PROPOSAL_SCHEMA_INVALID");
  if (typeof root.driveFolderId !== "string" || !DRIVE_ID.test(root.driveFolderId)) throw new Error("PROPOSAL_FOLDER_INVALID");
  if (typeof content.slug !== "string" || !SLUG.test(content.slug)) throw new Error("PROPOSAL_SLUG_INVALID");
  if (typeof content.title !== "string" || !content.title.trim() || content.title.length > 240) throw new Error("PROPOSAL_TITLE_INVALID");
  if (!validDate(content.proposedDate)) throw new Error("PROPOSAL_DATE_INVALID");
  if (content.slug !== proposalSlug(content.proposedDate, content.title.trim())) throw new Error("PROPOSAL_SLUG_NOT_DETERMINISTIC");
  if (root.packageId !== `${content.proposedDate}-${content.slug}` || typeof root.packageId !== "string" || root.packageId.length > 180) throw new Error("PROPOSAL_PACKAGE_ID_INVALID");
  return {
    schemaVersion: 1,
    kind: "proposal",
    packageId: root.packageId,
    driveFolderId: root.driveFolderId,
    content: { slug: content.slug, title: content.title.trim(), proposedDate: content.proposedDate },
    recovery: parseRecoveryProvenance(root.recovery, "proposal"),
  };
}
