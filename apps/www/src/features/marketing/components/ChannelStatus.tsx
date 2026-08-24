import type { listMarketingConnections, QueryResult } from "../server/queries";
import { CardError } from "./MarketingSummary";

type Connections = Awaited<ReturnType<typeof listMarketingConnections>>;
const channelLabels: Record<string, string> = { naver: "네이버", facebook: "Facebook", instagram: "Instagram", threads: "Threads" };

export default function ChannelStatus({ result }: { result: QueryResult<Connections> }) {
  if (!result.data) return <CardError title="채널 연결 상태" message={result.error} />;
  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><h2 className="text-xl font-black">채널 연결 상태</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{result.data.length ? result.data.map((item) => <article key={item.id} className="rounded-xl bg-cream p-4"><div className="flex items-center justify-between gap-3"><strong>{channelLabels[item.channel] ?? item.channel}</strong><span className="rounded-full bg-white px-3 py-1 text-xs font-bold">{item.status}</span></div><p className="mt-2 truncate text-sm text-navy/60">{item.accountName}</p><p className="mt-2 text-xs text-navy/45">마지막 확인 {item.checkedAt ? item.checkedAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "미확인"}</p></article>) : <p className="text-sm text-navy/45">확인된 채널 연결 정보가 없습니다. 자동 발행은 비활성 상태입니다.</p>}</div></section>;
}
