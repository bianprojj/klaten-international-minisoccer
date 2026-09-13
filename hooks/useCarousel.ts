"use client";

import { useCallback, useState } from "react";
// ponytail: no autoplay, ceiling manual nav, add interval when engagement needs it

export function useCarousel(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  const previous = useCallback(() => {
    setActiveIndex((current) => (current - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setActiveIndex((current) => (current + 1) % count);
  }, [count]);

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

  return { activeIndex, setActiveIndex, previous, next, handleKeyDown };
}
