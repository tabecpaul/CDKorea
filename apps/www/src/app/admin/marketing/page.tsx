import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import MarketingSummary from "@/features/marketing/components/MarketingSummary";
import MarketingCalendar from "@/features/marketing/components/MarketingCalendar";
import ContentList from "@/features/marketing/components/ContentList";
import ChannelStatus from "@/features/marketing/components/ChannelStatus";
import { getMarketingCalendar, getMarketingSummary, listMarketingConnections, listMarketingContents, safely, type MarketingCalendarView } from "@/features/marketing/server/queries";

export const metadata: Metadata = { title: "콘텐츠 운영 | Career Direct Korea", robots: { index: false, follow: false } };

function SectionFallback({ label }: { label: string }) {
  return <section className="animate-pulse rounded-2xl border border-navy/10 bg-white p-6" aria-label={`${label} 불러오는 중`} aria-busy="true"><div className="h-5 w-36 rounded bg-navy/10" /><div className="mt-5 h-28 rounded-xl bg-navy/[.05]" /></section>;
}

async function SummarySection() { return <MarketingSummary result={await safely(getMarketingSummary)} />; }
async function CalendarSection({ view, anchor }: { view: MarketingCalendarView; anchor?: string }) { return <MarketingCalendar view={view} result={await safely(() => getMarketingCalendar(view, anchor))} />; }
async function ListSection({ status, cursor }: { status?: string; cursor?: string }) { return <ContentList status={status} result={await safely(() => listMarketingContents(status, cursor))} />; }
async function ConnectionSection() { return <ChannelStatus result={await safely(listMarketingConnections)} />; }

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ view?: string; anchor?: string; status?: string; cursor?: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const query = await searchParams;
  const view: MarketingCalendarView = query.view === "month" ? "month" : "week";
  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14"><div className="mx-auto max-w-7xl">
    <header><p className="text-xs font-black tracking-[.16em] text-teal">CAREER DIRECT KOREA</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">콘텐츠 운영</h1><p className="mt-2 text-sm text-navy/55">관리자 검토와 수동 발행을 위한 통합 현황 · 자동 발행 비활성</p></header>
    <div className="mt-8 space-y-8">
      <Suspense fallback={<SectionFallback label="이번 주 운영 요약" />}><SummarySection /></Suspense>
      <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]"><Suspense fallback={<SectionFallback label="콘텐츠 캘린더" />}><CalendarSection view={view} anchor={query.anchor} /></Suspense><Suspense fallback={<SectionFallback label="채널 연결 상태" />}><ConnectionSection /></Suspense></div>
      <Suspense fallback={<SectionFallback label="콘텐츠 목록" />}><ListSection status={query.status} cursor={query.cursor} /></Suspense>
    </div>
  </div></main>;
}
