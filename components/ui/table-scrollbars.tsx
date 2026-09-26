"use client";

import { useEffect } from "react";

const TRACK_CLASS =
  "table-scrollbar-track mt-2 flex h-4 touch-none items-center rounded-full bg-white/5 px-1";
const THUMB_CLASS =
  "h-2 shrink-0 cursor-grab touch-none rounded-full bg-[color:var(--accent)] active:cursor-grabbing";

const repainters = new WeakMap<HTMLElement, () => void>();

function paintThumb(scroller: HTMLElement, track: HTMLElement, thumb: HTMLElement) {
  const max = scroller.scrollWidth - scroller.clientWidth;
  if (max <= 0 || track.clientWidth <= 0) {
    track.style.display = "none";
    return;
  }
  track.style.display = "";
  const thumbWidth = Math.max((scroller.clientWidth / scroller.scrollWidth) * track.clientWidth, 28);
  thumb.style.width = `${thumbWidth}px`;
  const range = Math.max(track.clientWidth - thumbWidth, 1);
  thumb.style.transform = `translateX(${(scroller.scrollLeft / max) * range}px)`;
}

function enhance(scroller: HTMLElement) {
  if (scroller.dataset.scrollbarEnhanced === "1") return;
  scroller.dataset.scrollbarEnhanced = "1";

  const track = document.createElement("div");
  track.className = TRACK_CLASS;
  track.style.display = "none";
  const thumb = document.createElement("div");
  thumb.className = THUMB_CLASS;
  track.appendChild(thumb);
  scroller.parentNode?.insertBefore(track, scroller.nextSibling);

  const update = () => paintThumb(scroller, track, thumb);
  update();
  scroller.addEventListener("scroll", update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(scroller);

  let dragging = false;
  let startX = 0;
  let startThumbX = 0;
  const thumbX = () => {
    const match = /translateX\((-?[\d.]+)px\)/.exec(thumb.style.transform);
    return match ? Number(match[1]) : 0;
  };
  const onThumbDown = (e: PointerEvent) => {
    dragging = true;
    startX = e.clientX;
    startThumbX = thumbX();
    try {
      thumb.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture unsupported, drag still works */
    }
    e.preventDefault();
    e.stopPropagation();
  };
  const onThumbMove = (e: PointerEvent) => {
    if (!dragging) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const range = Math.max(track.clientWidth - (thumb.clientWidth || 1), 1);
    const next = Math.min(Math.max(startThumbX + (e.clientX - startX), 0), range);
    scroller.scrollLeft = max <= 0 ? 0 : (next / range) * max;
  };
  const onThumbUp = () => {
    dragging = false;
  };
  thumb.addEventListener("pointerdown", onThumbDown);
  window.addEventListener("pointermove", onThumbMove);
  window.addEventListener("pointerup", onThumbUp);
  window.addEventListener("pointercancel", onThumbUp);

  repainters.set(scroller, update);
}

// Attaches an always-visible horizontal scrollbar under every
// [data-drag-scroll] table wrapper (staff/manager/superadmin dashboards).
// The thumb position follows the table and dragging the thumb scrolls it,
// so Edit/Delete columns stay reachable on phones without precise swipe
// gestures. Hidden automatically when nothing overflows.
export function TableScrollbars() {
  useEffect(() => {
    const enhanceAll = () => {
      document
        .querySelectorAll<HTMLElement>("[data-drag-scroll]:not([data-scrollbar-enhanced])")
        .forEach(enhance);
    };
    enhanceAll();
    const onResize = () => {
      document.querySelectorAll<HTMLElement>("[data-drag-scroll]").forEach((el) => {
        repainters.get(el)?.();
      });
    };
    window.addEventListener("resize", onResize);
    const observer = new MutationObserver(enhanceAll);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);

  return null;
}
