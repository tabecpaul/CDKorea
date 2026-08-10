import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { analyticsEvents, db } from "@newland/db";

export const analyticsEventNames = [
  "landing_viewed",
  "official_page_viewed",
  "organization_inquiry_submitted",
  "lead_submitted",
  "pdf_downloaded",
  "assessment_cta_clicked",
  "callback_cta_clicked",
  "callback_submitted",
  "official_site_clicked",
  "consultation_submitted",
  "callback_schedule_confirmed",
  "callback_reschedule_requested",
  "callback_schedule_reconfirmed",
  "callback_reminder_sent",
  "payment_instruction_sent",
  "payment_confirmed",
  "assessment_link_issued",
  "assessment_registered",
  "assessment_completed",
  "consultation_completed",
  "payment_refunded",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type Attribution = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
};

const serverOnlyEventNames = new Set<AnalyticsEventName>([
  "callback_schedule_confirmed",
  "callback_reschedule_requested",
  "callback_schedule_reconfirmed",
  "callback_reminder_sent",
  "payment_instruction_sent",
  "payment_confirmed",
  "assessment_link_issued",
  "assessment_registered",
  "assessment_completed",
  "consultation_completed",
  "payment_refunded",
  "organization_inquiry_submitted",
]);

const EVENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VISITOR_ID = /^[0-9a-f-]{36}$/i;
const SENSITIVE_VALUE = /(?:[^\s@]+@[^\s@]+\.[^\s@]+)|(?:\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b)/i;

function limited(value: unknown, max: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > max || SENSITIVE_VALUE.test(value)) {
    throw new Error("ANALYTICS_FIELD_INVALID");
  }
  return value;
}

export function parsePublicEvent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("ANALYTICS_BODY_INVALID");
  const body = value as Record<string, unknown>;
  if (typeof body.eventId !== "string" || !EVENT_ID.test(body.eventId)) throw new Error("ANALYTICS_EVENT_ID_INVALID");
  if (typeof body.eventName !== "string" || !analyticsEventNames.includes(body.eventName as AnalyticsEventName)) {
    throw new Error("ANALYTICS_EVENT_NAME_INVALID");
  }
  if (serverOnlyEventNames.has(body.eventName as AnalyticsEventName)) throw new Error("ANALYTICS_EVENT_NAME_INVALID");
  const path = limited(body.path, 160);
  if (path && !path.startsWith("/")) throw new Error("ANALYTICS_PATH_INVALID");
  return {
    eventId: body.eventId,
    eventName: body.eventName as AnalyticsEventName,
    path,
    ctaLocation: limited(body.ctaLocation, 64),
    utmSource: limited(body.utmSource, 128),
    utmMedium: limited(body.utmMedium, 128),
    utmCampaign: limited(body.utmCampaign, 128),
    utmContent: limited(body.utmContent, 128),
  };
}

export function validVisitorId(value: string | undefined) {
  return value && VISITOR_ID.test(value) ? value : null;
}

export function visitorIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const shared = validVisitorId(cookieHeader.match(/(?:^|;\s*)cdk_vid_shared=([^;]+)/)?.[1]);
  return shared ?? validVisitorId(cookieHeader.match(/(?:^|;\s*)cdk_vid=([^;]+)/)?.[1]);
}

export async function firstAttribution(anonymousId: string | null): Promise<Attribution> {
  if (!anonymousId) return {};
  const event = await db.query.analyticsEvents.findFirst({
    where: and(eq(analyticsEvents.anonymousId, anonymousId), eq(analyticsEvents.eventName, "landing_viewed")),
    orderBy: [asc(analyticsEvents.occurredAt)],
    columns: { utmSource: true, utmMedium: true, utmCampaign: true, utmContent: true },
  });
  return event ?? {};
}

export async function recordAnalyticsEvent(input: {
  eventId?: string;
  eventName: AnalyticsEventName;
  anonymousId?: string | null;
  path?: string | null;
  ctaLocation?: string | null;
  utm?: Attribution;
  productCode?: string | null;
}) {
  const fallback = input.utm?.utmSource || input.utm?.utmMedium || input.utm?.utmCampaign || input.utm?.utmContent
    ? {} : await firstAttribution(input.anonymousId ?? null);
  await db.insert(analyticsEvents).values({
    eventId: input.eventId ?? randomUUID(),
    eventName: input.eventName,
    anonymousId: input.anonymousId ?? null,
    occurredAt: new Date(),
    path: input.path ?? null,
    ctaLocation: input.ctaLocation ?? null,
    utmSource: input.utm?.utmSource ?? fallback.utmSource ?? null,
    utmMedium: input.utm?.utmMedium ?? fallback.utmMedium ?? null,
    utmCampaign: input.utm?.utmCampaign ?? fallback.utmCampaign ?? null,
    utmContent: input.utm?.utmContent ?? fallback.utmContent ?? null,
    productCode: input.productCode ?? null,
  }).onConflictDoNothing();
}

export async function recordAnalyticsEventSafely(input: Parameters<typeof recordAnalyticsEvent>[0]) {
  try {
    await recordAnalyticsEvent(input);
  } catch (error) {
    console.error("Analytics event recording failed", {
      eventName: input.eventName,
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
    });
  }
}
