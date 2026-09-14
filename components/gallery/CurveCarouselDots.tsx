"use client";

interface CurveCarouselDotsProps {
  activeIndex: number;
  count: number;
  onSelect: (index: number) => void;
}

export function CurveCarouselDots({ activeIndex, count, onSelect }: CurveCarouselDotsProps) {
  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          className={`dot ${index === activeIndex ? "active" : ""}`}
          aria-label={`Tampilkan slide ${index + 1}`}
          aria-current={index === activeIndex ? "true" : "false"}
        />
      ))}
    </div>
  );
}
