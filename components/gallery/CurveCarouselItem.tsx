"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { VenueGalleryImage } from "@/types";

interface CurveCarouselItemProps {
  image: VenueGalleryImage;
  offset: number;
  isActive: boolean;
  width: number;
  height: number;
  spacing: number;
  onSelect: () => void;
}

export function CurveCarouselItem({ image, offset, isActive, width, height, spacing, onSelect }: CurveCarouselItemProps) {
  const x = offset * spacing;
  const z = -Math.abs(offset) * 120;
  const rotateY = offset * 28;
  const rotateZ = offset * -5;
  const scale = isActive ? 1 : 0.88;
  const opacity = isActive ? 1 : 0.66;
  const blur = isActive ? "blur(0px)" : "blur(1.1px)";
  const boxShadow = isActive ? "0 48px 140px rgba(0,0,0,0.35)" : "0 24px 88px rgba(0,0,0,0.22)";
  const zIndex = isActive ? 30 : 20 - Math.abs(offset);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={isActive ? { scale: 1.02, y: -6 } : { scale: 0.92 }}
      whileTap={{ scale: isActive ? 0.98 : 0.88 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2.5rem] focus-visible:outline-none"
      style={{ width, height, perspective: 1800, zIndex, borderRadius: 40 }}
      animate={{
        x,
        y: Math.abs(offset) * 12,
        z,
        rotateY,
        rotateZ,
        scale,
        opacity,
        filter: blur,
        boxShadow,
      }}
      initial={false}
      transition={{ type: "spring", stiffness: 150, damping: 22 }}
      aria-label={`Tampilkan ${image.title}`}
    >
      <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 shadow-[inherit] transition duration-500">
        <Image
          src={image.imageUrl}
          alt={image.title}
          fill
          sizes="(max-width: 1024px) 80vw, 400px"
          className="object-cover transition duration-500"
          priority={isActive}
          loading={isActive ? "eager" : "lazy"}
        />
        <div className="absolute inset-x-0 bottom-0 rounded-b-[2.5rem] bg-gradient-to-t from-black/90 to-transparent p-5 backdrop-blur-sm">
          <h3 className="text-base font-semibold uppercase tracking-[0.08em] text-emerald-200 drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)] leading-tight line-clamp-2">
            {image.title}
          </h3>
        </div>
      </div>
    </motion.button>
  );
}
