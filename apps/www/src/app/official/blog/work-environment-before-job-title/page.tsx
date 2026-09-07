import type { Metadata } from "next";
import OfficialCtaLink from "@/features/official-site/components/OfficialCtaLink";
import { Eyebrow } from "@/features/official-site/components/OfficialPageShell";
import { ctas } from "@/features/official-site/content";
import { officialUrl } from "@/features/site-routing/hosts";

const slug = "work-environment-before-job-title";

export const metadata: Metadata = {
  title: "직업 이름보다 먼저 확인해야 할 ‘일하는 환경’ | Career Direct Korea",
  description:
    "같은 직업도 협업 밀도, 자율성, 업무 속도, 피드백과 의사결정 방식에 따라 전혀 다른 일이 됩니다. 직업명보다 실제 업무환경을 먼저 점검하는 방법을 소개합니다.",
  alternates: { canonical: officialUrl(`/blog/${slug}`).toString() },
};

export default function WorkEnvironmentBeforeJobTitlePage() {
  return (
    <main className="bg-white text-navy">
      <article>
        <header className="bg-cream px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-4xl">
            <Eyebrow>자기이해 · 업무환경</Eyebrow>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              직업 이름보다 먼저 확인해야 할 ‘일하는 환경’
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-navy/65">
              같은 직업이라도 어디에서, 누구와, 어떤 속도로, 어느 정도의 자율성과 책임을 가지고 일하느냐에 따라
              실제 경험은 전혀 달라집니다. 직업명이 아니라 ‘업무 장면’을 비교해야 하는 이유입니다.
            </p>
            <time className="mt-7 block text-sm font-semibold text-navy/45" dateTime="2026-09-07">
              2026년 9월 7일
            </time>
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-16 px-5 py-16 sm:px-8 sm:py-24">
          <section>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">“이 직업이 나와 맞을까요?”만으로는 부족합니다</h2>
            <div className="mt-7 space-y-5 text-lg leading-9 text-navy/70">
              <p>
                진로를 생각할 때 우리는 보통 직업명을 먼저 고르고 자신이 그 직업에 맞는지를 묻습니다. 그러나 같은
                ‘기획자’라도 한 사람은 데이터와 문서를 중심으로 깊이 분석하고, 다른 사람은 여러 부서를 오가며 빠르게
                조율하고 설득합니다. 교사와 디자이너도 조직, 역할, 고객, 책임 범위에 따라 하루의 리듬이 크게 달라집니다.
              </p>
              <p>
                그래서 “이 직업이 맞지 않는다”고 결론 내리기 전에 실제로는 직업 자체가 아니라 현재의 업무환경과 맞지
                않는 것은 아닌지 구분해야 합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">직업명 대신 네 가지 환경 축을 비교하세요</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-3xl border border-navy/10 bg-cream/55 p-7">
                <h3 className="text-xl font-black text-teal">1. 상호작용 밀도</h3>
                <p className="mt-3 leading-7 text-navy/70">하루 대부분을 사람과 즉시 소통하는가, 혼자 집중한 뒤 필요한 순간에 협업하는가를 봅니다.</p>
              </div>
              <div className="rounded-3xl border border-navy/10 bg-cream/55 p-7">
                <h3 className="text-xl font-black text-teal">2. 구조와 자율성</h3>
                <p className="mt-3 leading-7 text-navy/70">명확한 절차와 역할 안에서 일하는가, 목표만 주어지고 방법은 스스로 설계하는가를 봅니다.</p>
              </div>
              <div className="rounded-3xl border border-navy/10 bg-cream/55 p-7">
                <h3 className="text-xl font-black text-teal">3. 속도와 전환 빈도</h3>
                <p className="mt-3 leading-7 text-navy/70">여러 과제를 짧은 주기로 전환하는가, 한 문제를 오래 파고드는 집중 시간이 확보되는가를 봅니다.</p>
              </div>
              <div className="rounded-3xl border border-navy/10 bg-cream/55 p-7">
                <h3 className="text-xl font-black text-teal">4. 피드백과 의사결정 거리</h3>
                <p className="mt-3 leading-7 text-navy/70">결과에 대한 피드백이 즉시 오는가, 장기적으로 확인되는가. 또 내 판단이 결과에 미치는 책임 범위가 얼마나 큰지를 봅니다.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-navy p-8 text-white sm:p-12">
            <Eyebrow>WORK SCENE LOG</Eyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">최근 3개월의 ‘업무 장면’을 기록해 보세요</h2>
            <div className="mt-7 space-y-5 text-lg leading-9 text-white/75">
              <p>
                막연하게 “사람을 좋아한다”, “자율적인 일을 원한다”고 적는 것보다 실제 장면을 기록하는 편이 더 정확합니다.
                시간이 빨리 지나갔던 장면 세 가지와 예상보다 크게 지쳤던 장면 세 가지를 적어 보세요.
              </p>
              <p>
                각각에 대해 누구와 일했는지, 어떤 속도였는지, 자율성은 어느 정도였는지, 결정 책임은 누구에게 있었는지를
                함께 적으면 반복되는 환경 패턴이 보이기 시작합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">환경 적합성은 핑계가 아니라 비교 기준입니다</h2>
            <div className="mt-7 space-y-5 text-lg leading-9 text-navy/70">
              <p>
                자신에게 편한 환경만 찾아다니라는 뜻은 아닙니다. 어떤 환경에서도 배워야 할 기술과 감당해야 할 책임이
                있습니다. 다만 반복적으로 에너지를 소진시키고 강점을 사용하지 못하게 만드는 조건을 무시한 채 직업명만
                붙잡으면 판단이 흐려집니다.
              </p>
              <p>
                Career Direct는 특정 직업을 정답으로 지목하지 않습니다. 성격·흥미·재능·가치관을 함께 살펴 여러 기회와
                실제 업무환경을 비교할 기준을 세우도록 돕습니다. 평가 결과는 결론이 아니라 현실의 업무 장면을 검증하는
                출발점입니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">다음 선택 전에 다섯 장면을 적어 보세요</h2>
            <ol className="mt-8 space-y-4">
              {[
                "최근 가장 몰입했던 업무 장면은 무엇이었나요?",
                "예상보다 크게 지쳤던 장면에는 어떤 환경 조건이 있었나요?",
                "혼자 일할 때와 협업할 때 성과와 에너지는 어떻게 달랐나요?",
                "명확한 지시와 높은 자율성 중 어느 조건에서 더 좋은 결과가 나왔나요?",
                "비슷한 직업 두 개를 비교한다면 실제 하루의 업무환경은 어떻게 다른가요?",
              ].map((question, index) => (
                <li key={question} className="flex gap-4 rounded-2xl border border-navy/10 p-5 text-lg leading-8">
                  <span className="font-black text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-navy/75">{question}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="bg-gold px-5 py-16 text-center text-navy sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-black sm:text-4xl">직업명보다 나에게 맞는 일의 조건부터 점검하세요</h2>
            <p className="mt-4 leading-7">
              무료 진로 방향 자가진단으로 성격·흥미·재능·가치관을 돌아보고, 다음 선택에서 확인할 업무환경의 단서를 정리해 보세요.
            </p>
            <OfficialCtaLink
              href={ctas.careerCheck.href}
              eventName={ctas.careerCheck.eventName}
              ctaLocation="work_environment_before_job_title_final"
              className="mt-8 inline-flex rounded-full bg-navy px-7 py-4 font-bold text-white"
            >
              {ctas.careerCheck.label}
            </OfficialCtaLink>
            <p className="mt-8 text-sm font-semibold text-navy/60">
              Discover Your Design. Discern Your Calling. Drive Your Journey.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
