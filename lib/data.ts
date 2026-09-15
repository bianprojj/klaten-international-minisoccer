import type { Field } from "@/types";
import { prisma } from "@/lib/prisma";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/booking-engine";
import { formatJakartaDateKey } from "@/lib/timezone";
import { DEFAULT_FIELD_NAME, DEFAULT_FIELD } from "@/lib/venue";
import { facilityImages, getFallbackReviews } from "@/lib/mock-data";
import { FALLBACK_REMOTE_IMAGES, getSafeRemoteImageUrl, normalizeRemoteImageUrl } from "@/lib/remote-image";
import type { FacilityImage, VenueGalleryImage } from "@/types";

export async function getFields(): Promise<Field[]> {
  try {
    const slot = await prisma.scheduleSlot.findFirst({ orderBy: { sortOrder: "asc" } });
    const price = slot && typeof slot.price === "number" ? slot.price : DEFAULT_FIELD.price;
    return [{ ...DEFAULT_FIELD, price }];
  } catch (error) {
    console.error("[DATA] Unable to load default slot price:", error);
    return [{ ...DEFAULT_FIELD, price: DEFAULT_FIELD.price }];
  }
}

export async function getVenueFeatures(): Promise<FacilityImage[]> {
  try {
    const records = await prisma.venueFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const activeRecords: Array<{
      id: string;
      name: string;
      description: string;
      imageUrl: string;
      isActive: boolean;
      sortOrder: number;
    }> = records.filter(
      (feature: { imageUrl?: string | null }) => {
        const value = normalizeRemoteImageUrl(feature.imageUrl);
        return value.length > 0;
      },
    );

    if (activeRecords.length > 0) {
      return activeRecords.map((feature, index) => ({
        id: feature.id,
        title: feature.name,
        description: feature.description,
        imageUrl: getSafeRemoteImageUrl(feature.imageUrl, FALLBACK_REMOTE_IMAGES, index),
        isActive: feature.isActive,
        sortOrder: feature.sortOrder,
      }));
    }

    return facilityImages.map((facility, index) => ({
      ...facility,
      imageUrl: getSafeRemoteImageUrl(facility.imageUrl, FALLBACK_REMOTE_IMAGES, index),
    }));
  } catch (error) {
    console.error("[DATA] Unable to load venue features:", error);
    return facilityImages;
  }
}

export async function getVenueGallery(): Promise<VenueGalleryImage[]> {
  const fallback = facilityImages.map((image, index) => ({
    id: image.id ?? `fallback-gallery-${index}`,
    title: image.title,
    imageUrl: image.imageUrl,
    sortOrder: index,
    isActive: true,
  }));
  try {
    const records = await prisma.venueGallery.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    const activeRecords: Array<{ id: string; title: string; imageUrl: string; sortOrder: number; isActive: boolean }> = records.filter(
      (image: { imageUrl?: string | null }) => {
        const value = normalizeRemoteImageUrl(image.imageUrl);
        return value.length > 0;
      },
    );
    return activeRecords.length > 0
      ? activeRecords.map((image, index) => ({ ...image, imageUrl: getSafeRemoteImageUrl(image.imageUrl, FALLBACK_REMOTE_IMAGES, index) }))
      : fallback.map((image, index) => ({ ...image, imageUrl: getSafeRemoteImageUrl(image.imageUrl, FALLBACK_REMOTE_IMAGES, index) }));
  } catch (error) {
    console.error("[DATA] Unable to load venue gallery:", error);
    return fallback;
  }
}

export async function getUpcomingBookings(limit = 5) {
  return prisma.booking.findMany({
    where: {
      status: {
        in: BLOCKING_BOOKING_STATUSES,
      },
      bookingDate: {
        gte: new Date(),
      },
    },
    orderBy: [
      { bookingDate: "asc" },
      { startTime: "asc" },
    ],
    take: limit,
  });
}

export async function getReviews(): Promise<import("@/types").Review[]> {
  try {
    const records = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map((r: { id: string; customerName: string; rating: number | string; comment: string; createdAt: Date }) => ({
      id: r.id,
      customerName: r.customerName,
      rating: Number(r.rating),
      comment: r.comment,
      date: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("[DATA] Unable to load reviews from database:", error);
    return getFallbackReviews();
  }
}

export type BookedSlot = {
  date: string;
  time: string;
  field: string;
  status: string;
};

export function mapBookingsToSlots(bookings: Array<{ bookingDate: Date; startTime: string; endTime: string; status: string }>): BookedSlot[] {
  return bookings.map((booking) => ({
    date: formatJakartaDateKey(booking.bookingDate),
    time: `${booking.startTime} - ${booking.endTime}`,
    field: DEFAULT_FIELD_NAME,
    status: booking.status === "pending" ? "Booked" : booking.status,
  }));
}
