import type { ReactNode } from "react";
import OfficialHeader from "@/features/official-site/components/OfficialHeader";
import OfficialFooter from "@/features/official-site/components/OfficialFooter";

export default function OfficialLayout({ children }: { children: ReactNode }) {
  return <><OfficialHeader /><main>{children}</main><OfficialFooter /></>;
}
