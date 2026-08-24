import type { MarketingChannel } from "../domain";

const channelLabels: Record<MarketingChannel, string> = { naver: "네이버", facebook: "Facebook", instagram: "Instagram", threads: "Threads" };

export default function ChannelScheduleSummary({ channel, schedule }: { channel: MarketingChannel; schedule: { scheduledAt: Date; mode: string; status: string; utmUrl: string; publishedUrl: string | null } }) {
  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">{channelLabels[channel]} 일정</h2><span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">{schedule.status}</span></div>
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-cream p-3"><dt className="text-xs font-bold text-navy/50">예정 시각</dt><dd className="mt-1 font-semibold">{schedule.scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</dd></div><div className="rounded-xl bg-cream p-3"><dt className="text-xs font-bold text-navy/50">발행 방식</dt><dd className="mt-1 font-semibold">{schedule.mode === "manual" ? "수동" : "자동"}</dd></div></dl>
    <div className="mt-3 rounded-xl bg-cream p-3"><p className="text-xs font-bold text-navy/50">CTA · UTM URL</p><p className="mt-1 break-all text-sm font-semibold">{schedule.utmUrl}</p></div>
    {schedule.publishedUrl ? <a href={schedule.publishedUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-teal underline">게시물 열기 ↗</a> : null}
  </section>;
}
