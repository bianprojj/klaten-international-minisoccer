"use client";

import { forwardRef, type SwitchHTMLAttributes } from "react";

export const Switch = forwardRef<HTMLInputElement, SwitchHTMLAttributes<HTMLInputElement>>(
  ({ checked, onChange, disabled, label, id, className, ...props }, ref) => (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        id={id}
        className="sr-only peer"
        {...props}
      />
      <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span className="absolute left-0.5 top-0.5 h-5 w-5 bg-white rounded-full shadow-sm peer-checked:translate-x-full transition-transform" />
      </span>
      {label && <span className="text-sm text-muted">{label}</span>}
    </label>
  )
);

Switch.displayName = "Switch";