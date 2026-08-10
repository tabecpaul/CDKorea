import { Resend } from "resend";

export type ConsultationEmailInput = {
  name: string;
  email: string;
  phone: string;
  timeSlot: string;
};

export type ConsultationEmailResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; errorCode: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char] ?? char);
}

function config() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() ?? from;
  if (!apiKey || !from || !replyTo) throw new Error("CONSULTATION_EMAIL_CONFIG_MISSING");
  const fromHeader = from.includes("<") ? from : `Career Direct Korea <${from}>`;
  return { resend: new Resend(apiKey), from: fromHeader, replyTo };
}

function shell(content: string) {
  return `<div style="margin:0;background:#f7f3ea;padding:32px 16px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#173b49"><div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;padding:32px"><p style="margin:0 0 16px;color:#278a96;font-size:12px;font-weight:700;letter-spacing:.12em">CAREER DIRECT KOREA</p>${content}</div></div>`;
}

async function send(input: { to: string; subject: string; html: string; replyTo?: string }): Promise<ConsultationEmailResult> {
  try {
    const { resend, from, replyTo } = config();
    const result = await resend.emails.send({ from, ...input, replyTo: input.replyTo ?? replyTo });
    if (!result.data?.id) return { ok: false, errorCode: "RESEND_EMAIL_ID_MISSING" };
    return { ok: true, providerMessageId: result.data.id };
  } catch (error) {
    const code = error instanceof Error && error.message === "CONSULTATION_EMAIL_CONFIG_MISSING"
      ? "CONSULTATION_EMAIL_CONFIG_MISSING"
      : error instanceof Error ? error.name.slice(0, 80) : "CONSULTATION_EMAIL_FAILED";
    return { ok: false, errorCode: code };
  }
}

export async function sendAdminConsultationEmail(input: ConsultationEmailInput) {
  const notificationEmail = process.env.CONSULTATION_NOTIFICATION_EMAIL?.trim() ?? "";
  if (!notificationEmail) {
    return { ok: false, errorCode: "CONSULTATION_EMAIL_CONFIG_MISSING" } as const;
  }
  return send({
    to: notificationEmail,
    replyTo: input.email,
    subject: `[신규 상담 신청] ${input.name}님`,
    html: shell(`<h1 style="font-size:24px;margin:0 0 20px">무료 진로 상담 신청</h1><p><strong>이름:</strong> ${escapeHtml(input.name)}</p><p><strong>이메일:</strong> ${escapeHtml(input.email)}</p><p><strong>전화:</strong> ${escapeHtml(input.phone)}</p><p><strong>희망 시간대:</strong> ${escapeHtml(input.timeSlot)}</p>`),
  });
}

export async function sendCustomerConsultationEmail(input: ConsultationEmailInput) {
  return send({
    to: input.email,
    subject: "무료 진로 상담 신청이 접수되었습니다",
    html: shell(`<h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(input.name)}님, 신청이 접수되었습니다.</h1><p style="line-height:1.7">남겨주신 연락처로 빠르게 연락드리겠습니다.</p><div style="margin:24px 0;padding:18px;border-radius:12px;background:#eaf5f5;line-height:1.7"><strong>희망 상담 시간대</strong><br>${escapeHtml(input.timeSlot)}</div>`),
  });
}
