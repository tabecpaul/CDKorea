import type { Metadata } from "next";
import OfficialCtaLink from "@/features/official-site/components/OfficialCtaLink";
import { Eyebrow } from "@/features/official-site/components/OfficialPageShell";
import { giftsTalentsStrengthsArticle as article } from "@/features/official-site/blog/giftsTalentsStrengths";
import { ctas } from "@/features/official-site/content";
import { officialUrl } from "@/features/site-routing/hosts";

export const metadata: Metadata = {
  title: `${article.title} | Career Direct Korea`,
  description: article.description,
  alternates: { canonical: officialUrl(`/blog/${article.slug}`).toString() },
};

export default function GiftsTalentsStrengthsPage() {
  return (
    <main className="bg-white text-navy">
      <article>
        <header className="bg-cream px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-4xl">
            <Eyebrow>신앙과 소명 · 자기이해</Eyebrow>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              {article.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-navy/65">
              잘하는 일이 곧 소명일까요? 서로 연결될 수 있지만 같은 뜻은 아닌 네 개념을 구분하면,
              나의 능력을 과대평가하거나 반대로 소홀히 하지 않고 더 책임 있게 사용할 수 있습니다.
            </p>
            <time className="mt-7 block text-sm font-semibold text-navy/45" dateTime={article.publishedAt}>
              2026년 8월 27일
            </time>
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-16 px-5 py-16 sm:px-8 sm:py-24">
          <section aria-labelledby="not-one-answer">
            <h2 id="not-one-answer" className="text-3xl font-black tracking-tight sm:text-4xl">
              잘하는 일은 중요한 단서이지만 최종 판정은 아닙니다
            </h2>
            <div className="mt-7 space-y-5 text-lg leading-9 text-navy/70">
              <p>
                진로가 불안할수록 “내가 가장 잘하는 일 하나를 찾으면 모든 선택이 분명해질 것”이라고 기대하기 쉽습니다.
                그러나 능력만으로는 그 일을 왜 하는지, 누구에게 어떤 유익을 주는지, 지금의 관계와 책임을 어떻게 돌볼지까지
                설명할 수 없습니다.
              </p>
              <p>
                잘하는 일은 소명의 중요한 단서가 될 수 있습니다. 다만 목적·성품·관계·공동체의 필요와 현실적 책임을 함께
                살필 때 그 단서를 더 정직하게 해석할 수 있습니다.
              </p>
            </div>
          </section>

          <section aria-labelledby="four-differences">
            <h2 id="four-differences" className="text-3xl font-black tracking-tight sm:text-4xl">
              은사·재능·기술·강점을 구분해 보세요
            </h2>
            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              {article.definitions.map((item) => (
                <div key={item.term} className="rounded-3xl border border-navy/10 bg-cream/55 p-7">
                  <dt className="text-xl font-black text-teal">{item.term}</dt>
                  <dd className="mt-3 leading-7 text-navy/70">{item.description}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-7 text-lg leading-9 text-navy/70">
              타고난 가능성이 훈련을 통해 기술이 되고, 성격과 지식까지 결합해 실제 강점으로 나타날 수 있습니다. 하지만
              평가에서 확인하는 재능과 성경이 말하는 영적 은사를 같은 개념으로 취급해서는 안 됩니다.
            </p>
          </section>

          <section aria-labelledby="common-good" className="rounded-[2rem] bg-navy p-8 text-white sm:p-12">
            <Eyebrow>COMMON GOOD</Eyebrow>
            <h2 id="common-good" className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              기준은 우월함이 아니라 공동의 유익입니다
            </h2>
            <div className="mt-7 space-y-5 text-lg leading-9 text-white/75">
              <p>
                고린도전서 12장 4–7절은 은사와 직분과 사역의 다양성을 말하면서, 성령의 나타나심이 공동의 유익을 위해
                주어진다고 설명합니다. 은사는 내가 더 특별하다는 것을 증명하는 표지가 아니라 공동체를 세우도록 맡겨진
                선물입니다.
              </p>
              <p>
                베드로전서 4장 10–11절도 받은 은사를 서로 섬기는 데 사용하라고 권합니다. 그래서 “무엇을 가졌는가?”와 함께
                “그것으로 누구에게 어떤 유익을 주고 있는가?”를 물어야 합니다.
              </p>
            </div>
          </section>

          <section aria-labelledby="career-direct-role">
            <h2 id="career-direct-role" className="text-3xl font-black tracking-tight sm:text-4xl">
              Career Direct는 자기이해를 돕지만 소명을 판정하지 않습니다
            </h2>
            <div className="mt-7 space-y-5 text-lg leading-9 text-navy/70">
              <p>
                Career Direct는 성격·흥미·재능·가치관을 함께 살펴 자신을 더 입체적으로 이해하도록 돕습니다. 여기서 재능은
                수행 가능성과 관련된 자기이해 요소이며 영적 은사를 측정하는 항목이 아닙니다.
              </p>
              <p>
                평가 결과도 하나님의 뜻을 알려 주는 결론문이 아닙니다. 반복되는 특성과 가설을 발견하고, 공동체의 피드백과
                실제 경험 속에서 더 구체적으로 검증하도록 돕는 자료입니다.
              </p>
            </div>
          </section>

          <section aria-labelledby="reflection">
            <h2 id="reflection" className="text-3xl font-black tracking-tight sm:text-4xl">
              다음 선택 전에 다섯 가지를 적어 보세요
            </h2>
            <ol className="mt-8 space-y-4">
              {article.reflectionQuestions.map((question, index) => (
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
            <h2 className="text-3xl font-black sm:text-4xl">맡겨진 나를 이해하는 질문부터 시작하세요</h2>
            <p className="mt-4 leading-7">
              무료 진로 방향 자가진단으로 성격·흥미·재능·가치관을 돌아보고 다음의 작은 실험을 정리해 보세요.
            </p>
            <OfficialCtaLink
              href={ctas.careerCheck.href}
              eventName={ctas.careerCheck.eventName}
              ctaLocation="gifts_talents_strengths_final"
              className="mt-8 inline-flex rounded-full bg-navy px-7 py-4 font-bold text-white"
            >
              {ctas.careerCheck.label}
            </OfficialCtaLink>
          </div>
        </section>
      </article>
    </main>
  );
}
