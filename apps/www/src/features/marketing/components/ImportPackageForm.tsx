"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImportPackageForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/marketing/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifestFileId: data.get("manifestFileId") }) });
      const body = await response.json() as { error?: string; duplicate?: boolean };
      if (!response.ok) throw new Error(body.error ?? "import_failed");
      setMessage(body.duplicate ? "이미 가져온 패키지입니다." : "검토 대기 콘텐츠로 가져왔습니다.");
      router.refresh();
    } catch (error) { setMessage(`가져오지 못했습니다: ${error instanceof Error ? error.message : "import_failed"}`); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-6 flex flex-col gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:flex-row sm:items-end">
    <label className="flex-1 text-sm font-bold">Drive manifest 파일 ID<input name="manifestFileId" required maxLength={160} className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 font-normal" /></label>
    <button disabled={busy} className="h-11 rounded-full bg-teal px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "가져오는 중…" : "Drive 패키지 가져오기"}</button>
    {message ? <p className="text-sm sm:max-w-xs" role="status">{message}</p> : null}
  </form>;
}
