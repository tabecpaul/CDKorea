import { sql } from "drizzle-orm";
import { db } from "@newland/db";
import { unstable_cache } from "next/cache";

export type DashboardPeriod = 7 | 30 | 90;

export function parsePeriod(value: string | undefined): DashboardPeriod {
  return value === "7" || value === "90" ? Number(value) as DashboardPeriod : 30;
}

function kstStart(days: DashboardPeriod) {
  const kstNow = new Date(Date.now() + 9 * 3_600_000);
  return new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() - days + 1) - 9 * 3_600_000);
}

type FunnelRow = {
  visitors: number;
  leads: number;
  downloads: number;
  ctaClicks: number;
  consultations: number;
  callbackClicks: number;
  callbacks: number;
};
type EmailRow = { sent: number; delivered: number; bounced: number; complained: number; unsubscribed: number };
export type UtmRow = FunnelRow & { utmSource: string; utmMedium: string; utmCampaign: string; utmContent: string };
type CallbackOperationsRow = { newRequests: number; callbackCompleted: number };
type PaymentOperationsRow = { paymentSent: number; paid: number; registered: number; assessmentCompleted: number; consultationCompleted: number; refunded: number; grossRevenue: number; refundedAmount: number };
export type ProductPaymentRow = { productCode: string; productName: string; paymentSent: number; paid: number; consultationCompleted: number; grossRevenue: number; refundedAmount: number };

function numeric<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value])) as T;
}

async function queryAnalyticsDashboard(period: DashboardPeriod) {
  const start = kstStart(period);
  // Raw postgres.js queries do not serialize Date instances in every runtime.
  // Pass an ISO string and cast it explicitly so Vercel and local builds behave alike.
  const startIso = start.toISOString();
  const [funnelResult, emailResult, unsubscribedResult, utmResult, callbackOperationsResult, paymentOperationsResult, productPaymentsResult] = await Promise.all([
    db.execute(sql`
      select
        count(distinct anonymous_id) filter (where event_name = 'landing_viewed')::int as visitors,
        count(*) filter (where event_name = 'lead_submitted')::int as leads,
        count(*) filter (where event_name = 'pdf_downloaded')::int as downloads,
        count(*) filter (where event_name = 'assessment_cta_clicked')::int as "ctaClicks",
        count(*) filter (where event_name = 'consultation_submitted')::int as consultations,
        count(*) filter (where event_name = 'callback_cta_clicked')::int as "callbackClicks",
        (select count(*)::int from assessment_callback_requests callback where callback.created_at >= ${startIso}::timestamptz and callback.is_test = false) as callbacks
      from analytics_events ae
      where occurred_at >= ${startIso}::timestamptz
        and not exists (
          select 1 from assessment_callback_requests test_request
          where test_request.is_test = true
            and test_request.anonymous_id is not null
            and test_request.anonymous_id = ae.anonymous_id
        )
    `),
    db.execute(sql`
      select
        count(*) filter (where sent_at >= ${startIso}::timestamptz)::int as sent,
        count(*) filter (where delivered_at >= ${startIso}::timestamptz)::int as delivered,
        count(*) filter (where bounced_at >= ${startIso}::timestamptz)::int as bounced,
        count(*) filter (where complained_at >= ${startIso}::timestamptz)::int as complained
      from lead_magnet_email_jobs
    `),
    db.execute(sql`select count(*)::int as unsubscribed from lead_magnet_leads where marketing_unsubscribed_at >= ${startIso}::timestamptz`),
    db.execute(sql`
      select
        coalesce(nullif(utm_source, ''), '(direct)') as "utmSource",
        coalesce(nullif(utm_medium, ''), '(none)') as "utmMedium",
        coalesce(nullif(utm_campaign, ''), '(none)') as "utmCampaign",
        coalesce(nullif(utm_content, ''), '(none)') as "utmContent",
        count(distinct anonymous_id) filter (where event_name = 'landing_viewed')::int as visitors,
        count(*) filter (where event_name = 'lead_submitted')::int as leads,
        count(*) filter (where event_name = 'pdf_downloaded')::int as downloads,
        count(*) filter (where event_name = 'assessment_cta_clicked')::int as "ctaClicks",
        count(*) filter (where event_name = 'consultation_submitted')::int as consultations,
        count(*) filter (where event_name = 'callback_cta_clicked')::int as "callbackClicks",
        count(*) filter (where event_name = 'callback_submitted')::int as callbacks
      from analytics_events ae
      where occurred_at >= ${startIso}::timestamptz
        and not exists (
          select 1 from assessment_callback_requests test_request
          where test_request.is_test = true
            and test_request.anonymous_id is not null
            and test_request.anonymous_id = ae.anonymous_id
        )
      group by 1, 2, 3, 4
      order by leads desc, visitors desc
      limit 50
    `),
    db.execute(sql`
      select
        count(*) filter (where status = 'new')::int as "newRequests",
        count(*) filter (where status = 'callback_completed')::int as "callbackCompleted"
      from assessment_callback_requests
      where created_at >= ${startIso}::timestamptz and is_test = false
    `),
    db.execute(sql`
      select
        count(*) filter (where instruction_sent_at >= ${startIso}::timestamptz)::int as "paymentSent",
        count(*) filter (where paid_at >= ${startIso}::timestamptz)::int as paid,
        count(*) filter (where assessment_registered_at >= ${startIso}::timestamptz)::int as registered,
        count(*) filter (where assessment_completed_at >= ${startIso}::timestamptz)::int as "assessmentCompleted",
        count(*) filter (where consultation_completed_at >= ${startIso}::timestamptz)::int as "consultationCompleted",
        count(*) filter (where refund_completed_at >= ${startIso}::timestamptz)::int as refunded,
        coalesce(sum(total_amount) filter (where paid_at >= ${startIso}::timestamptz), 0)::int as "grossRevenue",
        coalesce(sum(refund_final_amount) filter (where refund_completed_at >= ${startIso}::timestamptz), 0)::int as "refundedAmount"
      from assessment_callback_payments payment
      join assessment_callback_requests callback on callback.id = payment.callback_request_id
      where callback.is_test = false
    `),
    db.execute(sql`
      select product_code as "productCode", product_name as "productName",
        count(*) filter (where instruction_sent_at >= ${startIso}::timestamptz)::int as "paymentSent",
        count(*) filter (where paid_at >= ${startIso}::timestamptz)::int as paid,
        count(*) filter (where consultation_completed_at >= ${startIso}::timestamptz)::int as "consultationCompleted",
        coalesce(sum(total_amount) filter (where paid_at >= ${startIso}::timestamptz), 0)::int as "grossRevenue",
        coalesce(sum(refund_final_amount) filter (where refund_completed_at >= ${startIso}::timestamptz), 0)::int as "refundedAmount"
      from assessment_callback_payments payment
      join assessment_callback_requests callback on callback.id = payment.callback_request_id
      where callback.is_test = false
      group by product_code, product_name order by paid desc
    `),
  ]);
  const funnel = numeric((funnelResult[0] ?? {}) as FunnelRow);
  const rawEmail = numeric((emailResult[0] ?? {}) as Omit<EmailRow, "unsubscribed">);
  const unsubscribed = Number((unsubscribedResult[0] as { unsubscribed?: number } | undefined)?.unsubscribed ?? 0);
  const callbackOperations = numeric((callbackOperationsResult[0] ?? {}) as CallbackOperationsRow);
  const paymentOperations = numeric((paymentOperationsResult[0] ?? {}) as PaymentOperationsRow);
  return {
    start,
    funnel: { visitors: funnel.visitors ?? 0, leads: funnel.leads ?? 0, downloads: funnel.downloads ?? 0, ctaClicks: funnel.ctaClicks ?? 0, consultations: funnel.consultations ?? 0, callbackClicks: funnel.callbackClicks ?? 0, callbacks: funnel.callbacks ?? 0 },
    email: { sent: rawEmail.sent ?? 0, delivered: rawEmail.delivered ?? 0, bounced: rawEmail.bounced ?? 0, complained: rawEmail.complained ?? 0, unsubscribed },
    callbackOperations: {
      newRequests: callbackOperations.newRequests ?? 0,
      callbackCompleted: callbackOperations.callbackCompleted ?? 0,
    },
    paymentOperations: {
      paymentSent: paymentOperations.paymentSent ?? 0, paid: paymentOperations.paid ?? 0,
      registered: paymentOperations.registered ?? 0, assessmentCompleted: paymentOperations.assessmentCompleted ?? 0,
      consultationCompleted: paymentOperations.consultationCompleted ?? 0, refunded: paymentOperations.refunded ?? 0,
      grossRevenue: paymentOperations.grossRevenue ?? 0, refundedAmount: paymentOperations.refundedAmount ?? 0,
    },
    productPayments: productPaymentsResult.map((row) => numeric(row as ProductPaymentRow)),
    utm: utmResult.map((row) => numeric(row as UtmRow)),
  };
}

export const getAnalyticsDashboard = unstable_cache(
  queryAnalyticsDashboard,
  ["admin-analytics-dashboard"],
  { revalidate: 30, tags: ["admin-analytics-dashboard"] },
);
