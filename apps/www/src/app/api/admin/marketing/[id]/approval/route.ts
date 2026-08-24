import { hasAdminSession } from "@/features/admin/server/auth";
import { parseMarketingApprovalRequest } from "@/features/marketing/approvalRequest";
import { approveMarketingContent, MarketingApprovalError, requestMarketingRevision } from "@/features/marketing/server/approval";

function errorStatus(error: MarketingApprovalError) {
  if (error.code === "CONTENT_NOT_FOUND" || error.code === "CONTENT_VERSION_NOT_FOUND") return 404;
  if (error.code === "CONTENT_STATE_CONFLICT") return 409;
  return 400;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const contentId = Number((await params).id);
  if (!Number.isSafeInteger(contentId) || contentId <= 0) return Response.json({ error: "content_id_invalid" }, { status: 400 });
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "approval_request_invalid" }, { status: 400 });
  }
  const body = parseMarketingApprovalRequest(rawBody);
  if (!body) return Response.json({ error: "approval_request_invalid" }, { status: 400 });
  try {
    if (body.action === "approve") return Response.json({ ok: true, ...(await approveMarketingContent(contentId, "admin")) });
    return Response.json({ ok: true, ...(await requestMarketingRevision(contentId, body.note, "admin")) });
  } catch (error) {
    if (error instanceof MarketingApprovalError) return Response.json({ error: error.code }, { status: errorStatus(error) });
    return Response.json({ error: "approval_update_failed" }, { status: 500 });
  }
}
