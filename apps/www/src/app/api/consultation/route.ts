import { consultationRequests, db } from "@newland/db";
import { recordAnalyticsEventSafely, visitorIdFromRequest } from "@/features/analytics/server/events";
import { sendAdminConsultationEmail, sendCustomerConsultationEmail } from "@/features/consultation/server/emails";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, timeSlot, marketingAgreed, privacyAgreed } =
    body;

  if (!name || !email || !phone || !timeSlot || !privacyAgreed) {
    return Response.json(
      { error: "필수 항목을 모두 입력해주세요." },
      { status: 400 },
    );
  }

  await db.insert(consultationRequests).values({
    name,
    email,
    phone,
    timeSlot,
    marketingAgreed: Boolean(marketingAgreed),
  });

  await recordAnalyticsEventSafely({
    eventName: "consultation_submitted",
    anonymousId: visitorIdFromRequest(request),
    path: "/#contact",
  });

  const [adminResult, customerResult] = await Promise.all([
    sendAdminConsultationEmail({ name, email, phone, timeSlot }),
    sendCustomerConsultationEmail({ name, email, phone, timeSlot }),
  ]);
  if (!adminResult.ok) {
    console.error("Consultation admin email failed", { errorCode: adminResult.errorCode });
  }
  if (!customerResult.ok) {
    console.error("Consultation customer email failed", { errorCode: customerResult.errorCode });
  }

  return Response.json({ ok: true }, { status: 201 });
}
