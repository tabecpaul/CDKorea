export type RecoveryProvenance = {
  kind: "historical_recovery";
  sourceStatus: "proposal" | "produced_unpublished";
  sourceFileIds: string[];
};

const driveId = /^[A-Za-z0-9_-]{10,160}$/;

export function parseRecoveryProvenance(value: unknown, expectedStatus: RecoveryProvenance["sourceStatus"]): RecoveryProvenance {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("RECOVERY_INVALID");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !["kind", "sourceStatus", "sourceFileIds"].includes(key))) throw new Error("RECOVERY_UNKNOWN_FIELD");
  if (record.kind !== "historical_recovery" || record.sourceStatus !== expectedStatus) throw new Error("RECOVERY_INVALID");
  if (!Array.isArray(record.sourceFileIds) || record.sourceFileIds.length < 1 || record.sourceFileIds.length > 20 || record.sourceFileIds.some((id) => typeof id !== "string" || !driveId.test(id)) || new Set(record.sourceFileIds).size !== record.sourceFileIds.length) throw new Error("RECOVERY_SOURCE_IDS_INVALID");
  return { kind: "historical_recovery", sourceStatus: expectedStatus, sourceFileIds: [...record.sourceFileIds] };
}
