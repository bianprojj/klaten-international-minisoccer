"use client";

import { useEffect } from "react";

// Global drag-to-scroll for dashboard CRUD tables.
// Relying only on native touch swipe proved unreliable on some Android
// devices, so any element with [data-drag-scroll] can also be dragged
// (mouse or finger) to scroll horizontally. A drag never triggers the
// Edit/Delete buttons underneath it.
export function TableDragScroll() {
  useEffect(() => {
    let el: HTMLElement | null = null;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let down = false;

    const findScroller = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof HTMLElement)) return null;
      return target.closest("[data-drag-scroll]");
    };

    const onPointerDown = (e: PointerEvent) => {
      const scroller = findScroller(e.target);
      if (!scroller) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      el = scroller;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = scroller.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!down || !el) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 8) {
        if (!moved) {
          moved = true;
          el.classList.add("dragging");
        }
        el.scrollLeft = startLeft - dx;
      }
    };

    const endGesture = () => {
      down = false;
      if (el) el.classList.remove("dragging");
      el = null;
    };

    // Suppress the click that follows a real drag so Edit/Delete
    // buttons are not activated accidentally.
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endGesture);
    document.addEventListener("pointercancel", endGesture);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", endGesture);
      document.removeEventListener("pointercancel", endGesture);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return null;
}
