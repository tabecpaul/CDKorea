"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CanonicalReadbackStatus, DuplicateGateStatus, SiteFirstStatus } from "../domain";

const duplicateLabels: Record<DuplicateGateStatus, string> = { UNKNOWN: "UNKNOWN", PASS: "PASS", REVISE: "REVISE", BLOCKED: "BLOCKED" };
const siteFirstLabels: Record<SiteFirstStatus, string> = { UNKNOWN: "UNKNOWN", NOT_PUBLISHED: "NOT_PUBLISHED", PUBLISHED: "PUBLISHED", FAILED: "FAILED" };
const readbackLabels: Record<CanonicalReadbackStatus, string> = { UNKNOWN: "UNKNOWN", PASS: "PASS", FAILED: "FAILED" };

export default function GateControlPanel({
  contentId, duplicateGate, siteFirstStatus, canonicalUrl, expectedArticleIdentity, canonicalReadbackStatus, readbacks,
}: {
  contentId: number;
  duplicateGate: DuplicateGateStatus;
  siteFirstStatus: SiteFirstStatus;
  canonicalUrl: string | null;
  expectedArticleIdentity: string | null;
  canonicalReadbackStatus: CanonicalReadbackStatus;
  readbacks: Array<{ id: number; canonicalUrl: string; httpStatus: number | null; expectedArticleIdentity: string; observedTitle: string | null; observedIdentity: string | null; result: string; checkedAt: Date }>;
}) {
  const router = useRouter();
  const [duplicate, setDuplicate] = useState<DuplicateGateStatus>(duplicateGate);
  const [siteFirst, setSiteFirst] = useState<SiteFirstStatus>(siteFirstStatus);
  const [url, setUrl] = useState(canonicalUrl ?? "");
  const [identity, setIdentity] = useState(expectedArticleIdentity ?? "");
  const [busy, setBusy] = useState<"save" | "readback" | null>(null);
  const [message, setMessage] = useState("");
  const configured = Boolean(url.trim() && identity.trim());

  async function call(endpoint: string, body: Record<string, string>) {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json() as { error?: string; result?: string; httpStatus?: number | null };
    if (!response.ok) throw new Error(result.error ?? "gate_update_failed");
    return result;
  }

  async function save() {
    setBusy("save"); setMessage("");
    try {
      await call(`/api/admin/marketing/${contentId}/gates`, { duplicateGate: duplicate, siteFirstStatus: siteFirst, canonicalUrl: url.trim(), expectedArticleIdentity: identity.trim() });
      setMessage("Gate 상태를 기록했습니다."); router.refresh();
    } catch (error) { setMessage(`기록하지 못했습니다: ${error instanceof Error ? error.message : "gate_update_failed"}`); }
    finally { setBusy(null); }
  }

  async function readback() {
    if (!configured) return;
    setBusy("readback"); setMessage("");
    try {
      const result = await call(`/api/admin/marketing/${contentId}/canonical-readback`, { canonicalUrl: url.trim(), expectedArticleIdentity: identity.trim() });
      setMessage(`Production read-back 결과: ${result.result ?? "FAILED"} · HTTP ${result.httpStatus ?? "연결 실패"}`); router.refresh();
    } catch (error) { setMessage(`검증하지 못했습니다: ${error instanceof Error ? error.message : "canonical_readback_failed"}`); }
    finally { setBusy(null); }
  }

  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">운영 Gate · Production 증거</h2><p className="mt-2 text-sm text-navy/55">Drive STATUS, 이메일, 예정 시각은 Gate 증거로 사용하지 않습니다.</p></div><span className="rounded-full bg-navy/[.06] px-3 py-1 text-xs font-black">Read-back {readbackLabels[canonicalReadbackStatus]}</span></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Duplicate Gate<select value={duplicate} onChange={(event) => setDuplicate(event.target.value as DuplicateGateStatus)} className="mt-2 h-11 w-full rounded-xl border border-navy/15 bg-white px-3 font-normal">{Object.entries(duplicateLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-bold">Site-First<select value={siteFirst} onChange={(event) => setSiteFirst(event.target.value as SiteFirstStatus)} className="mt-2 h-11 w-full rounded-xl border border-navy/15 bg-white px-3 font-normal">{Object.entries(siteFirstLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-bold sm:col-span-2">Canonical article URL<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.careerdirect.kr/..." className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 font-normal" /></label><label className="text-sm font-bold sm:col-span-2">Expected article identity<input value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="게시 글 제목 또는 식별 문구" className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 font-normal" /></label></div>
    <p className="mt-3 text-xs text-navy/45">허용 대상은 `careerdirect.kr` 및 `www.careerdirect.kr` Production article뿐입니다. `start.careerdirect.kr`는 CTA 서비스이므로 PASS 증거가 될 수 없습니다.</p>
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={save} disabled={busy !== null} className="rounded-full border border-teal px-4 py-2 text-sm font-bold text-teal disabled:opacity-50">{busy === "save" ? "기록 중…" : "Gate 기록"}</button><button type="button" onClick={readback} disabled={!configured || busy !== null} className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === "readback" ? "검증 중…" : "Production read-back"}</button></div>
    {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
    <div className="mt-6 space-y-3"><h3 className="text-sm font-black text-navy/60">Read-back evidence</h3>{readbacks.length ? readbacks.map((readback) => <article key={readback.id} className="rounded-xl bg-cream p-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{readback.result}</strong><span>HTTP {readback.httpStatus ?? "연결 실패"}</span></div><p className="mt-2 break-all text-xs text-navy/55">{readback.canonicalUrl}</p><p className="mt-2">기대: {readback.expectedArticleIdentity}</p><p className="mt-1 text-navy/55">관측 제목: {readback.observedTitle ?? "—"}</p><p className="mt-1 text-navy/55">검사: {readback.checkedAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p></article>) : <p className="text-sm text-navy/45">기록된 Production read-back 증거가 없습니다.</p>}</div>
  </section>;
}
