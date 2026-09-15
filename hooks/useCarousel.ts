"use client";

import { useCallback, useEffect, useState } from "react";

export function useCarousel(count: number, autoplayMs = 2500) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const previous = useCallback(() => {
    setActiveIndex((current) => (current - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setActiveIndex((current) => (current + 1) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused || autoplayMs <= 0) return;
    const id = setInterval(() => setActiveIndex((current) => (current + 1) % count), autoplayMs);
    return () => clearInterval(id);
  }, [count, paused, autoplayMs]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        next();
      }
      if (event.key === "ArrowLeft") {
        previous();
      }
    },
    [next, previous]
  );

  return { activeIndex, setActiveIndex, previous, next, handleKeyDown, setPaused };
}
