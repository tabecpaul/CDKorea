"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/admin/callbacks", label: "검사 콜백" },
  { href: "/admin/analytics", label: "전환 분석" },
] as const;

function PendingDot() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full bg-current transition-opacity ${pending ? "animate-pulse opacity-70" : "opacity-0"}`} />;
}

export default function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2" aria-label="관리자 메뉴">
      {sections.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? "bg-navy text-white" : "border border-navy/10 bg-white text-navy hover:border-teal/40 hover:text-teal"}`} aria-current={active ? "page" : undefined}>
            {label}<PendingDot />
          </Link>
        );
      })}
    </nav>
  );
}
