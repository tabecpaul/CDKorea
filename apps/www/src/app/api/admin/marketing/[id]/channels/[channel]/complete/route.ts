import { hasAdminSession } from "@/features/admin/server/auth";
import { isMarketingChannel, parseManualPublicationRequest } from "@/features/marketing/manualPublicationRequest";
import { completeManualPublication, ManualPublicationError } from "@/features/marketing/server/manualPublication";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; channel: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const values = await params;
  const contentId = Number(values.id);
  if (!Number.isSafeInteger(contentId) || contentId <= 0 || !isMarketingChannel(values.channel) || values.channel === "naver") return Response.json({ error: "channel_context_invalid" }, { status: 400 });
  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "manual_publication_request_invalid" }, { status: 400 }); }
  const body = parseManualPublicationRequest(rawBody, values.channel);
  if (!body) return Response.json({ error: "manual_publication_request_invalid" }, { status: 400 });
  try { return Response.json({ ok: true, ...(await completeManualPublication({ contentId, channel: values.channel, request: body })) }); }
  catch (error) {
    if (error instanceof ManualPublicationError) return Response.json({ error: error.code }, { status: error.code === "CONTENT_NOT_FOUND" || error.code === "CONTENT_VERSION_NOT_FOUND" || error.code === "CHANNEL_SCHEDULE_NOT_FOUND" ? 404 : 409 });
    return Response.json({ error: "manual_publication_failed" }, { status: 500 });
  }
}
