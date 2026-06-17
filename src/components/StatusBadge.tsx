import { CheckCircle, AlertTriangle, XCircle, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "normal" | "warning" | "critical" | "success" | "info" | "pending";

export type BadgeSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
  status: StatusType;
  size?: BadgeSize;
  className?: string;
  children?: React.ReactNode;
}

const statusConfig = {
  normal: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle,
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    icon: AlertTriangle,
  },
  critical: {
    bg: "bg-danger/10",
    text: "text-danger",
    border: "border-danger/20",
    icon: XCircle,
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle,
  },
  info: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    icon: Info,
  },
  pending: {
    bg: "bg-muted/10",
    text: "text-muted",
    border: "border-muted/20",
    icon: Clock,
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-0.5 gap-1",
    icon: "w-3 h-3",
    text: "text-xs",
  },
  md: {
    container: "px-2.5 py-1 gap-1.5",
    icon: "w-4 h-4",
    text: "text-sm",
  },
  lg: {
    container: "px-3 py-1.5 gap-2",
    icon: "w-5 h-5",
    text: "text-base",
  },
};

export function StatusBadge({ status, size = "md", className, children }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        config.bg,
        config.text,
        config.border,
        sizeStyles.container,
        className
      )}
    >
      <Icon className={sizeStyles.icon} />
      <span className={sizeStyles.text}>{children}</span>
    </span>
  );
}
