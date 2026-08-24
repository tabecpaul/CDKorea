import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { assessmentCallbackPayments, assessmentCallbackRequests, callbackPaymentAuditLogs, db } from "@newland/db";
import { auditValues } from "@/features/callback-payment/server/audit";
import { callbackStatuses, type CallbackStatus } from "../domain";
import { sendAdminCallbackEmail, sendCustomerCallbackEmail } from "./emails";

export const callbackOperationFilters = ["real", "test", "overdue", "email_failed", "evidence_needed", "refund_pending"] as const;
export type CallbackOperationFilter = (typeof callbackOperationFilters)[number];
export type CallbackPageCursor = { createdAt: string; id: number };
const CALLBACK_PAGE_SIZE = 30;

function parseCallbackCursor(value?: string): { createdAt: Date; id: number } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as CallbackPageCursor;
    const createdAt = new Date(parsed.createdAt);
    return Number.isSafeInteger(parsed.id) && parsed.id > 0 && !Number.isNaN(createdAt.getTime()) ? { createdAt, id: parsed.id } : null;
  } catch {
    return null;
  }
}

function encodeCallbackCursor(value: CallbackPageCursor) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export async function listCallbackRequests(status?: string, operation?: string, cursorValue?: string) {
  const safeStatus = callbackStatuses.includes(status as CallbackStatus) ? status : undefined;
  const safeOperation = callbackOperationFilters.includes(operation as CallbackOperationFilter) ? operation as CallbackOperationFilter : undefined;
  const cursor = parseCallbackCursor(cursorValue);
  const conditions = [];
  if (safeStatus) conditions.push(eq(assessmentCallbackRequests.status, safeStatus));
  if (cursor) conditions.push(or(
    lt(assessmentCallbackRequests.createdAt, cursor.createdAt),
    and(eq(assessmentCallbackRequests.createdAt, cursor.createdAt), lt(assessmentCallbackRequests.id, cursor.id)),
  ));
  if (safeOperation === "real") conditions.push(eq(assessmentCallbackRequests.isTest, false));
  if (safeOperation === "test") conditions.push(eq(assessmentCallbackRequests.isTest, true));
  if (safeOperation === "overdue") conditions.push(sql`exists (
    select 1 from assessment_callback_payments payment
    where payment.callback_request_id = ${assessmentCallbackRequests.id} and payment.is_active = true
      and payment.payment_status = 'awaiting_payment' and payment.payment_due_at < now()
  )`);
  if (safeOperation === "email_failed") conditions.push(sql`exists (
    select 1 from assessment_callback_payments payment
    where payment.callback_request_id = ${assessmentCallbackRequests.id} and payment.is_active = true
      and 'failed' in (payment.instruction_email_status, payment.confirmation_email_status, payment.refund_request_email_status, payment.refund_completed_email_status)
  )`);
  if (safeOperation === "evidence_needed") conditions.push(sql`exists (
    select 1 from assessment_callback_payments payment
    where payment.callback_request_id = ${assessmentCallbackRequests.id} and payment.is_active = true and payment.evidence_status = 'requested'
  )`);
  if (safeOperation === "refund_pending") conditions.push(sql`exists (
    select 1 from assessment_callback_payments payment
    where payment.callback_request_id = ${assessmentCallbackRequests.id} and payment.is_active = true and payment.payment_status = 'refund_pending'
  )`);
  const callbacks = await db.query.assessmentCallbackRequests.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(assessmentCallbackRequests.createdAt), desc(assessmentCallbackRequests.id)],
    limit: CALLBACK_PAGE_SIZE + 1,
  });
  const pageCallbacks = callbacks.slice(0, CALLBACK_PAGE_SIZE);
  const payments = pageCallbacks.length ? await db.query.assessmentCallbackPayments.findMany({
    where: and(inArray(assessmentCallbackPayments.callbackRequestId, pageCallbacks.map((item) => item.id)), eq(assessmentCallbackPayments.isActive, true)),
  }) : [];
  const byCallback = new Map(payments.map((payment) => [payment.callbackRequestId, payment]));
  const items = pageCallbacks.map((callback) => ({ ...callback, activePayment: byCallback.get(callback.id) ?? null }));
  const last = items.at(-1);
  return {
    items,
    nextCursor: callbacks.length > CALLBACK_PAGE_SIZE && last
      ? encodeCallbackCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
      : null,
  };
}

export async function getCallbackRequest(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return db.query.assessmentCallbackRequests.findFirst({
    where: eq(assessmentCallbackRequests.id, id),
  });
}

export async function updateCallbackRequest(id: number, input: { status: unknown; adminNote: unknown }) {
  const status = typeof input.status === "string" && callbackStatuses.includes(input.status as CallbackStatus)
    ? input.status as CallbackStatus
    : null;
  const adminNote = typeof input.adminNote === "string" ? input.adminNote.trim() : "";
  if (!status || adminNote.length > 2_000) throw new Error("CALLBACK_UPDATE_INVALID");
  const current = await getCallbackRequest(id);
  if (!current) return null;
  const now = new Date();
  const [updated] = await db.update(assessmentCallbackRequests).set({
    status,
    adminNote: adminNote || null,
    statusUpdatedAt: status === current.status ? current.statusUpdatedAt : now,
    updatedAt: now,
  }).where(eq(assessmentCallbackRequests.id, id)).returning();
  return updated;
}

export async function setCallbackTestStatus(id: number, input: { isTest: unknown; reason: unknown }) {
  if (typeof input.isTest !== "boolean") throw new Error("CALLBACK_UPDATE_INVALID");
  const isTest = input.isTest;
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!reason || reason.length > 500) throw new Error("CALLBACK_UPDATE_INVALID");
  return db.transaction(async (tx) => {
    const current = await tx.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, id) });
    if (!current) return null;
    if (current.isTest === isTest) return current;
    const [updated] = await tx.update(assessmentCallbackRequests).set({ isTest, updatedAt: new Date() }).where(eq(assessmentCallbackRequests.id, id)).returning();
    await tx.insert(callbackPaymentAuditLogs).values(auditValues({ callbackRequestId: id, action: "test_status_changed", previousStatus: current.isTest ? "test" : "real", nextStatus: isTest ? "test" : "real", reason }));
    return updated;
  });
}

export async function resendCallbackEmail(id: number, audience: "admin" | "customer") {
  const request = await getCallbackRequest(id);
  if (!request) return null;
  const input = {
    name: request.name,
    email: request.email,
    phone: request.phone,
    preferredDate: request.preferredDate,
    timeSlot: request.timeSlot,
    topics: request.topics,
  };
  const result = audience === "admin"
    ? await sendAdminCallbackEmail(id, input)
    : await sendCustomerCallbackEmail(input);
  const prefix = audience === "admin" ? "admin" : "customer";
  await db.update(assessmentCallbackRequests).set({
    [`${prefix}EmailStatus`]: result.ok ? "sent" : "failed",
    [`${prefix}EmailId`]: result.ok ? result.providerMessageId : null,
    [`${prefix}EmailError`]: result.ok ? null : result.errorCode,
    updatedAt: new Date(),
  }).where(eq(assessmentCallbackRequests.id, id));
  return result;
}
