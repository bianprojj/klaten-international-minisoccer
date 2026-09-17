import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission, validatePasswordComplexity } from "@/lib/admin-auth";

function tokenFrom(request: Request) { const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/); return match ? decodeURIComponent(match[1]) : ""; }
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
async function authorize(request: Request) { const admin = await getAuthenticatedAdminFromToken(tokenFrom(request)); return admin && hasAdminPermission(admin, "canManageAdmins") ? admin : null; }
const select = { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true } as const;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  const { id } = await params; const data = await prisma.adminUser.findUnique({ where: { id }, select });
  return data ? NextResponse.json({ success: true, data }) : NextResponse.json({ success: false, message: "Admin user not found." }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const { id } = await params; const body = await request.json(); const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.email === "string") data.email = body.email.trim().toLowerCase();
    if (body.role === "super_admin" || body.role === "manager" || body.role === "staff") data.role = body.role;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.password === "string" && body.password.length > 0) {
      const passwordValidation = validatePasswordComplexity(body.password);
      if (!passwordValidation.valid) {
        return NextResponse.json({ success: false, message: "Password does not meet complexity requirements.", errors: passwordValidation.errors }, { status: 400 });
      }
      data.passwordHash = await hashPassword(body.password);
    }
    const updated = await prisma.adminUser.update({ where: { id }, data, select });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) { console.error("[ADMIN] Update admin user error:", error); return NextResponse.json({ success: false, message: "Unable to update admin user." }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try { const { id } = await params; if (id === admin.id) return NextResponse.json({ success: false, message: "You cannot delete your own account." }, { status: 400 }); await prisma.adminUser.delete({ where: { id } }); return NextResponse.json({ success: true, message: "Admin user deleted." }); }
  catch (error) { console.error("[ADMIN] Delete admin user error:", error); return NextResponse.json({ success: false, message: "Unable to delete admin user." }, { status: 500 }); }
}
