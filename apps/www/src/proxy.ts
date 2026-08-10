import { NextResponse, type NextRequest } from "next/server";
import {
  OFFICIAL_SITE_URL,
  START_SITE_URL,
  isOfficialHost,
  isOfficialSitePreview,
  isStartHost,
} from "@/features/site-routing/hosts";
import {
  isOfficialPublicPath,
  isStartOwnedPath,
} from "@/features/site-routing/paths";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  const developmentOfficial =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-cdk-site") === "official";

  if (pathname === "/official" || pathname.startsWith("/official/")) {
    const publicPath = pathname.replace(/^\/official/, "") || "/";
    return NextResponse.redirect(new URL(publicPath, OFFICIAL_SITE_URL), 308);
  }

  if (isOfficialHost(host) || isOfficialSitePreview() || developmentOfficial) {
    if (isStartOwnedPath(pathname)) {
      return NextResponse.redirect(
        new URL(`${pathname}${request.nextUrl.search}`, START_SITE_URL),
        308,
      );
    }
    if (isOfficialPublicPath(pathname)) {
      const destination = request.nextUrl.clone();
      destination.pathname = pathname === "/" ? "/official" : `/official${pathname}`;
      return NextResponse.rewrite(destination);
    }
  }

  if (isStartHost(host) && isOfficialPublicPath(pathname) && pathname !== "/") {
    return NextResponse.redirect(
      new URL(`${pathname}${request.nextUrl.search}`, OFFICIAL_SITE_URL),
      308,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|admin|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
