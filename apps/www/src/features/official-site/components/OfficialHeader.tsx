import Image from "next/image";
import Link from "next/link";
import { navigation, ctas } from "../content";
import OfficialCtaLink from "./OfficialCtaLink";
import PageViewTracker from "@/features/analytics/components/PageViewTracker";

export default function OfficialHeader() {
  return (
    <><PageViewTracker eventName="official_page_viewed" /><header className="sticky top-0 z-40 border-b border-navy/8 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Career Direct Korea 홈">
          <Image src="/career-direct-logo.png" alt="Career Direct" width={158} height={44} className="h-8 w-auto" priority />
          <span className="font-black text-gold">Korea</span>
        </Link>
        <nav aria-label="주요 메뉴" className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="text-sm font-semibold text-navy/75 hover:text-teal">{item.label}</Link>)}
        </nav>
        <OfficialCtaLink href={ctas.careerCheck.href} eventName={ctas.careerCheck.eventName} ctaLocation="header" className="hidden rounded-full bg-navy px-5 py-3 text-sm font-bold text-white sm:block">무료 자가진단</OfficialCtaLink>
        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-navy/15 px-4 py-2 text-sm font-bold">메뉴</summary>
          <div className="absolute right-0 mt-3 flex w-64 flex-col gap-1 rounded-2xl border border-navy/10 bg-white p-3 shadow-xl">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-cream">{item.label}</Link>)}
          </div>
        </details>
      </div>
    </header></>
  );
}
