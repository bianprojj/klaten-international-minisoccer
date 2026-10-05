"use client";

const WIDTHS = ["85%", "60%", "70%", "45%", "90%", "55%", "75%"];

// Decorative placeholder bar. Hidden from assistive technology —
// pair with aria-busy + an sr-only status on the loading region.
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skel ${className}`} />;
}

// Shape-matching placeholder rows for dashboard tables: same cell
// padding/height as real rows so swapping in data causes no layout shift.
export function TableBodySkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden="true">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <span aria-hidden="true" className="skel block h-4" style={{ width: WIDTHS[(r + c) % WIDTHS.length] }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
