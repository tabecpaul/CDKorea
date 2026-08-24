import { hasAdminSession } from "@/features/admin/server/auth";
import { parseNaverCompletionRequest } from "@/features/marketing/naverCompletionRequest";
import { completeNaverPublication, NaverCompletionError } from "@/features/marketing/server/naverCompletion";

function errorStatus(error: NaverCompletionError) {
  if (error.code === "CONTENT_NOT_FOUND" || error.code === "CONTENT_VERSION_NOT_FOUND" || error.code === "NAVER_SCHEDULE_NOT_FOUND") return 404;
  if (error.code === "NAVER_COPY_MISSING") return 400;
  return 409;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const contentId = Number((await params).id);
  if (!Number.isSafeInteger(contentId) || contentId <= 0) return Response.json({ error: "content_id_invalid" }, { status: 400 });
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "naver_completion_request_invalid" }, { status: 400 });
  }
  const body = parseNaverCompletionRequest(rawBody);
  if (!body) return Response.json({ error: "naver_completion_request_invalid" }, { status: 400 });
  try {
    return Response.json({ ok: true, ...(await completeNaverPublication(contentId, body, "admin")) });
  } catch (error) {
    if (error instanceof NaverCompletionError) return Response.json({ error: error.code }, { status: errorStatus(error) });
    return Response.json({ error: "naver_completion_failed" }, { status: 500 });
  }
}
