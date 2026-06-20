import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "up" | "down";
}

const gradientVariants = {
  default: "from-slate-50 to-slate-100",
  success: "from-green-50 to-emerald-50",
  warning: "from-amber-50 to-orange-50",
  danger: "from-red-50 to-rose-50",
};

const iconVariants = {
  default: "bg-slate-500/10 text-slate-600",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
};

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  variant = "default",
  trend,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 bg-gradient-to-br p-5 shadow-soft hover:shadow-hover transition-shadow duration-300",
        gradientVariants[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
          {change !== undefined && (
            <div
              className={cn(
                "mt-2 flex items-center text-sm font-medium",
                trend === "up" ? "text-green-600" : "text-red-600"
              )}
            >
              {trend === "up" ? (
                <TrendingUp className="mr-1 h-4 w-4" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4" />
              )}
              <span>{Math.abs(change)}% 较上周</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconVariants[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
    </Card>
  );
}
