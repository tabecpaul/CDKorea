"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApprovalActions({ contentId, enabled }: { contentId: number; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "revision" | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function submit(action: "approve" | "request_revision") {
    setBusy(action === "approve" ? "approve" : "revision");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/marketing/${contentId}/approval`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action === "approve" ? { action } : { action, note }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error ?? "approval_update_failed");
      setMessage(action === "approve" ? "현재 버전을 최종 승인했습니다." : "수정 요청을 기록했습니다.");
      if (action === "request_revision") setNote("");
      router.refresh();
    } catch (error) {
      setMessage(`처리하지 못했습니다: ${error instanceof Error ? error.message : "approval_update_failed"}`);
    } finally {
      setBusy(null);
    }
  }

  const disabled = !enabled || busy !== null;
  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
    <h2 className="text-xl font-black">검토 결정</h2>
    <p className="mt-2 text-sm leading-6 text-navy/55">승인은 자동 게시하지 않습니다. 네이버·Facebook·Instagram·Threads는 모두 수동 발행 상태로 유지됩니다.</p>
    <button type="button" disabled={disabled} onClick={() => submit("approve")} className="mt-5 w-full rounded-full bg-teal px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy === "approve" ? "승인 처리 중…" : "최종 승인"}</button>
    <label className="mt-6 block text-sm font-bold" htmlFor="revision-note">수정 요청 메모</label>
    <textarea id="revision-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} disabled={disabled} placeholder="수정할 내용을 구체적으로 적어 주세요." className="mt-2 min-h-28 w-full rounded-xl border border-navy/15 p-3 text-sm disabled:opacity-50" />
    <button type="button" disabled={disabled || !note.trim()} onClick={() => submit("request_revision")} className="mt-3 w-full rounded-full border border-navy/20 px-5 py-3 text-sm font-bold disabled:opacity-50">{busy === "revision" ? "기록 중…" : "수정 요청"}</button>
    {!enabled ? <p className="mt-3 text-xs text-navy/45">현재 버전은 검토 대기 상태가 아니므로 결정 버튼이 비활성화되어 있습니다.</p> : null}
    {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
  </section>;
}
