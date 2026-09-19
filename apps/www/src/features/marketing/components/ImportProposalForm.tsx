"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImportProposalForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [contentId, setContentId] = useState<number | null>(null);
  const [manifestFileId, setManifestFileId] = useState("");
  async function preflight() {
    setBusy(true); setMessage(""); setContentId(null);
    try {
      const params = new URLSearchParams({ kind: "proposal", manifestFileId });
      const response = await fetch(`/api/admin/marketing/preflight?${params}`, { cache: "no-store" });
      const body = await response.json() as { error?: string; packageId?: string; proposedDate?: string; sourceFileCount?: number; schedules?: number; writes?: number };
      if (!response.ok || body.writes !== 0 || body.schedules !== 0) throw new Error(body.error ?? "preflight_failed");
      setMessage(`읽기 전용 점검 PASS · ${body.packageId} · 제안일 ${body.proposedDate} · 원본 파일 ${body.sourceFileCount}개 · 채널 일정/DB 변경 0건`);
    } catch (error) { setMessage(`읽기 전용 점검 실패: ${error instanceof Error ? error.message : "preflight_failed"}`); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setContentId(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/marketing/proposals/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifestFileId: data.get("manifestFileId") }) });
      const body = await response.json() as { error?: string; duplicate?: boolean; contentId?: number };
      if (!response.ok || !body.contentId) throw new Error(body.error ?? "proposal_import_failed");
      setContentId(body.contentId);
      setMessage(body.duplicate ? "이미 등록된 제안입니다. 기존 내용을 변경하지 않았습니다." : "미승인 제안으로 등록했습니다. 채널 일정은 생성되지 않았습니다.");
      router.refresh();
    } catch (error) { setMessage(`제안 등록 실패: ${error instanceof Error ? error.message : "proposal_import_failed"}`); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-3 flex flex-col gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:flex-row sm:items-end">
    <label className="flex-1 text-sm font-bold">제안 manifest 파일 ID<input name="manifestFileId" required maxLength={160} value={manifestFileId} onChange={(event) => setManifestFileId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 font-normal" /></label>
    <button type="button" onClick={preflight} disabled={busy || !manifestFileId} className="h-11 rounded-full border border-navy px-5 text-sm font-bold text-navy disabled:opacity-50">읽기 전용 점검</button>
    <button disabled={busy} className="h-11 rounded-full bg-navy px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "등록 중…" : "미승인 제안 등록"}</button>
    {message ? <p className="text-sm sm:max-w-xs" role="status">{message}{contentId ? <> <a className="font-bold underline" href={`/admin/marketing/${contentId}`}>상세 확인</a></> : null}</p> : null}
  </form>;
}
