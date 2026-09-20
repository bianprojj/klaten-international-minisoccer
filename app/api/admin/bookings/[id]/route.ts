import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadBookings") && !hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: paramsResolved.id },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!booking) return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("[ADMIN] Get booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve booking." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.notes === "string") updates.notes = body.notes;
    if (typeof body.customerName === "string") updates.customerName = body.customerName;
    if (typeof body.customerPhone === "string") updates.customerPhone = body.customerPhone;
    if (typeof body.customerEmail === "string") updates.customerEmail = body.customerEmail;

    const updated = await prisma.booking.update({ where: { id: paramsResolved.id }, data: updates });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN] Update booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to update booking." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    await prisma.booking.delete({ where: { id: paramsResolved.id } });
    return NextResponse.json({ success: true, message: "Booking deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete booking." }, { status: 500 });
  }
}
