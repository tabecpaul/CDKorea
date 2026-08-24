"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AssetUploader({ contentId }: { contentId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    form.set("uploadId", crypto.randomUUID());
    try {
      const response = await fetch(`/api/admin/marketing/${contentId}/assets`, { method: "POST", body: form });
      const body = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error ?? "upload_failed");
      setMessage("새 검토 버전으로 저장했습니다.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) { setMessage(`저장하지 못했습니다: ${error instanceof Error ? error.message : "upload_failed"}`); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
    <h2 className="text-xl font-black">Canva 수정본 업로드</h2>
    <p className="mt-2 text-sm leading-6 text-navy/55">PNG 1080×1350을 카드 순서대로 4~8장 선택하세요. 기본은 5장이며 이전 버전은 보존됩니다.</p>
    <input type="file" name="cards" accept="image/png" multiple required className="mt-4 block w-full text-sm" />
    <textarea name="revisionNote" maxLength={500} placeholder="수정 메모(선택)" className="mt-4 min-h-24 w-full rounded-xl border border-navy/15 p-3 text-sm" />
    <button disabled={busy} className="mt-3 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "검증·저장 중…" : "수정본을 새 버전으로 저장"}</button>
    {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
  </form>;
}
