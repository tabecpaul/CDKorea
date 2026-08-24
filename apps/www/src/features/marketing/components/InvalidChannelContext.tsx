import Link from "next/link";

export default function InvalidChannelContext({ contentId }: { contentId: number }) {
  return <section className="rounded-2xl border border-gold/40 bg-white p-6"><h2 className="text-xl font-black">선택한 채널 일정을 찾을 수 없습니다.</h2><p className="mt-2 text-sm leading-6 text-navy/55">일정이 변경됐거나 현재 콘텐츠 버전과 일치하지 않습니다. 채널을 추정해 다른 자료를 표시하지 않았습니다.</p><Link href={`/admin/marketing/${contentId}`} className="mt-5 inline-block rounded-full bg-navy px-5 py-3 text-sm font-bold text-white">전체 콘텐츠 검토로 이동</Link></section>;
}
