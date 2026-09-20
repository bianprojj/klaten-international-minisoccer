import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

// POST /api/referrals/validate
// Body: { code: string, subtotal?: number }
// Response: { success, valid, code?, percent?, discount?, message? }
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    const subtotal =
      typeof body?.subtotal === "number" && Number.isFinite(body.subtotal) && body.subtotal > 0
        ? Math.floor(body.subtotal)
        : 0;

    if (!code) {
      return noStore(
        NextResponse.json({ success: false, valid: false, message: "Masukkan kode referral dulu." }, { status: 400 })
      );
    }

    const referral = await prisma.referralCode.findUnique({ where: { code } });

    if (!referral || !referral.isActive) {
      return noStore(
        NextResponse.json({ success: true, valid: false, message: "Kode referral tidak valid." })
      );
    }

    const percent = Math.max(0, referral.percent ?? 0);
    const discount = subtotal > 0 ? Math.min(Math.round((subtotal * percent) / 100), subtotal) : 0;

    return noStore(
      NextResponse.json({
        success: true,
        valid: true,
        code: referral.code,
        percent,
        discount,
        message: `Kode ${referral.code} dipakai: diskon ${percent}%.`,
      })
    );
  } catch (error) {
    console.error("[API] Referral validate error:", error instanceof Error ? error.message : String(error));
    return noStore(
      NextResponse.json({ success: false, valid: false, message: "Gagal memeriksa kode. Coba lagi." }, { status: 500 })
    );
  }
}
