import { NextResponse } from "next/server";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function parseDateParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mondayOf(date: Date): Date {
  const copy = new Date(date);
  const diff = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - diff);
  return copy;
}

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
  if (!hasAdminPermission(admin, "canReadBookings") && !hasAdminPermission(admin, "canManageBookings")) {
    return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 7) || 7, 1), 14);
    const startParam = parseDateParam(url.searchParams.get("start"));
    const start = mondayOf(startParam ?? new Date());
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);

    const [slots, bookings] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
        select: { id: true, startTime: true, endTime: true, dayOfWeek: true, price: true, sortOrder: true },
      }),
      prisma.booking.findMany({
        where: { bookingDate: { gte: start, lt: end } },
        orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
        select: {
          id: true,
          customerName: true,
          bookingDate: true,
          startTime: true,
          endTime: true,
          status: true,
          totalPrice: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      start: start.toISOString().slice(0, 10),
      days,
      slots,
      bookings: bookings.map((b) => ({
        id: b.id,
        customerName: b.customerName,
        bookingDate: b.bookingDate.toISOString(),
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        totalPrice: b.totalPrice,
      })),
    });
  } catch (error) {
    console.error("[ADMIN] Schedule board error:", error);
    return NextResponse.json({ success: false, message: "Unable to load schedule board." }, { status: 500 });
  }
}
