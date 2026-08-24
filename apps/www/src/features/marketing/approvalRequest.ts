export type MarketingApprovalRequest = { action: "approve" } | { action: "request_revision"; note: string };

export function parseMarketingApprovalRequest(value: unknown): MarketingApprovalRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body).sort();
  if (body.action === "approve" && keys.length === 1 && keys[0] === "action") return { action: "approve" };
  if (body.action === "request_revision" && typeof body.note === "string" && keys.length === 2 && keys[0] === "action" && keys[1] === "note") return { action: "request_revision", note: body.note };
  return null;
}
