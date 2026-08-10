import { eq } from "drizzle-orm";
import { db, organizationInquiries } from "@newland/db";
import { recordAnalyticsEventSafely, visitorIdFromRequest } from "@/features/analytics/server/events";
import { OFFICIAL_SITE_URL } from "@/features/site-routing/hosts";
import { sendOrganizationNotification } from "@/features/organization-inquiry/server/email";
import { parseOrganizationInquiry } from "@/features/organization-inquiry/server/validation";

export async function POST(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const previewAllowed = process.env.VERCEL_ENV !== "production" && /^https:\/\/[-a-z0-9]+\.vercel\.app$/.test(origin);
  if (origin !== new URL(OFFICIAL_SITE_URL).origin && !origin.startsWith("http://localhost:") && !previewAllowed) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const text = await request.text(); if (Buffer.byteLength(text) > 12_000) return Response.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  try {
    const input = parseOrganizationInquiry(JSON.parse(text)); const anonymousId = visitorIdFromRequest(request);
    const [created] = await db.insert(organizationInquiries).values({ ...input, anonymousId, consentVersion: "organization-inquiry-v1" }).returning({ id: organizationInquiries.id });
    const notification = await sendOrganizationNotification(input);
    await db.update(organizationInquiries).set({ notificationEmailStatus: notification.ok ? "sent" : "failed", notificationEmailId: notification.ok ? notification.id : null, notificationEmailError: notification.ok ? null : notification.error, updatedAt: new Date() }).where(eq(organizationInquiries.id, created.id));
    await recordAnalyticsEventSafely({ eventName: "organization_inquiry_submitted", anonymousId, path: "/organizations", ctaLocation: "organization_form", utm: input });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) { console.error("Organization inquiry failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" }); return Response.json({ ok: false, error: "submission_unavailable" }, { status: 503 }); }
}
