import { cn } from "@/utils/cn";
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from "@/utils/format";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
        getStatusColor(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
        getPriorityColor(priority),
        className
      )}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

interface DotIndicatorProps {
  color: "success" | "warning" | "danger" | "info" | "default";
  pulse?: boolean;
  className?: string;
}

export function DotIndicator({ color, pulse, className }: DotIndicatorProps) {
  const colorClasses = {
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    info: "bg-info-500",
    default: "bg-slate-500",
  };

  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full inline-block",
        colorClasses[color],
        pulse && "animate-pulse-alert",
        className
      )}
    />
  );
}
