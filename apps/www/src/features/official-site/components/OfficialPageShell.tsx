import type { ReactNode } from "react";
import OfficialCtaLink from "./OfficialCtaLink";
import { ctas } from "../content";

export function Eyebrow({ children }: { children: ReactNode }) { return <p className="text-xs font-black tracking-[.2em] text-teal uppercase">{children}</p>; }

export function DetailHero({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return <section className="bg-cream px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-4xl"><Eyebrow>{eyebrow}</Eyebrow><h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-navy sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-navy/65">{lead}</p></div></section>;
}

export function Section({ eyebrow, title, children, dark = false }: { eyebrow?: string; title: string; children: ReactNode; dark?: boolean }) {
  return <section className={`${dark ? "bg-navy text-white" : "bg-white text-navy"} px-5 py-16 sm:px-8 sm:py-24`}><div className="mx-auto max-w-6xl">{eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}<h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h2><div className={`mt-8 ${dark ? "text-white/75" : "text-navy/70"}`}>{children}</div></div></section>;
}

export function FinalCta({ primary = "callback", title = "좋은 질문부터 시작하세요" }: { primary?: "callback" | "careerCheck"; title?: string }) {
  const first = ctas[primary]; const second = primary === "callback" ? ctas.careerCheck : ctas.callback;
  return <section className="bg-gold px-5 py-16 text-center text-navy sm:px-8"><div className="mx-auto max-w-3xl"><h2 className="text-3xl font-black sm:text-4xl">{title}</h2><p className="mt-4 leading-7">정답을 서두르기보다 지금의 상황을 살피고, 나에게 맞는 다음 단계를 선택하세요.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><OfficialCtaLink href={first.href} eventName={first.eventName} ctaLocation="final_cta_primary" className="rounded-full bg-navy px-6 py-4 font-bold text-white">{first.label}</OfficialCtaLink><OfficialCtaLink href={second.href} eventName={second.eventName} ctaLocation="final_cta_secondary" className="rounded-full bg-white px-6 py-4 font-bold text-navy">{second.label}</OfficialCtaLink></div></div></section>;
}
