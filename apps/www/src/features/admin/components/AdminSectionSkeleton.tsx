export default function AdminSectionSkeleton({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-5 py-8 sm:px-8" aria-busy="true" aria-label={`${label} 불러오는 중`}>
      <div className="h-4 w-36 rounded-full bg-navy/10" />
      <div className="mt-4 h-10 w-64 max-w-full rounded-xl bg-navy/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-2xl border border-navy/5 bg-white/80" />)}
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-navy/10 bg-white/80 p-5">
        {Array.from({ length: rows }, (_, index) => <div key={index} className="mb-4 h-10 rounded-xl bg-navy/[.06] last:mb-0" />)}
      </div>
    </div>
  );
}
