import { Resend } from "resend";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
export async function sendOrganizationNotification(input: { organizationName: string; contactName: string; email: string; phone: string; organizationType: string; programInterests: string[]; estimatedParticipants: number | null; message: string | null }) {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim(); const from = process.env.RESEND_FROM_EMAIL?.trim(); const to = process.env.ORGANIZATION_NOTIFICATION_EMAIL?.trim() || process.env.CALLBACK_NOTIFICATION_EMAIL?.trim();
    if (!apiKey || !from || !to) throw new Error("ORGANIZATION_EMAIL_CONFIG_MISSING");
    const result = await new Resend(apiKey).emails.send({ from: from.includes("<") ? from : `Career Direct Korea <${from}>`, replyTo: input.email, to, subject: `[기관 문의] ${input.organizationName}`, html: `<div style="font-family:Arial,sans-serif;line-height:1.7"><h1>기관 프로그램 문의</h1><p><b>기관:</b> ${escapeHtml(input.organizationName)}</p><p><b>담당자:</b> ${escapeHtml(input.contactName)}</p><p><b>연락처:</b> ${escapeHtml(input.phone)} · ${escapeHtml(input.email)}</p><p><b>유형:</b> ${escapeHtml(input.organizationType)}</p><p><b>관심 프로그램:</b> ${escapeHtml(input.programInterests.join(", "))}</p><p><b>예상 인원:</b> ${input.estimatedParticipants ?? "미정"}</p><p><b>문의:</b><br>${escapeHtml(input.message ?? "없음")}</p></div>` });
    return result.data?.id ? { ok: true as const, id: result.data.id } : { ok: false as const, error: "RESEND_EMAIL_ID_MISSING" };
  } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message.slice(0, 80) : "ORGANIZATION_EMAIL_FAILED" }; }
}
