"use client";

import Image from "next/image";
import { useState } from "react";

type Asset = { id: number; position: number; filename: string; width: number; height: number; byteSize: number };

export default function AssetPreviewGallery({ contentId, version, assets }: { contentId: number; version: number | null; assets: Asset[] }) {
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  return <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
    <h2 className="text-xl font-black">카드뉴스 이미지</h2>
    <p className="mt-1 text-xs text-navy/45">현재 승인 대상 {version ? `v${version}` : "버전 없음"} · 카드 {assets.length}장</p>
    <p className="mt-2 text-sm leading-6 text-navy/55">이미지를 눌러 새 탭에서 크게 확인한 뒤 그대로 승인할지 Canva에서 수정할지 결정하세요.</p>
    <div className="mt-5 grid gap-5 sm:grid-cols-2">{assets.length ? assets.map((asset) => {
      const previewUrl = `/api/admin/marketing/${contentId}/assets/${asset.id}/preview`;
      const hasFailed = failed.has(asset.id);
      return <article key={asset.id} className="overflow-hidden rounded-xl border border-navy/10 bg-cream">
        <div className="flex items-center justify-between px-4 py-3"><strong className="text-gold">{String(asset.position).padStart(2, "0")}</strong><span className="text-xs text-navy/45">{asset.width}×{asset.height}</span></div>
        {hasFailed ? <div className="flex aspect-[4/5] items-center justify-center bg-white px-6 text-center text-sm font-bold text-navy/50">미리보기를 불러오지 못했습니다</div> : <a href={previewUrl} target="_blank" rel="noreferrer" className="block bg-white" aria-label={`${asset.position}번 카드뉴스 크게 보기`}><Image src={previewUrl} alt={`${asset.position}번 카드뉴스`} width={asset.width} height={asset.height} unoptimized onError={() => setFailed((current) => new Set(current).add(asset.id))} className="aspect-[4/5] h-auto w-full object-contain" /></a>}
        <div className="px-4 py-3"><p className="truncate text-sm font-bold" title={asset.filename}>{asset.filename}</p><p className="mt-1 text-xs text-navy/45">{(asset.byteSize / 1024).toFixed(0)}KB</p></div>
      </article>;
    }) : <p className="text-sm text-navy/45">현재 버전에 등록된 이미지가 없습니다.</p>}</div>
  </section>;
}
