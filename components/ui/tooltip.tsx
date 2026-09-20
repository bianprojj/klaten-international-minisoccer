"use client";

import { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900",
  };

  return (
    <span className="relative inline-block" tabIndex={0}>
      {children}
      <div
        className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 invisible transition-opacity duration-200 ${positionClasses[position]}`}
        role="tooltip"
      >
        {content}
        <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`} />
      </div>
    </span>
  );
}