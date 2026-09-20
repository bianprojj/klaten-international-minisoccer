import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedAdmin, hasAdminPermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
  }

  if (!hasAdminPermission(admin, "canViewReports")) {
    return NextResponse.json({ success: false, message: "Insufficient admin privileges." }, { status: 403 });
  }

  const csv = [
    "date,bookings,revenue",
    "2026-07-07,24,1800000",
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=admin-report.csv",
    },
  });
}
