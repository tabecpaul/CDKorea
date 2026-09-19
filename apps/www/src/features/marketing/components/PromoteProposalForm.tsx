"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PromoteProposalForm() {
  const router = useRouter();
  const [manifestFileId, setManifestFileId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function preflight() {
    setBusy(true); setMessage("");
    try {
      const params = new URLSearchParams({ kind: "proposal_review", manifestFileId });
      const response = await fetch(`/api/admin/marketing/preflight?${params}`, { cache: "no-store" });
      const body = await response.json() as { error?: string; packageId?: string; assetCount?: number; siteCopy?: boolean; schedules?: number; writes?: number };
      if (!response.ok || body.writes !== 0 || body.schedules !== 0 || !body.siteCopy) throw new Error(body.error ?? "preflight_failed");
      setMessage(`읽기 전용 점검 PASS · ${body.packageId} · 사이트 원문 포함 · 카드 ${body.assetCount}장 · 일정/DB 변경 0건`);
    } catch (error) { setMessage(`읽기 전용 점검 실패: ${error instanceof Error ? error.message : "preflight_failed"}`); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/marketing/proposals/promote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifestFileId }) });
      const body = await response.json() as { error?: string; duplicate?: boolean };
      if (!response.ok) throw new Error(body.error ?? "proposal_promotion_failed");
      setMessage(body.duplicate ? "이미 제작본으로 승격된 패키지입니다." : "제작본을 같은 콘텐츠의 새 검토 버전으로 등록했습니다. 일정·승인·게시 상태는 생성하지 않았습니다.");
      router.refresh();
    } catch (error) { setMessage(`승격 실패: ${error instanceof Error ? error.message : "proposal_promotion_failed"}`); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="rounded-2xl border border-teal/20 bg-white p-5 sm:p-6">
    <h2 className="text-xl font-black">제작본 검토 전환</h2>
    <p className="mt-2 text-sm leading-6 text-navy/55">완성된 사이트 원문과 파생 문안·카드를 같은 콘텐츠의 새 검토 버전으로 등록합니다. 자동 승인·일정·게시는 실행하지 않습니다.</p>
    <label className="mt-5 block text-sm font-bold">Review manifest 파일 ID<input required maxLength={160} value={manifestFileId} onChange={(event) => setManifestFileId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 font-normal" /></label>
    <div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" onClick={preflight} disabled={busy || !manifestFileId} className="rounded-full border border-teal px-5 py-3 text-sm font-bold text-teal disabled:opacity-50">읽기 전용 점검</button><button disabled={busy} className="rounded-full bg-teal px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "처리 중…" : "제작본을 검토 대기로 전환"}</button></div>
    {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
  </form>;
}
