import type { getMarketingSummary, QueryResult } from "../server/queries";

type Summary = Awaited<ReturnType<typeof getMarketingSummary>>;

export default function MarketingSummary({ result }: { result: QueryResult<Summary> }) {
  if (!result.data) return <CardError title="이번 주 운영 요약" message={result.error} />;
  const metrics = [
    ["검토 대기", result.data.reviewPending],
    ["수정 요청", result.data.revisionRequested],
    ["승인 완료", result.data.approved],
    ["이번 주 예약", result.data.scheduled],
    ["조치 필요", result.data.actionRequired],
    ["이번 주 발행", result.data.published],
  ] as const;
  return <section><h2 className="text-xl font-black">이번 주 운영 요약</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{metrics.map(([label, value]) => <article key={label} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-bold text-navy/55">{label}</p><strong className="mt-2 block text-3xl font-black">{value}</strong></article>)}</div></section>;
}

export function CardError({ title, message }: { title: string; message: string }) {
  return <section className="rounded-2xl border border-red-200 bg-red-50 p-5"><h2 className="font-black text-red-800">{title}</h2><p className="mt-2 text-sm text-red-700">{message}</p></section>;
}
