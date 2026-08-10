import { randomUUID } from "node:crypto";
import { parsePublicEvent, recordAnalyticsEvent, validVisitorId } from "@/features/analytics/server/events";
import { OFFICIAL_SITE_URL, START_SITE_URL } from "@/features/site-routing/hosts";

const MAX_BODY_BYTES = 4_096;
const COOKIE = "cdk_vid";
const SHARED_COOKIE = "cdk_vid_shared";

export async function POST(request: Request) {
  const allowedOrigins = new Set([new URL(START_SITE_URL).origin, new URL(OFFICIAL_SITE_URL).origin]);
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin) && !/^https?:\/\/localhost(?::\d+)?$/.test(origin)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }
  let event: ReturnType<typeof parsePublicEvent>;
  try {
    event = parsePublicEvent(JSON.parse(text));
    if (!["landing_viewed", "official_page_viewed", "assessment_cta_clicked", "callback_cta_clicked", "official_site_clicked"].includes(event.eventName)) {
      throw new Error("ANALYTICS_PUBLIC_EVENT_FORBIDDEN");
    }
  } catch {
    return Response.json({ error: "invalid_event" }, { status: 400 });
  }
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const shared = cookieHeader.match(/(?:^|;\s*)cdk_vid_shared=([^;]+)/)?.[1];
    const legacy = cookieHeader.match(/(?:^|;\s*)cdk_vid=([^;]+)/)?.[1];
    const anonymousId = validVisitorId(shared) ?? validVisitorId(legacy) ?? randomUUID();
    await recordAnalyticsEvent({ ...event, anonymousId, utm: event });
    const response = Response.json({ ok: true });
    const host = new URL(request.url).hostname;
    const productionDomain = host === "careerdirect.kr" || host.endsWith(".careerdirect.kr");
    if (!validVisitorId(shared)) {
      response.headers.append("Set-Cookie", `${SHARED_COOKIE}=${anonymousId}; Max-Age=2592000; Path=/; HttpOnly; ${productionDomain ? "Secure; Domain=.careerdirect.kr; " : ""}SameSite=Lax`);
    }
    if (!validVisitorId(legacy)) {
      response.headers.append("Set-Cookie", `${COOKIE}=${anonymousId}; Max-Age=2592000; Path=/; HttpOnly; ${productionDomain ? "Secure; " : ""}SameSite=Lax`);
    }
    return response;
  } catch (error) {
    console.error("Public analytics event failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "event_unavailable" }, { status: 503 });
  }
}
