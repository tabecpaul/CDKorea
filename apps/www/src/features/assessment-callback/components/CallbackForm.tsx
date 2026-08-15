"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ageRangeOptions,
  callbackTopics,
  genderOptions,
  maritalStatusOptions,
  timeSlots,
} from "../domain";
import { formatKoreanMobilePhone } from "../phone";

type Props = {
  minDate: string;
  maxDate: string;
  attribution: {
    source?: string;
    ctaLocation?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
  };
};

const errorMessages: Record<string, string> = {
  contact_invalid: "이름, 이메일과 휴대전화 번호를 확인해 주세요.",
  date_invalid: "오늘부터 60일 이내의 희망 날짜를 선택해 주세요.",
  selection_invalid: "선택 항목과 상담 주제를 확인해 주세요.",
  other_topic_invalid: "기타를 선택했다면 내용을 함께 입력해 주세요.",
  privacy_required: "개인정보 수집·이용 동의가 필요합니다.",
  submission_unavailable: "접수하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

export default function CallbackForm({ minDate, maxDate, attribution }: Props) {
  const [topics, setTopics] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTopic(value: string) {
    setTopics((current) => current.includes(value)
      ? current.filter((topic) => topic !== value)
      : [...current, value]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/assessment-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          preferredDate: form.get("preferredDate"),
          timeSlot: form.get("timeSlot"),
          gender: form.get("gender"),
          ageRange: form.get("ageRange"),
          maritalStatus: form.get("maritalStatus"),
          topics,
          otherTopic: topics.includes("other") ? form.get("otherTopic") : null,
          privacyAgreed,
          marketingAgreed,
          ...attribution,
        }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "submission_unavailable");
      setSubmitted(true);
    } catch (submitError) {
      const code = submitError instanceof Error ? submitError.message : "submission_unavailable";
      setError(errorMessages[code] ?? errorMessages.submission_unavailable);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <div className="rounded-[2rem] border border-teal/25 bg-white p-8 text-center shadow-sm sm:p-10"><p className="text-xs font-black tracking-[.15em] text-teal">CALLBACK RECEIVED</p><h2 className="mt-4 text-2xl font-black text-navy">콜백 신청이 접수되었습니다.</h2><p className="mt-4 leading-7 text-navy/65">영업일 기준 1일 이내에 연락드려 20분 통화 시간을 확정하겠습니다.</p><p className="mt-4 rounded-xl bg-cream p-4 text-sm leading-6 text-navy/60">신청만으로 결제되거나 검사가 시작되지 않습니다.</p></div>;
  }

  const field = "h-12 rounded-xl border border-navy/15 bg-white px-4 text-sm text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/15";
  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-navy/10 bg-cream p-6 shadow-sm sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-navy">이름<input name="name" required minLength={2} maxLength={60} className={field} placeholder="이름을 입력해 주세요" /></label>
        <label className="grid gap-2 text-sm font-bold text-navy">휴대전화<input name="phone" required inputMode="tel" autoComplete="tel" maxLength={13} value={phone} onChange={(event) => setPhone(formatKoreanMobilePhone(event.target.value))} className={field} placeholder="010-0000-0000" /></label>
        <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">이메일<input name="email" required type="email" className={field} placeholder="example@email.com" /></label>
        <label className="grid gap-2 text-sm font-bold text-navy">희망 날짜<input name="preferredDate" required type="date" min={minDate} max={maxDate} className={field} /></label>
        <label className="grid gap-2 text-sm font-bold text-navy">희망 시간대<select name="timeSlot" required defaultValue="" className={field}><option value="" disabled>선택해 주세요</option>{timeSlots.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-bold text-navy">성별<select name="gender" defaultValue="prefer_not_to_say" className={field}>{genderOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-bold text-navy">연령대<select name="ageRange" defaultValue="prefer_not_to_say" className={field}>{ageRangeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">혼인 여부<select name="maritalStatus" defaultValue="prefer_not_to_say" className={field}>{maritalStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>

      <fieldset className="mt-7"><legend className="text-sm font-black text-navy">가장 먼저 나누고 싶은 주제 <span className="text-teal">(복수 선택)</span></legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{callbackTopics.map((topic) => <label key={topic.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-bold ${topics.includes(topic.value) ? "border-teal bg-white text-navy" : "border-navy/10 bg-white/50 text-navy/65"}`}><input type="checkbox" checked={topics.includes(topic.value)} onChange={() => toggleTopic(topic.value)} className="size-4 accent-[#278a96]" />{topic.label}</label>)}</div></fieldset>
      {topics.includes("other") ? <label className="mt-4 grid gap-2 text-sm font-bold text-navy">기타 내용<textarea name="otherTopic" required maxLength={300} rows={3} className="rounded-xl border border-navy/15 bg-white p-4 text-sm outline-none focus:border-teal" placeholder="간단히 적어 주세요" /></label> : null}

      <div className="mt-7 space-y-3 border-t border-navy/10 pt-6 text-sm leading-6 text-navy/70">
        <label className="flex items-start gap-3"><input type="checkbox" required checked={privacyAgreed} onChange={(event) => setPrivacyAgreed(event.target.checked)} className="mt-1 size-4 accent-[#278a96]" /><span><strong className="text-teal">[필수]</strong> 콜백 제공을 위한 개인정보 수집·이용에 동의합니다. <Link href="/privacy" target="_blank" className="underline">내용 보기</Link></span></label>
        <label className="flex items-start gap-3"><input type="checkbox" checked={marketingAgreed} onChange={(event) => setMarketingAgreed(event.target.checked)} className="mt-1 size-4 accent-[#278a96]" /><span><strong className="text-teal">[선택]</strong> Career Direct 평가·코칭 안내 이메일 수신에 동의합니다.</span></label>
      </div>
      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
      <button type="submit" disabled={!privacyAgreed || topics.length === 0 || submitting} className="mt-6 h-14 w-full rounded-xl bg-navy px-6 font-black text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "접수 중..." : "20분 무료 콜백 신청하기"}</button>
      <p className="mt-3 text-center text-xs leading-5 text-navy/45">신청만으로 결제되거나 검사가 시작되지 않습니다.</p>
    </form>
  );
}
