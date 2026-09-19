const PACKAGE_ID = /^[a-z0-9][a-z0-9._-]{2,179}$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{10,160}$/;
const allowedCtas = ["callback", "callback-20m", "career-check"] as const;

export type ProposalReviewManifest = {
  schemaVersion: 1;
  kind: "proposal_review";
  packageId: string;
  proposalPackageId: string;
  driveFolderId: string;
  content: { title: string; ctaKind: (typeof allowedCtas)[number] };
  files: { site: string; naver: string; meta: string; threads: string; images: string[] };
};

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`EXPECTED_OBJECT:${path}`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`UNKNOWN_FIELD:${path}.${key}`);
}

function string(value: unknown, path: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`INVALID_STRING:${path}`);
  return value.trim();
}

function packageId(value: unknown, path: string) {
  const parsed = string(value, path, 180);
  if (!PACKAGE_ID.test(parsed)) throw new Error(`INVALID_PACKAGE_ID:${path}`);
  return parsed;
}

function driveId(value: unknown, path: string) {
  const parsed = string(value, path, 160);
  if (!DRIVE_ID.test(parsed)) throw new Error(`INVALID_DRIVE_ID:${path}`);
  return parsed;
}

export function parseProposalReviewManifest(input: unknown): ProposalReviewManifest {
  const root = record(input, "$proposalReview");
  exactKeys(root, ["schemaVersion", "kind", "packageId", "proposalPackageId", "driveFolderId", "content", "files"], "$proposalReview");
  if (root.schemaVersion !== 1 || root.kind !== "proposal_review") throw new Error("REVIEW_SCHEMA_INVALID");
  const parsedPackageId = packageId(root.packageId, "$proposalReview.packageId");
  const proposalPackageId = packageId(root.proposalPackageId, "$proposalReview.proposalPackageId");
  if (parsedPackageId === proposalPackageId || parsedPackageId !== proposalPackageId.replace("-proposal-", "-review-")) throw new Error("REVIEW_PACKAGE_ID_INVALID");

  const content = record(root.content, "$proposalReview.content");
  exactKeys(content, ["title", "ctaKind"], "$proposalReview.content");
  const ctaKind = string(content.ctaKind, "$proposalReview.content.ctaKind", 40);
  if (!allowedCtas.includes(ctaKind as never)) throw new Error("REVIEW_CTA_INVALID");

  const files = record(root.files, "$proposalReview.files");
  exactKeys(files, ["site", "naver", "meta", "threads", "images"], "$proposalReview.files");
  if (!Array.isArray(files.images) || files.images.length < 4 || files.images.length > 8) throw new Error("IMAGE_COUNT");
  const images = files.images.map((value, index) => driveId(value, `$proposalReview.files.images[${index}]`));
  if (new Set(images).size !== images.length) throw new Error("DUPLICATE_IMAGE");

  return {
    schemaVersion: 1,
    kind: "proposal_review",
    packageId: parsedPackageId,
    proposalPackageId,
    driveFolderId: driveId(root.driveFolderId, "$proposalReview.driveFolderId"),
    content: { title: string(content.title, "$proposalReview.content.title", 240), ctaKind: ctaKind as ProposalReviewManifest["content"]["ctaKind"] },
    files: {
      site: driveId(files.site, "$proposalReview.files.site"),
      naver: driveId(files.naver, "$proposalReview.files.naver"),
      meta: driveId(files.meta, "$proposalReview.files.meta"),
      threads: driveId(files.threads, "$proposalReview.files.threads"),
      images,
    },
  };
}
