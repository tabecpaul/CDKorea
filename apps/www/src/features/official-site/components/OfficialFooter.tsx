import Image from "next/image";
import Link from "next/link";
import { navigation, site } from "../content";

export default function OfficialFooter() {
  return (
    <footer className="bg-navy px-5 py-14 text-cream sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.1fr_.9fr]">
        <div><div className="inline-flex rounded-xl bg-cream px-3 py-2"><Image src="/career-direct-logo.png" alt="Career Direct" width={170} height={48} className="h-8 w-auto" /></div><p className="mt-5 max-w-md text-sm leading-7 text-cream/65">자기이해에서 평가·컨설팅·실행계획까지, 고유한 설계를 발견하고 삶의 방향을 세우도록 돕습니다.</p></div>
        <div className="grid grid-cols-2 gap-5 text-sm"><div className="flex flex-col gap-3">{navigation.map((item) => <Link key={item.href} href={item.href} className="text-cream/70 hover:text-white">{item.label}</Link>)}</div><div className="flex flex-col gap-3 text-cream/70"><a href={`tel:${site.phone}`}>{site.phone}</a><a href={`mailto:${site.email}`}>{site.email}</a><span className="leading-6">{site.address}</span></div></div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-cream/45 sm:flex-row sm:justify-between"><span>Career Direct Korea · 대표 박정열 · 사업자등록번호 128-26-97778</span><span className="flex gap-4"><Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link><Link href="/refund-policy">환불정책</Link></span></div>
    </footer>
  );
}
