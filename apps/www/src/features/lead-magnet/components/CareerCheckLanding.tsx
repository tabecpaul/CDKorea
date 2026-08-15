import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Check,
  Compass,
  Gem,
  HeartHandshake,
  Route,
  Sparkles,
  Target,
} from "lucide-react";
import Footer from "@/components/sections/Footer";
import CareerDirectLogo from "@/components/CareerDirectLogo";
import LeadCaptureForm from "./LeadCaptureForm";
import PageViewTracker from "@/features/analytics/components/PageViewTracker";
import TrackedExternalLink from "@/features/analytics/components/TrackedExternalLink";

const signals = [
  "열심히 일해도 이 길이 맞는지 확신이 없다",
  "성과를 내도 에너지가 회복되지 않는다",
  "잘하는 일과 하고 싶은 일이 다르게 느껴진다",
];

const compasses = [
  { name: "성격", question: "어떻게 일할 때 편안한가?", icon: Brain, color: "bg-teal/12 text-teal" },
  { name: "흥미", question: "무엇에 자연스럽게 끌리는가?", icon: Target, color: "bg-gold/15 text-[#9b7428]" },
  { name: "재능", question: "무엇을 비교적 잘하는가?", icon: Gem, color: "bg-navy/8 text-navy" },
  { name: "가치관", question: "왜 그 일을 하는가?", icon: Compass, color: "bg-[#b45f55]/10 text-[#a65349]" },
];

const journey = [
  ["현실 인식", "진로 불안과 직무 불일치의 신호를 구체적으로 봅니다."],
  ["자가진단", "네 나침반으로 지금의 일과 나 사이를 점검합니다."],
  ["Career Direct 평가", "네 요소를 하나의 체계에서 깊이 있게 살펴봅니다."],
  ["보고서·컨설턴트 코칭", "결과를 함께 해석하고 나만의 언어로 정리합니다."],
  ["인터랙티브 실행계획", "작은 실험을 장기적인 진로 계획으로 연결합니다."],
  ["이후 코칭", "실행을 점검하고 변화에 맞춰 방향을 조정합니다."],
];

const faqs = [
  ["무료 PDF와 Career Direct 평가는 어떻게 다른가요?", "무료 PDF는 현재 상태를 돌아보고 다음 질문을 발견하는 10분 성찰 도구입니다. Career Direct 온라인 평가는 성격·흥미·기술과 능력·가치관을 더 깊이 살펴보는 별도의 정식 평가입니다."],
  ["이메일은 어떻게 사용되나요?", "PDF 전달을 위해 이메일을 사용합니다. 선택 동의한 경우에만 2일·4일·6일 차에 미니 코칭 이메일을 보내며, 언제든 수신을 거부할 수 있습니다."],
  ["자가진단 결과로 직업을 결정해도 되나요?", "아니요. 이 자료는 직업을 판정하거나 의료·심리 치료, 표준화된 진로평가를 대체하지 않습니다. 결과는 더 자세히 탐색할 질문을 찾는 데 활용해 주세요."],
  ["신앙이 없어도 이용할 수 있나요?", "네. 의미·목적·소명에 열린 질문이 포함되지만 특정 신앙을 요구하지 않으며 누구나 자신의 방향을 돌아보는 데 사용할 수 있습니다."],
];

export default function CareerCheckLanding() {
  return (
    <>
      <main className="overflow-hidden bg-cream">
        <PageViewTracker />
        <section className="relative px-5 pb-20 pt-6 sm:px-8 lg:pb-28">
          <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_75%_10%,rgba(79,158,169,.18),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,.72),transparent)]" aria-hidden />
          <nav className="relative mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="Career Direct Korea 홈">
              <CareerDirectLogo priority />
            </Link>
            <a href="#lead-form" className="hidden rounded-full border border-navy/15 bg-white/70 px-5 py-2.5 text-sm font-bold text-navy backdrop-blur transition hover:bg-white sm:block">PDF 무료 받기</a>
          </nav>

          <div className="relative mx-auto mt-14 grid max-w-6xl items-center gap-12 lg:mt-20 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-white/70 px-4 py-2 text-sm font-bold text-teal shadow-sm backdrop-blur">
                <Sparkles className="size-4" aria-hidden /> 청년 직장인을 위한 무료 진로방향 자가진단
              </p>
              <h1 className="mt-7 max-w-3xl text-[2.5rem] font-black leading-[1.13] tracking-[-.04em] text-navy sm:text-6xl lg:text-[4.25rem]">
                왜 열심히 사는데<br /><span className="text-teal">진로 불안과 번아웃</span>을<br />느끼나요?
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-navy/70 sm:text-xl sm:leading-9">
                문제는 의지가 부족해서가 아니라, 나에게 맞는 방향과 현재의 일이 어긋나 있기 때문일 수 있습니다. 10분 자가진단으로 지금 점검해야 할 질문을 찾아보세요.
              </p>
              <ul className="mt-8 grid gap-3 text-sm font-medium text-navy/75 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {["12페이지 워크북", "10분 자가진단", "30일 행동 설계"].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded-full bg-teal/15"><Check className="size-3 text-teal" /></span>{item}</li>
                ))}
              </ul>
              <a href="#reality" className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-navy/55 hover:text-navy">먼저 내 상태 확인하기 <ArrowDown className="size-4" /></a>
            </div>
            <div id="lead-form" className="scroll-mt-8"><LeadCaptureForm /></div>
          </div>
        </section>

        <section id="reality" className="bg-white px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
              <div>
                <p className="text-sm font-black tracking-[.18em] text-teal">REALITY CHECK</p>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-navy sm:text-5xl">불안은 약함의 증거가 아니라<br />방향을 점검하라는 신호일 수 있습니다.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {signals.map((signal, index) => <div key={signal} className="rounded-2xl border border-navy/10 bg-cream/70 p-5"><span className="text-xs font-black text-gold">0{index + 1}</span><p className="mt-3 text-sm font-semibold leading-6 text-navy">{signal}</p></div>)}
              </div>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2">
              <article className="rounded-[1.75rem] bg-navy p-7 text-white sm:p-9">
                <strong className="text-5xl font-black text-gold">5.4%</strong>
                <p className="mt-4 text-lg font-bold">이직·구직 시 가장 큰 고려 요인으로 ‘장기적 진로설계’를 선택</p>
                <p className="mt-4 text-xs leading-5 text-white/55">2024년 청년의 삶 실태조사 · 만 19~34세 15,098명 · 1순위 응답 · <a href="https://www.opm.go.kr/doc/_attach/file/2025/03/DHqkrnLbagZNXnJoFvkK.hwpx.files/Sections1.html" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">공식 자료</a></p>
              </article>
              <article className="rounded-[1.75rem] border border-teal/20 bg-[#eaf5f5] p-7 sm:p-9">
                <strong className="text-5xl font-black text-teal">59.9%</strong>
                <p className="mt-4 text-lg font-bold text-navy">인사담당자가 보고한 신입사원 조기퇴사 이유 중 ‘직무 적합성 불일치’</p>
                <p className="mt-4 text-xs leading-5 text-navy/50">인크루트 2025 · 인사담당자 446명 · 민간 HR 조사 · <a href="https://news.incruit.com/news/newsview.asp?newsno=437921&ty=26" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-navy">조사 원문</a></p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[.95fr_1.05fr]">
            <div className="relative mx-auto w-full max-w-[32rem]">
              <div className="absolute -left-6 -top-6 size-32 rounded-full bg-gold/20 blur-2xl" aria-hidden />
              <Image src="/images/career-check/page-01.png" alt="진로 방향 자가진단 PDF 표지" width={992} height={1403} className="relative w-[68%] rounded-lg shadow-[0_30px_70px_rgba(23,50,77,.2)]" />
              <Image src="/images/career-check/page-05.png" alt="네 가지 나침반 소개 페이지" width={992} height={1403} className="absolute right-0 top-16 w-[58%] rotate-2 rounded-lg border border-white shadow-[0_25px_60px_rgba(23,50,77,.2)]" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[.18em] text-teal">INSIDE THE WORKBOOK</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-navy sm:text-5xl">막연한 불안을<br />쓸 수 있는 질문으로 바꿉니다.</h2>
              <div className="mt-8 space-y-5">
                {["현재 나타나는 진로 불안과 소진 신호를 구체적으로 확인", "성격·흥미·재능·가치관의 네 나침반 정렬도 점검", "결론 대신 30일 안에 실행할 작은 커리어 실험 설계"].map((item) => <div key={item} className="flex gap-4"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-navy"><Check className="size-3.5" /></span><p className="leading-7 text-navy/75">{item}</p></div>)}
              </div>
              <p className="mt-8 rounded-2xl border border-gold/25 bg-white/65 p-5 text-sm leading-6 text-navy/60">이 무료 요약본은 정식 Career Direct 평가, 보고서 해석 또는 워크숍 전체 과정을 대체하지 않습니다.</p>
            </div>
          </div>
        </section>

        <section className="bg-navy px-5 py-20 text-white sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm font-black tracking-[.18em] text-teal">FOUR COMPASSES</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">지속 가능한 진로를 만드는 네 가지 나침반</h2>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/65">한 요소만 맞는 직업보다 네 요소가 함께 정렬되는 방향을 찾는 것이 중요합니다.</p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {compasses.map(({ name, question, icon: Icon, color }) => <article key={name} className="rounded-[1.5rem] border border-white/10 bg-white/[.06] p-6 text-left"><span className={`flex size-12 items-center justify-center rounded-2xl ${color}`}><Icon className="size-6" /></span><h3 className="mt-6 text-xl font-black">{name}</h3><p className="mt-2 text-sm leading-6 text-white/60">{question}</p></article>)}
            </div>
            <div className="mt-14 border-t border-white/10 pt-10">
              <p className="text-xs font-bold tracking-[.14em] text-white/45">CAREER DIRECT FAST FACTS</p>
              <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-5">
                {["30년+ 개발·개선", "84개국", "21개 언어", "40만+ 삶에 영향", "800+ 컨설턴트"].map((fact) => <p key={fact} className="text-sm font-bold text-white/75">{fact}</p>)}
              </div>
              <TrackedExternalLink eventName="official_site_clicked" ctaLocation="fast_facts" href="https://careerdirect.org/?language_code=KO" target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-teal hover:text-white">공식 한국어 사이트 둘러보기 <ArrowRight className="size-3.5" /></TrackedExternalLink>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black tracking-[.18em] text-teal">FROM INSIGHT TO ACTION</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-navy sm:text-5xl">발견에서 실행까지,<br />혼자 두지 않는 6단계 여정</h2>
            </div>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border border-navy/10 bg-navy/10 md:grid-cols-2 lg:grid-cols-3">
              {journey.map(([title, desc], index) => <li key={title} className="bg-white p-7 sm:p-8"><div className="flex items-center justify-between"><span className="text-xs font-black tracking-[.16em] text-teal">STEP {String(index + 1).padStart(2, "0")}</span>{index === 0 ? <Route className="size-5 text-gold" /> : index === 5 ? <HeartHandshake className="size-5 text-gold" /> : null}</div><h3 className="mt-5 text-lg font-black text-navy">{title}</h3><p className="mt-3 text-sm leading-6 text-navy/60">{desc}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="text-center"><p className="text-sm font-black tracking-[.18em] text-teal">FAQ</p><h2 className="mt-4 text-3xl font-black text-navy sm:text-5xl">시작하기 전에 궁금한 점</h2></div>
            <div className="mt-10 space-y-3">
              {faqs.map(([q, a]) => <details key={q} className="group rounded-2xl border border-navy/10 bg-white px-6 py-5 open:shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-navy">{q}<span className="text-xl text-teal transition group-open:rotate-45">+</span></summary><p className="mt-4 pr-8 text-sm leading-7 text-navy/60">{a}</p></details>)}
            </div>
          </div>
        </section>

        <section className="relative bg-[#e9f4f4] px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
            <div><p className="text-sm font-black tracking-[.18em] text-teal">YOUR NEXT QUESTION</p><h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-navy sm:text-5xl">오늘 결론을 내리지 않아도<br />방향은 점검할 수 있습니다.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-navy/65">이메일 한 번으로 워크북을 받고, 지금 가장 어긋난 나침반과 다음 30일의 작은 행동을 찾아보세요.</p><TrackedExternalLink eventName="callback_cta_clicked" ctaLocation="final_section" href="/assessment-consultation?source=career_check&cta_location=final_section" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-black text-white hover:bg-navy/90">20분 무료 콜백 신청하기 <ArrowRight className="size-4" /></TrackedExternalLink></div>
            <LeadCaptureForm compact />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
