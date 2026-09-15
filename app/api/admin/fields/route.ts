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

    const slot = await prisma.scheduleSlot.findFirst({ orderBy: { sortOrder: "asc" } });
    const price = slot && typeof slot.price === "number" ? slot.price : DEFAULT_FIELD.price;
    return NextResponse.json({
      success: true,
      data: [{ ...DEFAULT_FIELD, price }],
      total: 1,
      page: 1,
      limit: 1,
      totalPages: 1,
    });
  } catch (error) {
    console.error("[ADMIN] Error listing fields:", error);
    return NextResponse.json({ success: false, message: "Unable to list fields." }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, message: "Field creation is disabled for this single-venue deployment." }, { status: 410 });
}
