import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function authorize(request: Request, manage = false) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  if (!admin) return null;
  const allowed = manage
    ? hasAdminPermission(admin, "canManageInvoices")
    : hasAdminPermission(admin, "canReadInvoices") || hasAdminPermission(admin, "canManageInvoices");
  return allowed ? admin : null;
}

export async function GET(request: Request) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const limit = Math.max(Number(url.searchParams.get("limit") ?? 10), 1);
  const status = url.searchParams.get("status") ?? undefined;
  const where: Prisma.InvoiceWhereInput = status ? { status: status as Prisma.InvoiceWhereInput["status"] } : {};
  const [total, data] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({ where, orderBy: { createdAt: "desc" }, include: { booking: true, payment: true }, skip: (page - 1) * limit, take: limit }),
  ]);
  return NextResponse.json({ success: true, data, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) });
}

export async function POST(request: Request) {
  const admin = await authorize(request, true);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const body = await request.json();
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!booking || !payment || payment.bookingId !== booking.id) return NextResponse.json({ success: false, message: "Booking and payment must exist and match." }, { status: 400 });
    const existing = await prisma.invoice.findFirst({ where: { OR: [{ bookingId }, { paymentId }] } });
    if (existing) return NextResponse.json({ success: false, message: "Invoice sudah ada untuk booking/pembayaran ini." }, { status: 409 });
    const subtotal = Math.floor(Number(body.subtotal ?? booking.totalPrice));
    const tax = Math.floor(Number(body.tax ?? 0));
    const discount = Math.floor(Number(body.discount ?? 0));
    const data = await prisma.invoice.create({
      data: {
        invoiceNumber: typeof body.invoiceNumber === "string" && body.invoiceNumber.trim() ? body.invoiceNumber.trim() : `INV-${Date.now()}`,
        bookingId, paymentId, customerName: body.customerName ?? booking.customerName, customerEmail: body.customerEmail ?? booking.customerEmail, customerPhone: body.customerPhone ?? booking.customerPhone,
        subtotal, tax, discount, total: subtotal + tax - discount,
        status: body.status ?? (payment.status === "success" ? "paid" : "issued"), paidAt: payment.status === "success" ? payment.paidAt ?? new Date() : null,
      }, include: { booking: true, payment: true },
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create invoice error:", error);
    return NextResponse.json({ success: false, message: "Unable to create invoice." }, { status: 500 });
  }
}
