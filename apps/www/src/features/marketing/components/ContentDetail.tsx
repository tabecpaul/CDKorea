import type { getMarketingContent } from "../server/queries";
import AssetUploader from "./AssetUploader";
import ApprovalActions from "./ApprovalActions";
import AssetPreviewGallery from "./AssetPreviewGallery";
import MarketingCopyBlock from "./MarketingCopyBlock";
import NaverPublishingPanel from "./NaverPublishingPanel";

type Detail = NonNullable<Awaited<ReturnType<typeof getMarketingContent>>>;
const channelLabels: Record<string, string> = { naver: "네이버", facebook: "Facebook", instagram: "Instagram", threads: "Threads" };

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="font-bold text-teal underline">{children}</a>;
}

export default function ContentDetail({ detail }: { detail: Detail }) {
  const currentVersion = detail.versions.find((version) => version.id === detail.content.currentVersionId) ?? detail.versions[0] ?? null;
  const currentAssets = currentVersion ? detail.assets.filter((asset) => asset.versionId === currentVersion.id) : [];
  const currentApproval = currentVersion ? detail.approvals.find((approval) => approval.versionId === currentVersion.id) : null;
  const currentNaverSchedule = currentVersion ? detail.schedules.find((schedule) => schedule.versionId === currentVersion.id && schedule.channel === "naver") ?? null : null;
  return <>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[["현재 상태", currentVersion?.status ?? "버전 미등록"], ["현재 버전", currentVersion ? `v${currentVersion.version}` : "—"], ["CTA", detail.content.ctaKind], ["네이버 카테고리", detail.content.naverCategory ?? "미지정"]].map(([label, value]) => <article key={label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-bold text-navy/50">{label}</p><strong className="mt-2 block break-words">{value}</strong></article>)}
    </section>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">현재 승인 대상</h2>{currentVersion?.canvaDesignUrl ? <ExternalLink href={currentVersion.canvaDesignUrl}>Canva에서 보기 ↗</ExternalLink> : null}</div><dl className="mt-5 space-y-4 text-sm"><div><dt className="font-bold text-navy/50">승인 상태</dt><dd className="mt-1 font-semibold">{currentApproval?.status ?? "승인 기록 없음"}</dd></div><div><dt className="font-bold text-navy/50">Drive 패키지</dt><dd className="mt-1 font-semibold">{currentVersion?.driveFolderId ? "연결됨" : "미등록"}</dd></div><div><dt className="font-bold text-navy/50">수정 메모</dt><dd className="mt-1 whitespace-pre-wrap">{currentVersion?.revisionNote ?? "—"}</dd></div></dl></section>

        <AssetPreviewGallery contentId={detail.content.id} version={currentVersion?.version ?? null} assets={currentAssets} />

        <ApprovalActions contentId={detail.content.id} enabled={currentVersion?.status === "review_pending"} />

        <NaverPublishingPanel contentId={detail.content.id} version={currentVersion?.version ?? null} versionStatus={currentVersion?.status ?? null} approvedSnapshotHash={currentVersion?.approvedSnapshotHash ?? null} category={detail.content.naverCategory} ctaKind={detail.content.ctaKind} naverBody={currentVersion?.naverBody ?? null} schedule={currentNaverSchedule} />

        <AssetUploader contentId={detail.content.id} />

        <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><h2 className="text-xl font-black">채널 문안</h2><div className="mt-5 space-y-5"><MarketingCopyBlock label="네이버 원고" value={currentVersion?.naverBody} /><MarketingCopyBlock label="Facebook · Instagram" value={currentVersion?.metaCaption} /><MarketingCopyBlock label="Threads" value={currentVersion?.threadsPosts?.join("\n\n") ?? null} /></div></section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><h2 className="text-xl font-black">채널별 일정</h2><div className="mt-4 space-y-3">{detail.schedules.length ? detail.schedules.map((schedule) => <article key={schedule.id} className="rounded-xl bg-cream p-4"><div className="flex items-center justify-between gap-3"><strong>{channelLabels[schedule.channel] ?? schedule.channel}</strong><span className="text-xs font-bold text-teal">{schedule.status}</span></div><p className="mt-2 text-sm">{schedule.scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · {schedule.mode === "manual" ? "수동" : "자동"}</p><p className="mt-2 break-all text-xs text-navy/45">{schedule.utmUrl}</p>{schedule.publishedUrl ? <p className="mt-2"><ExternalLink href={schedule.publishedUrl}>게시물 열기 ↗</ExternalLink></p> : null}</article>) : <p className="text-sm text-navy/45">등록된 채널 일정이 없습니다.</p>}</div></section>

        <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><h2 className="text-xl font-black">버전 이력</h2><div className="mt-4 space-y-3">{detail.versions.length ? detail.versions.map((version) => <article key={version.id} className={`rounded-xl border p-4 ${version.id === currentVersion?.id ? "border-teal bg-teal/[.05]" : "border-navy/10"}`}><div className="flex justify-between gap-3"><strong>v{version.version}</strong><span className="text-xs font-bold">{version.status}</span></div><p className="mt-2 text-xs text-navy/45">{version.createdAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · {version.createdBy}</p></article>) : <p className="text-sm text-navy/45">버전이 없습니다.</p>}</div></section>
      </div>
    </div>
  </>;
}
