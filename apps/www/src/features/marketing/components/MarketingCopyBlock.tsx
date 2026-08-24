export default function MarketingCopyBlock({ label, value }: { label: string; value?: string | null }) {
  return <div><h3 className="text-sm font-black text-navy/60">{label}</h3><p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-cream p-4 text-sm leading-6">{value || "등록된 문안이 없습니다."}</p></div>;
}
