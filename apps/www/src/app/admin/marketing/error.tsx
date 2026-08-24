"use client";

export default function MarketingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="min-h-screen bg-cream px-5 py-12 text-navy"><div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8"><h1 className="text-2xl font-black">콘텐츠 운영 화면을 불러오지 못했습니다.</h1><p className="mt-3 text-sm text-navy/60">잠시 후 다시 시도해 주세요. 자동 발행에는 영향을 주지 않습니다.</p><button type="button" onClick={reset} className="mt-6 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white">다시 시도</button></div></main>;
}
