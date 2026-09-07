"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MarketingChannel } from "../domain";

const labels: Record<Exclude<MarketingChannel, "naver">, string> = { facebook: "Facebook", instagram: "Instagram", threads: "Threads" };

function kstLocalValue() {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

export default function ManualPublicationPanel({ contentId, channel, versionStatus, approvedSnapshotHash, schedule }: { contentId: number; channel: Exclude<MarketingChannel, "naver">; versionStatus: string | null; approvedSnapshotHash: string | null; schedule: { status: string; mode: string; publishedUrl: string | null; publishedAt: Date | null } | null }) {
  const router = useRouter();
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState(kstLocalValue);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const completed = schedule?.status === "manual_published";
  const eligible = versionStatus === "approved" && Boolean(approvedSnapshotHash) && schedule?.mode === "manual";
  const canSubmit = eligible && !completed && Boolean(publishedUrl.trim()) && Boolean(publishedAt) && !busy;
  async function submit() {
    if (!canSubmit) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/marketing/${contentId}/channels/${channel}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ publishedUrl, publishedAt: `${publishedAt}:00+09:00` }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "manual_publication_failed");
      setMessage(`${labels[channel]} 수동 발행 결과를 기록했습니다.`); router.refresh();
    } catch (error) { setMessage(`기록하지 못했습니다: ${error instanceof Error ? error.message : "manual_publication_failed"}`); }
    finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><h2 className="text-xl font-black">{labels[channel]} 수동 발행</h2><p className="mt-2 text-sm leading-6 text-navy/55">외부 채널에 직접 게시한 뒤 실제 게시 URL과 실제 게시시각만 기록합니다. 자동 게시하지 않습니다.</p>{completed && schedule?.publishedUrl && schedule.publishedAt ? <div className="mt-5 rounded-xl bg-teal/[.07] p-4"><a href={schedule.publishedUrl} target="_blank" rel="noreferrer" className="break-all font-bold text-teal underline">게시물 열기 ↗</a><p className="mt-2 text-xs text-navy/55">{schedule.publishedAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p></div> : <><label className="mt-5 block text-sm font-bold">실제 게시 URL<input type="url" value={publishedUrl} onChange={(event) => setPublishedUrl(event.target.value)} disabled={!eligible || busy} placeholder={`https://…/${channel}`} className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 font-normal disabled:opacity-50" /></label><label className="mt-4 block text-sm font-bold">실제 게시 시각 (KST)<input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} disabled={!eligible || busy} className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 font-normal disabled:opacity-50" /></label><button type="button" onClick={submit} disabled={!canSubmit} className="mt-4 w-full rounded-full bg-teal px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "기록 중…" : "수동 발행 완료 기록"}</button>{!eligible ? <p className="mt-3 text-xs text-navy/45">최종 승인된 현재 버전의 수동 채널 일정이 있어야 기록할 수 있습니다.</p> : null}</>}{message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}</section>;
}
