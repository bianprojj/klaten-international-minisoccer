import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function GET(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadPayments") && !hasAdminPermission(admin, "canManagePayments")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }
    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
    const limit = Math.max(Number(url.searchParams.get("limit") || "6"), 1);
    const q = (url.searchParams.get("q") || "").trim();
    const bookingId = url.searchParams.get("bookingId") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {};
    if (q) where.OR = [{ transactionId: { contains: q, mode: "insensitive" } }];
    if (bookingId) where.bookingId = bookingId;
    if (status) where.status = status;

    const total = await prisma.payment.count({ where });
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: { select: { id: true, customerName: true, customerPhone: true, bookingDate: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return NextResponse.json({ success: true, data: payments, total, page, limit, totalPages });
  } catch (error) {
    console.error("[ADMIN] Payment list error:", error);
    return NextResponse.json({ success: false, message: "Unable to list payments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManagePayments")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const body = await request.json();
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
    const rawTransactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : "";
    // transactionId auto-generated when left empty (cash/manual reconciliation).
    const transactionId = rawTransactionId || `CASH-${bookingId.substring(0, 8)}-${Date.now()}`;
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount ?? 0);
    const status = typeof body.status === "string" ? body.status : "pending";
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "Midtrans";
    const provider = typeof body.provider === "string" ? body.provider : "Midtrans";

    if (!bookingId || amount <= 0) {
      return NextResponse.json({ success: false, message: "Missing required payment details." }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        transactionId,
        amount: Math.floor(amount),
        paymentMethod,
        provider,
        status,
        paidAt: status === "success" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create payment error:", error);
    return NextResponse.json({ success: false, message: "Unable to create payment." }, { status: 500 });
  }
}
