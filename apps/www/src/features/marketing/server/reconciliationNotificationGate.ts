type ReadbackSnapshot = {
  imported: readonly unknown[];
  missing: readonly unknown[];
  rejectedManifests: number;
};

export function canSendReconciliationReviewEmail(snapshot: ReadbackSnapshot) {
  return snapshot.imported.length > 0 && snapshot.missing.length === 0 && snapshot.rejectedManifests === 0;
}
