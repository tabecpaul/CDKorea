import { OFFICIAL_SITE_URL, START_SITE_URL } from "@/features/site-routing/hosts";

export const navigation = [
  { href: "/assessment", label: "Career Direct 평가" },
  { href: "/consulting", label: "커리어 컨설팅" },
  { href: "/pricing", label: "비용·절차" },
  { href: "/organizations", label: "교회·대학·기관" },
  { href: "/consultant", label: "컨설턴트 소개" },
] as const;

export const ctas = {
  careerCheck: {
    href: `${START_SITE_URL}/career-check`,
    label: "무료 진로 방향 자가진단 받기",
    eventName: "official_site_clicked" as const,
  },
  callback: {
    href: `${START_SITE_URL}/assessment-consultation`,
    label: "20분 무료 콜백 신청하기",
    eventName: "callback_cta_clicked" as const,
  },
};

export const prices = {
  youth: { name: "청년 통합 패키지", age: "만 15~28세", total: "385,000원" },
  adult: { name: "성인 통합 패키지", age: "만 29세 이상", total: "495,000원" },
} as const;

export const site = {
  name: "Career Direct Korea",
  url: OFFICIAL_SITE_URL,
  phone: "010-5231-1059",
  email: "dulospaul@gmail.com",
  address: "경기도 의왕시 오봉산단1로 12, 에이스비전 21 10층 1012호",
};
