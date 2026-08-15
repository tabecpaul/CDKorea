import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CareerDirectLogo from "@/components/CareerDirectLogo";

export default function PageHeader() {
  return (
    <header className="border-b border-navy/10 bg-cream px-6 py-5 sm:px-10">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Link href="/" aria-label="Career Direct Korea 홈">
          <CareerDirectLogo className="h-7 w-auto" priority />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-navy/60 transition-colors hover:text-navy"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          홈으로
        </Link>
      </div>
    </header>
  );
}
