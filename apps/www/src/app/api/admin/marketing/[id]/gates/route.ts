import { hasAdminSession } from "@/features/admin/server/auth";
import { parseMarketingGateRequest } from "@/features/marketing/gateRequest";
import { MarketingGateError, updateMarketingGates } from "@/features/marketing/server/gates";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const contentId = Number((await params).id);
  if (!Number.isSafeInteger(contentId) || contentId <= 0) return Response.json({ error: "content_id_invalid" }, { status: 400 });
  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "gate_request_invalid" }, { status: 400 }); }
  const body = parseMarketingGateRequest(rawBody);
  if (!body) return Response.json({ error: "gate_request_invalid" }, { status: 400 });
  try { return Response.json({ ok: true, ...(await updateMarketingGates(contentId, body)) }); }
  catch (error) {
    if (error instanceof MarketingGateError) return Response.json({ error: error.code }, { status: error.code === "CONTENT_NOT_FOUND" || error.code === "CONTENT_VERSION_NOT_FOUND" ? 404 : 400 });
    return Response.json({ error: "gate_update_failed" }, { status: 500 });
  }
}
