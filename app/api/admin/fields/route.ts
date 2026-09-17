import { NextResponse } from "next/server";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { DEFAULT_FIELD } from "@/lib/venue";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadFields") && !hasAdminPermission(admin, "canManageFields")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const slots = await prisma.scheduleSlot.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const fields = slots.map((slot, index) => ({
      ...DEFAULT_FIELD,
      id: slot.id,
      name: `Slot ${slot.startTime} - ${slot.endTime}`,
      price: slot.price,
      sortOrder: slot.sortOrder,
      isActive: slot.isActive,
    }));

    return NextResponse.json({
      success: true,
      data: fields,
      total: fields.length,
      page: 1,
      limit: fields.length,
      totalPages: 1,
    });
  } catch (error) {
    console.error("[ADMIN] Error listing fields:", error);
    return NextResponse.json({ success: false, message: "Unable to list fields." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const body = await request.json();

    const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
    const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";
    const price = Number(body.price);
    const isActive = body.isActive !== false;
    const sortOrder = Number(body.sortOrder ?? 0);

    if (!startTime || !endTime || Number.isNaN(price)) {
      return NextResponse.json({ success: false, message: "startTime, endTime, and price are required." }, { status: 400 });
    }

    const slot = await prisma.scheduleSlot.create({
      data: { startTime, endTime, price, isActive, sortOrder },
    });

    return NextResponse.json({ success: true, data: slot }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create schedule slot error:", error);
    return NextResponse.json({ success: false, message: "Unable to create schedule slot." }, { status: 500 });
  }
}