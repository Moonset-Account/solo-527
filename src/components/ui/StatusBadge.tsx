import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "pending"
  | "inProgress"
  | "completed"
  | "overdue"
  | "cancelled"
  | "active"
  | "archived"
  | "exception"
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "processing"
  | "resolved"
  | "closed";

const variantStyles: Record<Variant, string> = {
  default: "bg-ink-100 text-ink-700 ring-ink-200",
  pending: "bg-ochre-50 text-ochre-700 ring-ochre-200",
  inProgress: "bg-gold-50 text-gold-700 ring-gold-300",
  completed: "bg-teal-50 text-teal-700 ring-teal-200",
  overdue: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  active: "bg-teal-50 text-teal-700 ring-teal-200",
  archived: "bg-gray-100 text-gray-600 ring-gray-200",
  exception: "bg-red-50 text-red-700 ring-red-200",
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-gold-50 text-gold-700 ring-gold-300",
  high: "bg-ochre-50 text-ochre-700 ring-ochre-200",
  critical: "bg-red-50 text-red-700 ring-red-300",
  processing: "bg-gold-50 text-gold-700 ring-gold-300",
  resolved: "bg-teal-50 text-teal-700 ring-teal-200",
  closed: "bg-gray-100 text-gray-600 ring-gray-200",
};

const labelMap: Record<Variant, string> = {
  default: "默认",
  pending: "待随访",
  inProgress: "进行中",
  completed: "已完成",
  overdue: "已逾期",
  cancelled: "已取消",
  active: "正常",
  archived: "已归档",
  exception: "异常",
  low: "低",
  medium: "中",
  high: "高",
  critical: "紧急",
  processing: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

interface StatusBadgeProps {
  variant: Variant;
  label?: string;
  className?: string;
  dot?: boolean;
}

export default function StatusBadge({
  variant,
  label,
  className,
  dot = true,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "pending" && "bg-ochre-500",
            variant === "inProgress" && "bg-gold-500",
            variant === "completed" && "bg-teal-500",
            variant === "overdue" && "bg-red-500",
            variant === "active" && "bg-teal-500",
            variant === "exception" && "bg-red-500",
            variant === "low" && "bg-emerald-500",
            variant === "medium" && "bg-gold-500",
            variant === "high" && "bg-ochre-500",
            variant === "critical" && "bg-red-500",
            variant === "processing" && "bg-gold-500",
            variant === "resolved" && "bg-teal-500",
            variant === "cancelled" && "bg-gray-400",
            variant === "archived" && "bg-gray-400",
            variant === "closed" && "bg-gray-400"
          )}
        />
      )}
      {label ?? labelMap[variant]}
    </span>
  );
}
