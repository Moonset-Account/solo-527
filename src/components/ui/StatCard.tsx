import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn, formatPercent } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaType?: "increase" | "decrease";
  deltaGood?: boolean;
  icon: LucideIcon;
  color: "teal" | "ochre" | "gold" | "red" | "green";
  suffix?: string;
}

const colorMap = {
  teal: {
    bg: "from-teal-50 to-white",
    border: "border-teal-200/60",
    iconBg: "bg-teal-500/10 text-teal-600 ring-teal-500/20",
    accent: "text-teal-600",
  },
  ochre: {
    bg: "from-ochre-50 to-white",
    border: "border-ochre-200/60",
    iconBg: "bg-ochre-500/10 text-ochre-600 ring-ochre-500/20",
    accent: "text-ochre-600",
  },
  gold: {
    bg: "from-gold-50 to-white",
    border: "border-gold-200/60",
    iconBg: "bg-gold-500/10 text-gold-700 ring-gold-500/20",
    accent: "text-gold-700",
  },
  red: {
    bg: "from-red-50 to-white",
    border: "border-red-200/60",
    iconBg: "bg-red-500/10 text-red-600 ring-red-500/20",
    accent: "text-red-600",
  },
  green: {
    bg: "from-emerald-50 to-white",
    border: "border-emerald-200/60",
    iconBg: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    accent: "text-emerald-600",
  },
};

export default function StatCard({
  title,
  value,
  delta,
  deltaType,
  deltaGood = true,
  icon: Icon,
  color,
  suffix,
}: StatCardProps) {
  const c = colorMap[color];
  const showIncrease =
    deltaType === "increase" ? deltaGood : !deltaGood;

  return (
    <div
      className={cn(
        "card-hover relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-card",
        c.bg,
        c.border
      )}
      style={{ animation: "fadeInUp 0.5s ease-out both" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-600">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-3xl font-semibold text-ink-900 tabular-nums">
              {value}
            </span>
            {suffix && (
              <span className={cn("text-sm font-medium", c.accent)}>
                {suffix}
              </span>
            )}
          </div>
          {delta !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {deltaType === "increase" ? (
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5",
                    showIncrease ? "text-emerald-600" : "text-red-600"
                  )}
                />
              ) : (
                <ArrowDownRight
                  className={cn(
                    "h-3.5 w-3.5",
                    showIncrease ? "text-emerald-600" : "text-red-600"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  showIncrease ? "text-emerald-700" : "text-red-700"
                )}
              >
                {formatPercent(Math.abs(delta))}
              </span>
              <span className="text-xs text-ink-600">较上周</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg ring-1",
            c.iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-20 blur-2xl",
          color === "teal" && "bg-teal-400",
          color === "ochre" && "bg-ochre-400",
          color === "gold" && "bg-gold-400",
          color === "red" && "bg-red-400",
          color === "green" && "bg-emerald-400"
        )}
      />
    </div>
  );
}
