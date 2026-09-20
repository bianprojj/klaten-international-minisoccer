"use client";

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  small?: boolean;
}

export function Switch({ checked, onChange, disabled = false, label, small = false }: SwitchProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Toggle"}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex shrink-0 items-center rounded-full border border-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] disabled:cursor-not-allowed ${
          small ? "h-5 w-9" : "h-6 w-11"
        } ${checked ? "bg-emerald-500" : "bg-white/15"}`}
      >
        <span
          aria-hidden
          className={`inline-block transform rounded-full bg-white shadow transition-transform duration-200 ${
            small ? "h-4 w-4" : "h-5 w-5"
          } ${checked ? (small ? "translate-x-4" : "translate-x-5") : "translate-x-0.5"}`}
        />
      </button>
      {label ? <span className="text-sm text-[color:var(--muted)]">{label}</span> : null}
    </span>
  );
}
