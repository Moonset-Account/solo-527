import { Eye, UserPlus, Clock, User } from "lucide-react";
import { cn, formatRelativeTime, formatPercent } from "@/lib/utils";
import type { Anomaly } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./Button";

interface AnomalyCardProps {
  anomaly: Anomaly;
  onView?: () => void;
  onAssign?: () => void;
  className?: string;
}

const severityMap: Record<string, "normal" | "warning" | "critical" | "info"> = {
  LOW: "info",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "critical",
};

const statusMap: Record<string, "pending" | "warning" | "success"> = {
  PENDING: "pending",
  PROCESSING: "warning",
  RESOLVED: "success",
};

const statusLabelMap: Record<string, string> = {
  PENDING: "待处理",
  PROCESSING: "处理中",
  RESOLVED: "已解决",
};

const severityLabelMap: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重",
};

export function AnomalyCard({ anomaly, onView, onAssign, className }: AnomalyCardProps) {
  const isCritical = anomaly.severity === "CRITICAL";
  const deviationColor = anomaly.deviationPercent > 0 ? "text-danger" : "text-success";

  return (
    <div
      className={cn(
        "bg-card rounded-xl border shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden",
        isCritical && "animate-breathe",
        className
      )}
    >
      <div
        className={cn(
          "h-1 w-full",
          anomaly.severity === "CRITICAL" && "bg-danger",
          anomaly.severity === "HIGH" && "bg-orange-500",
          anomaly.severity === "MEDIUM" && "bg-warning",
          anomaly.severity === "LOW" && "bg-blue-500"
        )}
      />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground mb-2 truncate">
              {anomaly.metricName}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={severityMap[anomaly.severity] || "info"} size="sm">
                {severityLabelMap[anomaly.severity] || "未知"}
              </StatusBadge>
              <StatusBadge status={statusMap[anomaly.status] || "pending"} size="sm">
                {statusLabelMap[anomaly.status] || "未知"}
              </StatusBadge>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">异常值</span>
            <span className="font-semibold text-foreground font-display">
              {anomaly.actualValue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">偏离幅度</span>
            <span className={cn("font-semibold", deviationColor)}>
              {anomaly.deviationPercent > 0 ? "+" : ""}
              {formatPercent(anomaly.deviationPercent)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">检测时间</span>
            <span className="text-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted" />
              {formatRelativeTime(anomaly.detectedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-card-border">
          {anomaly.assigneeName ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">{anomaly.assigneeName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted">
              <User className="w-4 h-4" />
              <span className="text-sm">未分配</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {anomaly.status !== "RESOLVED" && !anomaly.assignee && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAssign}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                认领
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onView}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              查看
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
