import { NextRequest, NextResponse } from "next/server";

const locales = ["ar", "en", "de"] as const;
const defaultLocale = "ar";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!pathnameHasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;

    const response = NextResponse.redirect(url);

    response.cookies.set("VIA7-language", defaultLocale, {
      path: "/",
      sameSite: "lax",
    });

    return response;
  }

  const locale = pathname.split("/")[1];

  const pathnameWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathnameWithoutLocale;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set("VIA7-language", locale, {
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};