"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface TableResponsiveProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  cardRender?: (item: T) => ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function TableResponsive<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "Tidak ada data",
  cardRender,
  className = "",
  striped = true,
  hoverable = true,
}: TableResponsiveProps<T>) {
  const visibleColumns = columns.filter((c) => !c.hideOnMobile);

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-muted ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <tr
                key={keyExtractor(item)}
                className={`border-b border-border/50 transition-colors ${
                  striped && rowIndex % 2 === 1 ? "bg-muted/30" : ""
                } ${hoverable ? "hover:bg-muted/50" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm"
          >
            {cardRender
              ? cardRender(item)
              : columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-4 py-1">
                    <span className="text-xs font-medium text-muted">{col.header}</span>
                    <span className="text-sm font-medium text-foreground text-right">{col.render(item)}</span>
                  </div>
                ))}
          </div>
        ))}
      </div>
    </div>
  );
}