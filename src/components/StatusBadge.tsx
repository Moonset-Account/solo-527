"use client";

import { cn, statusColorMap, statusLabelMap } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        statusColorMap[status] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {statusLabelMap[status] ?? status}
    </span>
  );
}
