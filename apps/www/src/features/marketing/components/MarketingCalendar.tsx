import Link from "next/link";
import type { getMarketingCalendar, MarketingCalendarView, QueryResult } from "../server/queries";
import { CardError } from "./MarketingSummary";

type CalendarData = Awaited<ReturnType<typeof getMarketingCalendar>>;
const channelLabels: Record<string, string> = { naver: "네이버", facebook: "Facebook", instagram: "Instagram", threads: "Threads" };

function formatKst(value: Date) {
  return value.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export default function MarketingCalendar({ result, view }: { result: QueryResult<CalendarData>; view: MarketingCalendarView }) {
  if (!result.data) return <CardError title="콘텐츠 캘린더" message={result.error} />;
  const rangeLabel = `${result.data.start.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} – ${new Date(result.data.end.getTime() - 1).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}`;
  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">콘텐츠 캘린더</h2><p className="mt-1 text-xs text-navy/50">KST · {rangeLabel}</p></div><nav className="flex gap-2" aria-label="캘린더 범위"><Link href="/admin/marketing?view=week" className={`rounded-full px-3 py-2 text-xs font-bold ${view === "week" ? "bg-navy text-white" : "bg-cream"}`}>주간</Link><Link href="/admin/marketing?view=month" className={`rounded-full px-3 py-2 text-xs font-bold ${view === "month" ? "bg-navy text-white" : "bg-cream"}`}>월간</Link></nav></div>
    <div className="mt-5 space-y-3">{result.data.items.length ? result.data.items.map((item) => <Link key={item.id} href={`/admin/marketing/${item.contentId}`} className="grid gap-2 rounded-xl border border-navy/10 p-4 transition-colors hover:border-teal/40 sm:grid-cols-[150px_1fr_auto]"><time className="text-sm font-bold">{formatKst(item.scheduledAt)}</time><span className="min-w-0 truncate text-sm font-black">{item.title}</span><span className="text-xs text-navy/55">{channelLabels[item.channel] ?? item.channel} · {item.mode === "manual" ? "수동" : "자동"} · {item.status}</span></Link>) : <p className="py-8 text-center text-sm text-navy/45">선택한 기간에 등록된 발행 일정이 없습니다.</p>}</div>
  </section>;
}
