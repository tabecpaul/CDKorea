import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import { getAnalyticsDashboard, parsePeriod } from "@/features/analytics/server/dashboard";

export const metadata: Metadata = { title: "전환 분석 | Career Direct Korea", robots: { index: false, follow: false } };

function percent(value: number, base: number) {
  return base > 0 ? `${((value / base) * 100).toFixed(1)}%` : "0%";
}

function won(value: number) { return `${value.toLocaleString("ko-KR")}원`; }

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const period = parsePeriod((await searchParams).period);
  const data = await getAnalyticsDashboard(period);
  const steps = [
    ["고유 방문자", data.funnel.visitors, null],
    ["PDF 신청", data.funnel.leads, data.funnel.visitors],
    ["PDF 다운로드", data.funnel.downloads, data.funnel.leads],
    ["콜백 CTA 클릭", data.funnel.callbackClicks, data.funnel.downloads],
    ["콜백 신청", data.funnel.callbacks, data.funnel.callbackClicks],
  ] as const;
  const email = [
    ["발송", data.email.sent], ["전달", data.email.delivered], ["반송", data.email.bounced],
    ["불만", data.email.complained], ["수신 거부", data.email.unsubscribed],
  ] as const;
  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black tracking-[.16em] text-teal">CAREER DIRECT KOREA</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">전환 분석</h1><p className="mt-2 text-sm text-navy/55">{data.start.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} 이후 집계 · 개인정보 미표시 · 연결된 테스트 데이터 제외</p></div>
        </header>
        <nav className="mt-8 flex gap-2" aria-label="조회 기간">
          {[7, 30, 90].map((days) => <Link key={days} href={`/admin/analytics?period=${days}`} className={`rounded-full px-4 py-2 text-sm font-bold ${period === days ? "bg-navy text-white" : "border border-navy/10 bg-white text-navy"}`}>최근 {days}일</Link>)}
        </nav>

        <section className="mt-10"><h2 className="text-xl font-black">핵심 퍼널</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{steps.map(([label, value, base]) => <article key={label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-sm font-bold text-navy/55">{label}</p><strong className="mt-3 block text-3xl font-black">{value.toLocaleString()}</strong><p className="mt-2 text-xs font-bold text-teal">{base == null ? "기간 내 고유 방문" : `이전 단계의 ${percent(value, base)}`}</p></article>)}</div></section>

        <section className="mt-10"><h2 className="text-xl font-black">이메일 상태</h2><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">{email.map(([label, value]) => <article key={label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-sm font-bold text-navy/55">{label}</p><strong className="mt-2 block text-2xl font-black">{value.toLocaleString()}</strong>{label !== "발송" && label !== "수신 거부" ? <p className="mt-2 text-xs text-navy/50">발송의 {percent(value, data.email.sent)}</p> : null}</article>)}</div></section>

        <section className="mt-10"><h2 className="text-xl font-black">콜백·결제 운영</h2><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">{[["신규/미처리", data.callbackOperations.newRequests], ["콜백 완료", data.callbackOperations.callbackCompleted], ["입금 안내", data.paymentOperations.paymentSent], ["결제 완료", data.paymentOperations.paid], ["본부 등록", data.paymentOperations.registered], ["평가 완료", data.paymentOperations.assessmentCompleted], ["컨설팅 완료", data.paymentOperations.consultationCompleted], ["환불", data.paymentOperations.refunded]].map(([label, value]) => <article key={label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-sm font-bold text-navy/55">{label}</p><strong className="mt-2 block text-2xl font-black">{value.toLocaleString()}</strong></article>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-sm font-bold text-navy/55">결제 확인 총액</p><strong className="mt-2 block text-2xl font-black">{won(data.paymentOperations.grossRevenue)}</strong></article><article className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-sm font-bold text-navy/55">환불 완료액</p><strong className="mt-2 block text-2xl font-black">{won(data.paymentOperations.refundedAmount)}</strong></article><article className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-sm font-bold text-navy/55">단순 순액</p><strong className="mt-2 block text-2xl font-black">{won(data.paymentOperations.grossRevenue - data.paymentOperations.refundedAmount)}</strong></article></div><p className="mt-3 text-xs text-navy/45">선택 기간의 결제·환불 처리 시각을 기준으로 집계합니다. 과거 평가 링크 클릭 {data.funnel.ctaClicks}건은 별도 보존됩니다.</p></section>

        <section className="mt-10"><h2 className="text-xl font-black">상품별 성과</h2><div className="mt-4 overflow-x-auto rounded-2xl border border-navy/10 bg-white"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-navy/[.04] text-xs text-navy/55"><tr>{["상품", "입금 안내", "결제", "컨설팅 완료", "결제액", "환불액", "안내→결제"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{data.productPayments.length ? data.productPayments.map((row) => <tr key={row.productCode} className="border-t border-navy/8"><td className="px-4 py-3 font-bold">{row.productName}</td><td className="px-4 py-3">{row.paymentSent}</td><td className="px-4 py-3">{row.paid}</td><td className="px-4 py-3">{row.consultationCompleted}</td><td className="px-4 py-3">{won(row.grossRevenue)}</td><td className="px-4 py-3">{won(row.refundedAmount)}</td><td className="px-4 py-3 font-bold text-teal">{percent(row.paid, row.paymentSent)}</td></tr>) : <tr><td colSpan={7} className="px-4 py-10 text-center text-navy/45">결제 데이터가 없습니다.</td></tr>}</tbody></table></div></section>

        <section className="mt-10"><h2 className="text-xl font-black">유입 성과</h2><div className="mt-4 overflow-x-auto rounded-2xl border border-navy/10 bg-white"><table className="min-w-[1040px] w-full text-left text-sm"><thead className="bg-navy/[.04] text-xs text-navy/55"><tr>{["소스", "매체", "캠페인", "소재", "방문", "PDF 신청", "다운로드", "콜백 CTA", "콜백 신청", "CTA→신청"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody>{data.utm.length ? data.utm.map((row) => <tr key={`${row.utmSource}:${row.utmMedium}:${row.utmCampaign}:${row.utmContent}`} className="border-t border-navy/8"><td className="px-4 py-3 font-semibold">{row.utmSource}</td><td className="px-4 py-3">{row.utmMedium}</td><td className="max-w-52 truncate px-4 py-3">{row.utmCampaign}</td><td className="max-w-52 truncate px-4 py-3" title={row.utmContent}>{row.utmContent}</td><td className="px-4 py-3">{row.visitors}</td><td className="px-4 py-3">{row.leads}</td><td className="px-4 py-3">{row.downloads}</td><td className="px-4 py-3">{row.callbackClicks}</td><td className="px-4 py-3">{row.callbacks}</td><td className="px-4 py-3 font-bold text-teal">{percent(row.callbacks, row.callbackClicks)}</td></tr>) : <tr><td colSpan={10} className="px-4 py-10 text-center text-navy/45">선택한 기간에 수집된 이벤트가 없습니다.</td></tr>}</tbody></table></div></section>
      </div>
    </main>
  );
}
