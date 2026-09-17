import { NextResponse } from "next/server";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

async function authorize(request: Request, manage = false) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : "";
  const admin = await getAuthenticatedAdminFromToken(token);
  if (!admin) return null;
  const allowed = manage
    ? hasAdminPermission(admin, "canManageFields")
    : hasAdminPermission(admin, "canReadFields") || hasAdminPermission(admin, "canManageFields");
  return allowed ? admin : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await authorize(request);
    if (!admin) return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });

    const { id } = await params;
    const slot = await prisma.scheduleSlot.findUnique({ where: { id } });
    if (!slot) return NextResponse.json({ success: false, message: "Schedule slot not found." }, { status: 404 });

    return NextResponse.json({ success: true, data: slot });
  } catch (error) {
    console.error("[ADMIN] Get schedule slot error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve schedule slot." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await authorize(request, true);
    if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
    const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";
    const price = Number(body.price);
    const isActive = body.isActive !== false;
    const sortOrder = Number(body.sortOrder ?? 0);

    if (!startTime || !endTime || Number.isNaN(price)) {
      return NextResponse.json({ success: false, message: "startTime, endTime, and price are required." }, { status: 400 });
    }

    const slot = await prisma.scheduleSlot.update({
      where: { id },
      data: { startTime, endTime, price, isActive, sortOrder },
    });

    return NextResponse.json({ success: true, data: slot });
  } catch (error) {
    console.error("[ADMIN] Update schedule slot error:", error);
    return NextResponse.json({ success: false, message: "Unable to update schedule slot." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await authorize(request, true);
    if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const { id } = await params;
    await prisma.scheduleSlot.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Schedule slot deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete schedule slot error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete schedule slot." }, { status: 500 });
  }
}