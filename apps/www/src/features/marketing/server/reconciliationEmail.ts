import { Resend } from "resend";
import type { ReconciliationEntry, ReconciliationResult } from "./reconciliation";

type EmailSnapshot = ReconciliationResult & { rejectedManifests: number };
export type ReconciliationEmailResult = { ok: true; providerMessageId: string } | { ok: false; errorCode: string };

const reasonLabels = {
  PACKAGE_MISSING: "패키지 미생성",
  IMPORT_FAILED: "임포트 미완료 또는 실패",
  IDENTIFIER_MISMATCH: "캠페인·식별자·일정 불일치",
  SOURCE_UNCONFIRMED: "출처·패키지 미확인",
} as const;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
}

function rows(items: ReconciliationEntry[], showReason = false) {
  if (!items.length) return `<p style="color:#708086">해당 항목 없음</p>`;
  return `<ul style="padding-left:20px;line-height:1.7">${items.map((item) => `<li><b>${escapeHtml(item.title)}</b> <span style="color:#708086">(${escapeHtml(item.campaignKey)})</span>${showReason && item.reason ? ` — ${escapeHtml(reasonLabels[item.reason])}` : ""}${item.note ? `<br><span style="color:#708086">${escapeHtml(item.note)}</span>` : ""}</li>`).join("")}</ul>`;
}

export function buildReconciliationEmail(snapshot: EmailSnapshot, siteUrl: string) {
  const missingCount = snapshot.missing.length;
  const subject = `[Career Direct Korea] ${snapshot.weekStart} 주간 콘텐츠 점검 · 조치 ${missingCount}건`;
  const rejected = snapshot.rejectedManifests > 0 ? `<p style="padding:12px;background:#fff3cd;border-radius:10px">검증되지 않은 manifest ${snapshot.rejectedManifests}건이 있습니다. Drive 패키지를 확인해 주세요.</p>` : "";
  const html = `<div style="margin:0;background:#f7f3ea;padding:32px 16px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#173b49"><div style="max-width:680px;margin:auto;background:#fff;border-radius:20px;padding:32px"><p style="color:#278a96;font-size:12px;font-weight:700;letter-spacing:.12em">CAREER DIRECT KOREA</p><h1 style="font-size:24px">${escapeHtml(snapshot.weekStart)} 주간 콘텐츠 점검</h1>${rejected}<h2 style="font-size:17px;margin-top:28px">임포트 완료 ${snapshot.imported.length}건</h2>${rows(snapshot.imported)}<h2 style="font-size:17px;margin-top:28px">준비·임포트 누락 ${missingCount}건</h2>${rows(snapshot.missing, true)}<h2 style="font-size:17px;margin-top:28px">발행 완료·보류 ${snapshot.completedOrHeld.length}건</h2>${rows(snapshot.completedOrHeld)}<p style="margin-top:28px"><a href="${escapeHtml(siteUrl)}/admin/marketing" style="display:inline-block;background:#173b49;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px">마케팅 대시보드 열기</a></p><p style="margin-top:24px;font-size:12px;color:#708086">네이버 발행 시 편집기에서 CTA 링크를 직접 연결하고 모바일에서 목적지가 열리는지 확인하세요. 이 점검은 콘텐츠를 자동 게시하지 않습니다.</p></div></div>`;
  return { subject, html };
}

export async function sendReconciliationEmail(snapshot: EmailSnapshot): Promise<ReconciliationEmailResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromValue = process.env.RESEND_FROM_EMAIL?.trim();
    const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() || fromValue;
    const to = process.env.CALLBACK_NOTIFICATION_EMAIL?.trim();
    if (!apiKey || !fromValue || !replyTo || !to) return { ok: false, errorCode: "RECONCILIATION_EMAIL_CONFIG_MISSING" };
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr").replace(/\/$/, "");
    const message = buildReconciliationEmail(snapshot, siteUrl);
    const from = fromValue.includes("<") ? fromValue : `Career Direct Korea <${fromValue}>`;
    const result = await new Resend(apiKey).emails.send({ from, replyTo, to, subject: message.subject, html: message.html }, { idempotencyKey: `marketing-reconciliation-${snapshot.weekStart}` });
    return result.data?.id ? { ok: true, providerMessageId: result.data.id } : { ok: false, errorCode: "RESEND_EMAIL_ID_MISSING" };
  } catch (error) {
    return { ok: false, errorCode: error instanceof Error ? (error.name || error.message).slice(0, 80) : "RECONCILIATION_EMAIL_FAILED" };
  }
}
