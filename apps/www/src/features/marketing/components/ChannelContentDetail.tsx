import Link from "next/link";
import type { getMarketingContent } from "../server/queries";
import type { MarketingChannel } from "../domain";
import AssetPreviewGallery from "./AssetPreviewGallery";
import ChannelScheduleSummary from "./ChannelScheduleSummary";
import MarketingCopyBlock from "./MarketingCopyBlock";
import NaverPublishingPanel from "./NaverPublishingPanel";

type Detail = NonNullable<Awaited<ReturnType<typeof getMarketingContent>>>;
type Schedule = Detail["schedules"][number];
const channelLabels: Record<MarketingChannel, string> = { naver: "네이버", facebook: "Facebook", instagram: "Instagram", threads: "Threads" };

export default function ChannelContentDetail({ detail, channel, schedule }: { detail: Detail; channel: MarketingChannel; schedule: Schedule }) {
  const currentVersion = detail.versions.find((version) => version.id === detail.content.currentVersionId) ?? null;
  const currentAssets = currentVersion ? detail.assets.filter((asset) => asset.versionId === currentVersion.id) : [];
  if (!currentVersion) return null;
  const usesCards = channel !== "threads";
  return <div className="space-y-6">
    <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black tracking-[.14em] text-gold">{channelLabels[channel].toUpperCase()} CHANNEL</p><h2 className="mt-2 text-2xl font-black">{channelLabels[channel]} 발행 자료</h2></div><Link href={`/admin/marketing/${detail.content.id}`} className="text-sm font-bold text-teal underline">전체 콘텐츠 검토</Link></div><p className="mt-3 text-sm text-navy/55">현재 승인 대상 v{currentVersion.version}의 선택 채널 자료만 표시합니다. 수정과 최종 승인은 전체 콘텐츠 검토에서 진행하세요.</p></section>

    <ChannelScheduleSummary channel={channel} schedule={schedule} />

    {usesCards ? <AssetPreviewGallery contentId={detail.content.id} version={currentVersion.version} assets={currentAssets} /> : <section className="rounded-2xl border border-teal/20 bg-teal/[.06] p-5 text-sm font-bold text-teal sm:p-6">Threads는 현재 이미지 없이 문안으로 발행합니다.</section>}

    <section className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><h2 className="text-xl font-black">{channelLabels[channel]} 문안</h2><div className="mt-5">{channel === "naver" ? <MarketingCopyBlock label="네이버 원고" value={currentVersion.naverBody} /> : channel === "threads" ? <MarketingCopyBlock label="Threads" value={currentVersion.threadsPosts?.join("\n\n") ?? null} /> : <MarketingCopyBlock label="Facebook · Instagram" value={currentVersion.metaCaption} />}</div></section>

    {channel === "naver" ? <NaverPublishingPanel contentId={detail.content.id} version={currentVersion.version} versionStatus={currentVersion.status} approvedSnapshotHash={currentVersion.approvedSnapshotHash} category={detail.content.naverCategory} ctaKind={detail.content.ctaKind} naverBody={currentVersion.naverBody} assets={currentAssets} schedule={schedule} /> : null}
  </div>;
}
