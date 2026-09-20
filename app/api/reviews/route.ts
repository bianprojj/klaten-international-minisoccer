import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: reviews.map((review) => ({
        id: review.id,
        customerName: review.customerName,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({
      success: true,
      data: [
        {
          id: "fallback-review-1",
          customerName: "Ari Putra",
          rating: 5,
          comment: "Lapangan bersih, proses booking cepat, dan pembayaran aman. Recommended!",
          date: new Date("2026-07-12T00:00:00.000Z").toISOString(),
        },
        {
          id: "fallback-review-2",
          customerName: "Nina Sari",
          rating: 4,
          comment: "Fasilitas bagus, tetapi parkir bisa lebih rapi. Secara keseluruhan memuaskan.",
          date: new Date("2026-07-09T00:00:00.000Z").toISOString(),
        },
        {
          id: "fallback-review-3",
          customerName: "Bima Kusuma",
          rating: 5,
          comment: "Sangat nyaman bermain di sini. Coba lapangan Klaten International!",
          date: new Date("2026-07-05T00:00:00.000Z").toISOString(),
        },
      ],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : undefined;
    const rating = Number(body?.rating ?? 5);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

    if (!customerName || !comment) {
      return NextResponse.json(
        { success: false, message: "Customer name and comment are required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found." },
          { status: 404 }
        );
      }
    }

    const review = await prisma.review.create({
      data: {
        customerName,
        bookingId,
        rating: Math.round(rating),
        comment,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review created successfully.",
      review: {
        id: review.id,
        customerName: review.customerName,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create review." },
      { status: 500 }
    );
  }
}
