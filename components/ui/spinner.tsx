"use client";

type SpinnerProps = {
  size?: number;
  className?: string;
};

/** Animated loading spinner (Tailwind animate-spin circle). */
export function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`animate-spin ${className}`}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

type LoadingOverlayProps = {
  show: boolean;
  label?: string;
};

/**
 * Fullscreen translucent overlay with spinner + label.
 * Render once per dashboard section, toggle via `show` while create/update/delete is in flight.
 */
export function LoadingOverlay({ show, label = "Memproses..." }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
    >
      <div className="glass-panel flex items-center gap-3 rounded-3xl px-6 py-4">
        <Spinner size={26} className="text-[color:var(--accent)]" />
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
    </div>
  );
}
