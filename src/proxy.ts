import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIX = [
  "/users",
  "/jobs",
  "/system",
  "/overview",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname === "/" ||
    PROTECTED_PREFIX.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has("admin_token");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
