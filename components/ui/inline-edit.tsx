"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, FocusEvent } from "react";

interface InlineEditCellProps<T> {
  value: string;
  onSave: (newValue: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  className?: string;
  onCancel?: () => void;
}

export function InlineEditCell<T>({
  value,
  onSave,
  disabled,
  placeholder,
  type = "text",
  options,
  className = "",
  onCancel,
}: InlineEditCellProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === "text" && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    if (editValue !== value) {
      onSave(editValue);
    } else if (onCancel) {
      onCancel();
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Enter" && type !== "select") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
      onCancel?.();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  };

  if (!isEditing) {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-sm cursor-pointer transition-colors hover:bg-muted rounded ${className}`}
        onClick={() => !disabled && setIsEditing(true)}
      >
        {value || <span className="text-muted">-</span>}
      </span>
    );
  }

  if (type === "select" && options) {
    return (
      <select
        ref={inputRef}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`inline-flex w-full px-2 py-1 text-sm border border-input rounded bg-background ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={editValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={`inline-flex w-full px-2 py-1 text-sm border border-input rounded bg-background ${className}`}
      autoComplete="off"
    />
  );
}

interface EditableBadgeProps {
  value: string;
  onSave: (newValue: string) => void;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  options?: { value: string; label: string; variant?: EditableBadgeProps["variant"] }[];
  disabled?: boolean;
  className?: string;
}

const variantClasses: Record<EditableBadgeProps["variant"], string> = {
  default: "bg-muted text-foreground",
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export function EditableBadge({
  value,
  onSave,
  variant = "default",
  options,
  disabled,
  className = "",
}: EditableBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (!isEditing) return;
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      selectRef.current?.blur();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    const opt = options?.find((o) => o.value === value);
    const currentVariant = opt?.variant || variant;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${variantClasses[currentVariant]} ${className}`}
        onClick={() => !disabled && setIsEditing(true)}
      >
        {value}
      </span>
    );
  }

  return (
    <select
      ref={selectRef}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`inline-flex w-auto px-2 py-1 text-xs border border-input rounded bg-background ${className}`}
    >
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}