import { NextRequest, NextResponse } from "next/server";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export const MIDTRANS_IS_PRODUCTION = String(process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true";
export const MIDTRANS_SANDBOX_URL = process.env.MIDTRANS_SANDBOX_URL ?? "https://app.sandbox.midtrans.com";
export const MIDTRANS_PRODUCTION_URL = process.env.MIDTRANS_PRODUCTION_URL ?? "https://app.midtrans.com";
export const MIDTRANS_APP_DOMAIN = MIDTRANS_IS_PRODUCTION ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL;
export const MIDTRANS_SNAP_ASSETS_SANDBOX_URL = process.env.MIDTRANS_SNAP_ASSETS_SANDBOX_URL ?? "https://snap-assets.sandbox.midtrans.com";
export const MIDTRANS_SNAP_ASSETS_PRODUCTION_URL = process.env.MIDTRANS_SNAP_ASSETS_PRODUCTION_URL ?? "https://snap-assets.midtrans.com";
export const MIDTRANS_API_SANDBOX_URL = process.env.MIDTRANS_API_SANDBOX_URL ?? "https://api.sandbox.midtrans.com";
export const MIDTRANS_API_PRODUCTION_URL = process.env.MIDTRANS_API_PRODUCTION_URL ?? "https://api.midtrans.com";
export const MIDTRANS_APP_DOMAINS = [`${MIDTRANS_SANDBOX_URL}`, `${MIDTRANS_PRODUCTION_URL}`];
export const MIDTRANS_API_DOMAINS = [`${MIDTRANS_API_SANDBOX_URL}`, `${MIDTRANS_API_PRODUCTION_URL}`];
export const MIDTRANS_SNAP_ASSETS_DOMAINS = [`${MIDTRANS_SNAP_ASSETS_SANDBOX_URL}`, `${MIDTRANS_SNAP_ASSETS_PRODUCTION_URL}`];
export const MIDTRANS_CSP_HOSTS = [
  "https://*.midtrans.com",
  "https://*.sandbox.midtrans.com",
  "https://*.gopayapi.com",
  ...MIDTRANS_APP_DOMAINS,
  ...MIDTRANS_SNAP_ASSETS_DOMAINS,
  ...MIDTRANS_API_DOMAINS,
];

// Google Tag Manager + GA4 measurement hosts (wajib ada agar tag tidak diblokir CSP).
export const GOOGLE_MEASUREMENT_CSP_HOSTS = [
  "https://www.googletagmanager.com",
  "https://tagmanager.google.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://analytics.google.com",
  "https://*.analytics.google.com",
  "https://stats.g.doubleclick.net",
  "https://www.google.com",
];

function getEnv(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

export function isBookingPaymentPath(pathname: string) {
  return /^\/booking\/[^/]+\/payment\/?$/.test(pathname);
}

export function validatePaymentRouteCsp(csp: string, pathname: string) {
  if (!isBookingPaymentPath(pathname)) {
    return;
  }

  const requiredSources = [...MIDTRANS_APP_DOMAINS, ...MIDTRANS_SNAP_ASSETS_DOMAINS, ...MIDTRANS_API_DOMAINS];
  const missing = requiredSources.filter((source) => !csp.includes(source));

  if (missing.length > 0) {
    console.warn(
      `[security] Booking payment route CSP is missing required Midtrans sources: ${missing.join(", ")}`,
    );
  }

  if (!/script-src-elem/.test(csp)) {
    console.warn(
      '[security] Booking payment route CSP is missing script-src-elem; embedded script loads could be blocked.',
    );
  }
}

export function getRateLimitResult(identifier: string, limit = Number(getEnv("RATE_LIMIT_MAX", "60")), windowMs = Number(getEnv("RATE_LIMIT_WINDOW_MS", "60000"))): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || existing.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(identifier, next);
    return { allowed: true, remaining: limit - 1, resetAt: next.resetAt, limit };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, limit };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt, limit };
}

export function applySecurityHeaders(response: NextResponse, request?: NextRequest) {
  const isPaymentPage = request
    ? isBookingPaymentPath(request.nextUrl.pathname) || /\/payment(?:\/|$)/.test(request.nextUrl.pathname)
    : false;

  const defaultCsp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${MIDTRANS_CSP_HOSTS.join(" ")} ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://o.alicdn.com https://g.alicdn.com`,
    `script-src-elem 'self' 'unsafe-inline' ${MIDTRANS_CSP_HOSTS.join(" ")} ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://o.alicdn.com https://g.alicdn.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
    `img-src 'self' data: ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://res.cloudinary.com`,
    `connect-src 'self' ${MIDTRANS_CSP_HOSTS.join(" ")} ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://*.midtrans.com https://*.gopayapi.com`,
    "frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org https://*.midtrans.com",
    "child-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const paymentCsp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${MIDTRANS_CSP_HOSTS.join(" ")} ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://o.alicdn.com https://g.alicdn.com`,
    `script-src-elem 'self' 'unsafe-inline' ${MIDTRANS_CSP_HOSTS.join(" ")} ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://o.alicdn.com https://g.alicdn.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${MIDTRANS_SNAP_ASSETS_DOMAINS.join(" ")} ${MIDTRANS_APP_DOMAINS.join(" ")}`,
    `style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${MIDTRANS_SNAP_ASSETS_DOMAINS.join(" ")} ${MIDTRANS_APP_DOMAINS.join(" ")}`,
    `img-src 'self' data: ${MIDTRANS_SNAP_ASSETS_DOMAINS.join(" ")} ${MIDTRANS_APP_DOMAINS.join(" ")} ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://pay.google.com https://g.alicdn.com https://res.cloudinary.com`,
    `connect-src 'self' ${MIDTRANS_CSP_HOSTS.join(" ")} ${GOOGLE_MEASUREMENT_CSP_HOSTS.join(" ")} https://pay.google.com`,
    `frame-src ${MIDTRANS_CSP_HOSTS.join(" ")} https://www.google.com https://maps.google.com https://www.openstreetmap.org`,
    `child-src ${MIDTRANS_CSP_HOSTS.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const csp = isPaymentPage ? paymentCsp.join("; ") : defaultCsp.join("; ");

  validatePaymentRouteCsp(csp, request?.nextUrl.pathname ?? "");

  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("x-xss-protection", "1; mode=block");

  if (request?.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production") {
    response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

export function sanitizeString(value: string) {
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(value: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") {
      result[key] = sanitizeString(item);
    } else if (Array.isArray(item)) {
      result[key] = item.map((entry) => (typeof entry === "string" ? sanitizeString(entry) : entry));
    } else if (item && typeof item === "object") {
      result[key] = sanitizeObject(item as Record<string, unknown>);
    } else {
      result[key] = item;
    }
  }
  return result as T;
}

interface CookieOptions {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
}

export function setSecureCookie(response: NextResponse, name: string, value: string, options: CookieOptions = {}) {
  const secure = options.secure ?? ((process.env.COOKIE_SECURE === "true") || (process.env.NODE_ENV === "production"));
  response.cookies.set(name, value, {
    path: options.path ?? "/",
    httpOnly: options.httpOnly ?? true,
    secure,
    sameSite: options.sameSite ?? "lax",
    maxAge: options.maxAge ?? 60 * 60 * 8,
  });
}

export function clearSecureCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}
