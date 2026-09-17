import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders, getRateLimitResult } from "./lib/security-headers";

function decodeJwtPayload(token: string) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = payload.length % 4;
    const normalized = padding ? payload + "=".repeat(4 - padding) : payload;
    const decoded = globalThis.atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function normalizeAdminRole(role: string) {
  const normalized = role.toLowerCase();
  if (normalized === "manager") return "manager";
  if (normalized === "super_admin") return "super_admin";
  return "staff";
}

function getPanelLoginPath(role: string) {
  const normalizedRole = normalizeAdminRole(role);
  if (normalizedRole === "manager") return "/manager/login";
  if (normalizedRole === "super_admin") return "/superadmin/login";
  return "/staff/login";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const rateLimit = getRateLimitResult(`global:${ip}`);

  if (!rateLimit.allowed) {
    const response = NextResponse.json({ success: false, message: "Too many requests." }, { status: 429 });
    return applySecurityHeaders(response, request);
  }

  const isProtectedPanelRoute =
    (pathname.startsWith("/staff") && !pathname.startsWith("/staff/login")) ||
    (pathname.startsWith("/manager") && !pathname.startsWith("/manager/login")) ||
    (pathname.startsWith("/superadmin") && !pathname.startsWith("/superadmin/login"));
  const isAdminApiRoute = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login") && !pathname.startsWith("/api/admin/csrf");

  if (isProtectedPanelRoute || isAdminApiRoute) {
    const token = request.cookies.get("admin-session")?.value;
    const requestedPanel = pathname.startsWith("/staff")
      ? "staff"
      : pathname.startsWith("/manager")
      ? "manager"
      : "super_admin";

    if (!token) {
      if (isProtectedPanelRoute) {
        const redirectUrl = new URL(
          requestedPanel === "staff"
            ? "/staff/login"
            : requestedPanel === "manager"
            ? "/manager/login"
            : "/superadmin/login",
          request.url,
        );
        return NextResponse.redirect(redirectUrl);
      }

      const response = NextResponse.json({ success: false, message: "Admin session not found or expired." }, { status: 401 });
      return applySecurityHeaders(response, request);
    }

    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.role !== "string") {
      if (isProtectedPanelRoute) {
        const redirectUrl = new URL(
          requestedPanel === "staff"
            ? "/staff/login"
            : requestedPanel === "manager"
            ? "/manager/login"
            : "/superadmin/login",
          request.url,
        );
        return NextResponse.redirect(redirectUrl);
      }

      const response = NextResponse.json({ success: false, message: "Invalid admin session." }, { status: 401 });
      return applySecurityHeaders(response, request);
    }

    const normalizedRole = normalizeAdminRole(payload.role);
    if (isProtectedPanelRoute && normalizedRole !== requestedPanel) {
      const redirectUrl = new URL(getPanelLoginPath(normalizedRole), request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  const response = NextResponse.next();
  const isPublicPage = pathname === "/" || pathname.startsWith("/book") || pathname.startsWith("/booking") || pathname.startsWith("/payment");

  if (isPublicPage) {
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  }

  response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
  response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
  response.headers.set("x-ratelimit-reset", String(rateLimit.resetAt));
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
