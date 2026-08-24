"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminNavigation from "./AdminNavigation";

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/admin/login") return children;

  return (
    <div className="min-h-screen bg-cream text-navy">
      <header className="sticky top-0 z-30 border-b border-navy/10 bg-cream/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs font-black tracking-[.14em] text-teal">CAREER DIRECT KOREA</p>
            <AdminNavigation />
          </div>
          <button
            type="button"
            onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }}
            className="self-start rounded-full border border-navy/15 px-4 py-2 text-sm font-bold hover:bg-white sm:self-auto"
          >
            로그아웃
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
