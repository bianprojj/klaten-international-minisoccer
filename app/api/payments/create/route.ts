import { NextResponse } from "next/server";
import { createPaymentTransaction } from "@/lib/payment-service";
import { getRateLimitResult } from "@/lib/security-headers";

const ALLOWED_HOSTS = new Set([
  "klaten-international-minisoccer.vercel.app",
  "klatenminisoccer.web.id",
  "www.klatenminisoccer.web.id",
  "localhost:3000",
  "127.0.0.1:3000",
]);

function resolveAppBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (forwardedHost && ALLOWED_HOSTS.has(forwardedHost)) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(/:$/, "");
    return `${forwardedProto}://${forwardedHost}`;
  }
  return "https://klaten-international-minisoccer.vercel.app";
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimit = getRateLimitResult(`payment-create:${ip}`, 20, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many payment requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const appBaseUrl = resolveAppBaseUrl(request);

    const result = await createPaymentTransaction({
      bookingId: typeof body?.bookingId === "string" ? body.bookingId : "",
      amount: typeof body?.amount === "number" ? body.amount : 0,
      paymentMethod: typeof body?.paymentMethod === "string" ? body.paymentMethod : "Midtrans",
      customerName: typeof body?.customerName === "string" ? body.customerName : "Guest",
      email: typeof body?.email === "string" ? body.email : undefined,
      phone: typeof body?.phone === "string" ? body.phone : undefined,
      appBaseUrl,
    });

    const snapUrl = typeof result === 'object' && result !== null && 'snapUrl' in result ? (result as Record<string, unknown>).snapUrl : null;
    const snapToken = typeof result === 'object' && result !== null && 'snapToken' in result ? (result as Record<string, unknown>).snapToken : null;
    
    return NextResponse.json({
      success: true,
      transaction: result,
      snapUrl,
      snapToken,
    }, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[API] Payment creation error:", {
      message: errorMsg,
      timestamp: new Date().toISOString(),
    });

    const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { success: false, message: isTimeout ? "Payment gateway timeout. Silakan coba lagi." : `Payment error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
