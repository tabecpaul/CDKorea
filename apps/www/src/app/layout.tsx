import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.careerdirect.kr"),
  title: { default: "Career Direct Korea", template: "%s" },
  description:
    "진로는 직업을 찾는 것이 아니라 하나님이 지으신 나를 발견하고 소명을 분별하는 과정입니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Career Direct Korea",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Career Direct Korea" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
