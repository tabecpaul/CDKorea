"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Schedule = { id: number; mode: string; status: string; scheduledAt: Date; utmUrl: string; publishedUrl: string | null; publishedAt: Date | null };

export default function NaverPublishingPanel({
  contentId,
  version,
  versionStatus,
  approvedSnapshotHash,
  category,
  ctaKind,
  naverBody,
  schedule,
}: {
  contentId: number;
  version: number | null;
  versionStatus: string | null;
  approvedSnapshotHash: string | null;
  category: string | null;
  ctaKind: string;
  naverBody: string | null;
  schedule: Schedule | null;
}) {
  const router = useRouter();
  const [ctaLinked, setCtaLinked] = useState(false);
  const [mobileChecked, setMobileChecked] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const completed = schedule?.status === "manual_published";
  const eligible = versionStatus === "approved" && Boolean(approvedSnapshotHash) && schedule?.mode === "manual" && Boolean(naverBody?.trim()) && Boolean(schedule?.utmUrl.trim());
  const canSubmit = eligible && !completed && ctaLinked && mobileChecked && publishedUrl.trim().length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/marketing/${contentId}/naver-complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publishedUrl, ctaLinked, mobileDestinationChecked: mobileChecked }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error ?? "naver_completion_failed");
      setMessage("네이버 수동 발행 완료를 기록했습니다.");
      router.refresh();
    } catch (error) {
      setMessage(`처리하지 못했습니다: ${error instanceof Error ? error.message : "naver_completion_failed"}`);
    } finally {
      setBusy(false);
    }
  }

  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
    <h2 className="text-xl font-black">네이버 수동 발행</h2>
    <p className="mt-2 text-sm leading-6 text-navy/55">네이버 편집기에서 직접 발행한 뒤 링크 연결과 모바일 목적지를 확인하고 완료를 기록합니다.</p>
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
      <Info label="승인 버전" value={version ? `v${version}` : "—"} />
      <Info label="상태" value={schedule?.status ?? "네이버 일정 없음"} />
      <Info label="예약 시각" value={schedule ? schedule.scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "—"} />
      <Info label="카테고리" value={category ?? "미지정"} />
      <Info label="CTA" value={ctaKind} />
      <Info label="CTA · UTM URL" value={schedule?.utmUrl ?? "미등록"} breakAll />
    </dl>

    <div className="mt-5"><h3 className="text-sm font-black text-navy/60">네이버 원고</h3><p className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-cream p-4 text-sm leading-6">{naverBody || "등록된 네이버 원고가 없습니다."}</p></div>
    {completed && schedule?.publishedUrl && schedule.publishedAt ? <div className="mt-6 rounded-xl bg-teal/[.07] p-4"><p className="font-bold text-teal">수동 발행 완료</p><a href={schedule.publishedUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-bold text-teal underline">게시물 열기 ↗</a><p className="mt-2 text-xs text-navy/50">{schedule.publishedAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p></div> : <>
      <div className="mt-6 space-y-3">
        <Check checked={ctaLinked} onChange={setCtaLinked}>CTA 문구에 링크를 직접 연결했습니다.</Check>
        <Check checked={mobileChecked} onChange={setMobileChecked}>모바일에서 신청 화면이 정상적으로 열리는지 확인했습니다.</Check>
      </div>
      <label htmlFor="naver-published-url" className="mt-5 block text-sm font-bold">네이버 게시 URL</label>
      <input id="naver-published-url" type="url" inputMode="url" value={publishedUrl} onChange={(event) => setPublishedUrl(event.target.value)} disabled={!eligible || busy} placeholder="https://blog.naver.com/..." className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm disabled:opacity-50" />
      <button type="button" disabled={!canSubmit} onClick={submit} className="mt-4 w-full rounded-full bg-teal px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "완료 기록 중…" : "수동 발행 완료"}</button>
      {!eligible ? <p className="mt-3 text-xs text-navy/45">최종 승인된 현재 버전의 수동 네이버 일정과 원고·UTM이 모두 있어야 완료할 수 있습니다.</p> : null}
    </>}
    {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
  </section>;
}

function Info({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return <div className="rounded-xl bg-cream p-3"><dt className="text-xs font-bold text-navy/50">{label}</dt><dd className={`mt-1 font-semibold ${breakAll ? "break-all" : ""}`}>{value}</dd></div>;
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return <label className="flex items-start gap-3 rounded-xl border border-navy/10 p-3 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-4 accent-teal" /><span>{children}</span></label>;
}
