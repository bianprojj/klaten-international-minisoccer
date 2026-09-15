import { NextResponse } from "next/server";
import { DEFAULT_FIELD } from "@/lib/venue";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const slot = await prisma.scheduleSlot.findFirst({ orderBy: { sortOrder: "asc" } });
    const price = slot && typeof slot.price === "number" ? slot.price : DEFAULT_FIELD.price;
    return NextResponse.json({ success: true, data: [{ ...DEFAULT_FIELD, price }] });
  } catch (error) {
    console.error("[API] Unable to load field price:", error);
    return NextResponse.json({ success: true, data: [{ ...DEFAULT_FIELD, price: DEFAULT_FIELD.price }] });
  }
}
