import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, validatePasswordComplexity } from "@/lib/admin-auth";
import { applySecurityHeaders } from "@/lib/security-headers";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: "New passwords do not match." }, { status: 400 });
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ success: false, message: "Password does not meet complexity requirements.", errors: passwordValidation.errors }, { status: 400 });
    }

    // Verify current password
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: admin.id },
      select: { passwordHash: true },
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and set mustChangePassword to false
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error("[ADMIN] Password change error:", error);
    return NextResponse.json({ success: false, message: "Unable to change password." }, { status: 500 });
  }
}