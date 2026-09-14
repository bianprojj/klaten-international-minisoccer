"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VenueGalleryImage } from "@/types";
import { useCarousel } from "@/hooks/useCarousel";
import { CurveCarouselDots } from "./CurveCarouselDots";
import { CurveCarouselItem } from "./CurveCarouselItem";

interface CurveCarouselProps {
  images: VenueGalleryImage[];
  price: number;
}

function normalizeOffset(index: number, activeIndex: number, count: number) {
  const raw = index - activeIndex;
  const half = Math.floor(count / 2);

  if (raw > half) return raw - count;
  if (raw < -half) return raw + count;
  return raw;
}

export default function CurveCarousel({ images, price }: CurveCarouselProps) {
  const { activeIndex, previous, next, setActiveIndex, handleKeyDown } = useCarousel(images.length);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const updateWidth = () => setContainerWidth(node.clientWidth || 0);
    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, []);

  const narrow = containerWidth > 0 && containerWidth < 640;
  const visibleRange = narrow ? 0 : 1;
  const cardWidth = containerWidth > 0 ? Math.min(Math.max(containerWidth * 0.7, 240), 420) : 320;
  const cardHeight = Math.round(cardWidth * 0.7);
  const spacing = containerWidth > 0 ? Math.max(Math.min(containerWidth * 0.26, 140), 90) : 140;
  const carouselHeight = Math.max(cardHeight + 48, 320);
  const arrowInset = containerWidth > 0 ? Math.max(10, (containerWidth - cardWidth) / 10) : 12;

  const visibleItems = useMemo(
    () =>
      images
        .map((image, index) => {
          const offset = normalizeOffset(index, activeIndex, images.length);
          return {
            image,
            offset,
            isVisible: Math.abs(offset) <= visibleRange,
          };
        })
        .filter((item) => item.isVisible),
    [images, activeIndex, visibleRange]
  );

  if (!images.length) return null;

  return (
    <section
      aria-labelledby="venue-gallery-heading"
      className="rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:px-6 lg:px-8 lg:py-16"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Galeri lapangan</p>
            <h2 id="venue-gallery-heading" className="mt-4 text-4xl font-semibold text-white leading-tight sm:text-5xl">
              Klaten International Minisoccer
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
              Jelajahi koleksi foto lapangan premium yang menempatkan setiap gambar dalam ruang bernapas dan fokus visual berkelas.
            </p>
          </div>

          <div className="inline-flex max-w-full flex-wrap items-center gap-3 self-start rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 shadow-[0_18px_48px_rgba(0,0,0,0.16)] lg:self-auto">
            <span className="font-semibold text-white">Harga sewa</span>
            <span className="rounded-full bg-slate-950/60 px-3 py-2 text-sm text-emerald-300">Rp {price.toLocaleString("id-ID")} / jam</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-4 sm:p-8 shadow-[0_40px_120px_rgba(0,0,0,0.14)]">
          <div className="pointer-events-none absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_75%)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-16 h-[260px] w-[260px] rounded-full bg-slate-900/60 blur-3xl" />

          <div className="relative mx-auto flex w-full items-center justify-center overflow-hidden">
            <div
              ref={trackRef}
              className="relative flex w-full items-center justify-center overflow-hidden"
              style={{ minHeight: carouselHeight, width: "100%" }}
              role="group"
              aria-label="Gallery carousel"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-full bg-slate-900/50 blur-3xl" />
              </div>

              {visibleItems.map(({ image, offset }) => (
                <CurveCarouselItem
                  key={image.id}
                  image={image}
                  offset={offset}
                  isActive={offset === 0}
                  width={cardWidth}
                  height={cardHeight}
                  spacing={spacing}
                  onSelect={() => setActiveIndex(images.indexOf(image))}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={previous}
              className="absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-3xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:h-14 sm:w-14"
              style={{ left: arrowInset }}
              aria-label="Sebelumnya"
            >
              <span className="inline-flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M15.41 7.41 10.83 12l4.58 4.59L14 18l-6-6 6-6z" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-3xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:h-14 sm:w-14"
              style={{ right: arrowInset }}
              aria-label="Berikutnya"
            >
              <span className="inline-flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
              </span>
            </button>
          </div>

          <div className="mt-6 flex w-full justify-center px-4 sm:px-0">
            <CurveCarouselDots activeIndex={activeIndex} count={images.length} onSelect={setActiveIndex} />
          </div>
        </div>
      </div>
    </section>
  );
}
