import Link from "next/link";
import { marketingContentStatuses, type MarketingContentStatus } from "../domain";
import type { listMarketingContents, QueryResult } from "../server/queries";
import { CardError } from "./MarketingSummary";

type ContentPage = Awaited<ReturnType<typeof listMarketingContents>>;
const statusLabels: Record<MarketingContentStatus, string> = { proposal: "제안", producing: "제작 중", review_pending: "검토 대기", revision_requested: "수정 요청", approved: "승인 완료", scheduled: "예약됨", published: "발행 완료" };

export default function ContentList({ result, status }: { result: QueryResult<ContentPage>; status?: string }) {
  if (!result.data) return <CardError title="콘텐츠 목록" message={result.error} />;
  const queryHref = (nextStatus?: string, cursor?: string) => {
    const params = new URLSearchParams({ ...(nextStatus ? { status: nextStatus } : {}), ...(cursor ? { cursor } : {}) });
    return params.size ? `/admin/marketing?${params}` : "/admin/marketing";
  };
  return <section>
    <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-xl font-black">콘텐츠 목록</h2><p className="text-xs text-navy/45">페이지당 최대 30건</p></div>
    <nav className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="콘텐츠 상태"><Link href={queryHref()} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${!status ? "bg-navy text-white" : "bg-white"}`}>전체</Link>{marketingContentStatuses.map((item) => <Link key={item} href={queryHref(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${status === item ? "bg-navy text-white" : "bg-white"}`}>{statusLabels[item]}</Link>)}</nav>
    <div className="mt-3 overflow-hidden rounded-2xl border border-navy/10 bg-white"><div className="divide-y divide-navy/8">{result.data.items.length ? result.data.items.map((item) => <Link key={item.id} href={`/admin/marketing/${item.id}`} className="grid gap-2 p-5 transition-colors hover:bg-teal/[.04] sm:grid-cols-[1fr_140px_130px]"><div className="min-w-0"><p className="truncate font-black">{item.title}</p><p className="mt-1 truncate text-xs text-navy/45">{item.campaignKey} · CTA {item.ctaKind}</p></div><span className="text-sm font-bold text-teal">{item.status && statusLabels[item.status as MarketingContentStatus] ? statusLabels[item.status as MarketingContentStatus] : "버전 미등록"}{item.version ? ` · v${item.version}` : ""}</span><time className="text-xs text-navy/45 sm:text-right">{item.updatedAt.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</time></Link>) : <p className="px-5 py-12 text-center text-sm text-navy/45">조건에 맞는 콘텐츠가 없습니다.</p>}</div></div>
    {result.data.nextCursor ? <nav className="mt-4 flex justify-end"><Link href={queryHref(status, result.data.nextCursor)} className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white">다음 30건 →</Link></nav> : null}
  </section>;
}
