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

type ScheduleSlotValidationResult =
  | { valid: false; message: string }
  | { valid: true; startTime: string; endTime: string; dayOfWeek: string; price: number; isActive: boolean; sortOrder: number };

function validateScheduleSlotData(data: Record<string, unknown>): ScheduleSlotValidationResult {
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
    return { valid: false, message: "price must be a non-negative number." };
  }

  return { valid: true, startTime, endTime, dayOfWeek, price, isActive, sortOrder };
}

export async function GET(request: Request) {
  const admin = await authorize(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  }

  const data = await prisma.scheduleSlot.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const admin = await authorize(request, true);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = validateScheduleSlotData(body);
    if (!result.valid) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    const data = await prisma.scheduleSlot.create({
      data: {
        startTime: result.startTime,
        endTime: result.endTime,
        dayOfWeek: result.dayOfWeek,
        price: result.price,
        isActive: result.isActive,
        sortOrder: result.sortOrder,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create schedule slot error:", error);
    return NextResponse.json({ success: false, message: "Unable to create schedule slot." }, { status: 500 });
  }
}
