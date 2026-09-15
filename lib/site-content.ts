import { prisma } from "@/lib/prisma";
import { siteContent } from "@/lib/mock-data";
import { FALLBACK_REMOTE_IMAGES, getSafeRemoteImageUrl, normalizeRemoteImageUrl } from "@/lib/remote-image";
import { getDefaultFieldPrice } from "@/lib/venue";
import type { SiteContent } from "@/types";

export const SITE_CONTENT_KEYS = [
  "locationLabel",
  "heroTitle",
  "heroSubtitle",
  "ctaPrimary",
  "ctaSecondary",
  "backgroundImageUrl",
] as const;

export async function getSlotPriceForTime(startTime: string) {
  try {
    const slot = await prisma.scheduleSlot.findFirst({ where: { startTime } });
    if (!slot) return null;
    return typeof slot.price === "number" ? slot.price : null;
  } catch (error) {
    console.error("[SETTINGS] Unable to load slot price:", error);
    return null;
  }
}

export async function getSlotPricesInRange(startTime: string, endTime: string) {
  try {
    const slots = await prisma.scheduleSlot.findMany({ where: { startTime: { gte: startTime }, endTime: { lte: endTime } }, orderBy: { sortOrder: "asc" } });
    return slots.map((s) => ({ id: s.id, startTime: s.startTime, endTime: s.endTime, price: s.price ?? 0 }));
  } catch (error) {
    console.error("[SETTINGS] Unable to load slot prices in range:", error);
    return [];
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const records = await prisma.adminSetting.findMany({ where: { key: { in: [...SITE_CONTENT_KEYS] } } });
    const values: Record<string, string> = Object.fromEntries(
      records.map((record: { key: string; value: string }) => [record.key, record.value]),
    ) as Record<string, string>;
    const merged = { ...siteContent, ...values } as SiteContent;
    const backgroundImageUrl = normalizeRemoteImageUrl(merged.backgroundImageUrl);
    const safeBackgroundImage = getSafeRemoteImageUrl(backgroundImageUrl, FALLBACK_REMOTE_IMAGES);

    merged.backgroundImageUrl = safeBackgroundImage;
    return merged;
  } catch (error) {
    console.error("[CONTENT] Unable to load site content:", error);
    return { ...siteContent, backgroundImageUrl: getSafeRemoteImageUrl(siteContent.backgroundImageUrl, FALLBACK_REMOTE_IMAGES) };
  }
}

export async function saveSiteContent(values: Partial<SiteContent>) {
  await Promise.all(
    SITE_CONTENT_KEYS.filter((key) => typeof values[key] === "string").map((key) =>
      prisma.adminSetting.upsert({
        where: { key },
        update: { value: values[key] as string },
        create: { key, value: values[key] as string, description: `Public website content: ${key}` },
      }),
    ),
  );
  return getSiteContent();
}
