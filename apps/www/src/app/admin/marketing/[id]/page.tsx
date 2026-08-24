import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import ContentDetail from "@/features/marketing/components/ContentDetail";
import { getMarketingContent } from "@/features/marketing/server/queries";

export const metadata: Metadata = { title: "콘텐츠 상세 | Career Direct Korea", robots: { index: false, follow: false } };

export default async function MarketingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const detail = await getMarketingContent(Number((await params).id));
  if (!detail) notFound();
  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14"><div className="mx-auto max-w-7xl"><Link href="/admin/marketing" className="text-sm font-bold text-teal underline">← 콘텐츠 운영</Link><header className="mt-6"><p className="text-xs font-black tracking-[.15em] text-teal">CONTENT #{detail.content.id}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{detail.content.title}</h1><p className="mt-2 text-sm text-navy/50">{detail.content.campaignKey} · 자동 발행 비활성</p></header><div className="mt-8"><ContentDetail detail={detail} /></div></div></main>;
}
