import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EVERYDAY_VALUE, normalizeDayOfWeek } from "@/lib/booking-engine";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function authorize(request: Request, manage = false) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  if (!admin) return null;
  const allowed = manage ? hasAdminPermission(admin, "canManageSchedule") : hasAdminPermission(admin, "canManageSchedule");
  return allowed ? admin : null;
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return hour * 60 + minute;
}

function validateScheduleSlotData(data: Record<string, unknown>) {
  const startTime = typeof data.startTime === "string" ? data.startTime.trim() : "";
  const endTime = typeof data.endTime === "string" ? data.endTime.trim() : "";
  const dayOfWeek = normalizeDayOfWeek(data.dayOfWeek) ?? EVERYDAY_VALUE;
  const price = Number(data.price ?? 0);
  const isActive = typeof data.isActive === "boolean" ? data.isActive : true;
  const sortOrder = Number.isInteger(Number(data.sortOrder)) ? Number(data.sortOrder) : 0;

  if (!startTime || !endTime) {
    return { valid: false, message: "startTime and endTime are required." };
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
    return { valid: false, message: "startTime and endTime must be valid times with endTime after startTime." };
  }

  if (Number.isNaN(price) || price < 0) {
    return { valid: false as const, message: "price must be a non-negative number." };
  }

  return { valid: true as const, startTime, endTime, dayOfWeek, price, isActive, sortOrder };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  }

  const paramsResolved = await params;
  const id = paramsResolved.id;
  const data = await prisma.scheduleSlot.findUnique({ where: { id } });
  if (!data) {
    return NextResponse.json({ success: false, message: "Schedule slot not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request, true);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  }

  try {
    const paramsResolved = await params;
    const id = paramsResolved.id;
    const body = await request.json();
    const result = validateScheduleSlotData(body);
    if (!result.valid) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    const data = await prisma.scheduleSlot.update({
      where: { id },
      data: {
        startTime: result.startTime,
        endTime: result.endTime,
        dayOfWeek: result.dayOfWeek,
        price: result.price,
        isActive: result.isActive,
        sortOrder: result.sortOrder,
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[ADMIN] Update schedule slot error:", error);
    return NextResponse.json({ success: false, message: "Unable to update schedule slot." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request, true);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  }

  try {
    const paramsResolved = await params;
    const id = paramsResolved.id;
    await prisma.scheduleSlot.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Schedule slot deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete schedule slot error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete schedule slot." }, { status: 500 });
  }
}
