"use client";

import { cn } from "@/lib/utils";
import { repairStatusConfig, complaintStatusConfig, refundStatusConfig, tradeStatusConfig, notificationStatusConfig, exportStatusConfig } from "@/lib/status-config";

type StatusType = "repair" | "complaint" | "refund" | "trade" | "notification" | "export";

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const configMap: Record<StatusType, Record<string, { label: string; color: string; bgColor: string }>> = {
    repair: repairStatusConfig,
    complaint: complaintStatusConfig,
    refund: refundStatusConfig,
    trade: tradeStatusConfig,
    notification: notificationStatusConfig,
    export: exportStatusConfig,
  };

  const config = configMap[type][status] || {
    label: status,
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
