import type { ProposalPackageManifest } from "./proposalManifest";

export function buildProposalRows(manifest: ProposalPackageManifest, actor = "admin", manifestFileId?: string) {
  return {
    content: {
      slug: manifest.content.slug,
      title: manifest.content.title,
      campaignKey: "",
      ctaKind: "",
      naverCategory: null,
    },
    version: {
      version: 1,
      status: "proposal" as const,
      naverBody: null,
      metaCaption: null,
      threadsPosts: null,
      sourcePackageId: manifest.packageId,
      driveFolderId: manifest.driveFolderId,
      createdBy: actor,
      revisionNote: "Historical recovery: unapproved proposal",
    },
    audit: {
      actor,
      action: "historical_proposal_imported" as const,
      details: {
        packageId: manifest.packageId,
        proposedDate: manifest.content.proposedDate,
        dateMeaning: "proposal",
        sourceFolderId: manifest.driveFolderId,
        sourceFileIds: manifest.recovery.sourceFileIds.join(","),
        recoveryKind: manifest.recovery.kind,
        ...(manifestFileId ? { manifestFileId } : {}),
      },
    },
  };
}
