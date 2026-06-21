"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number | string;
  suffix?: string;
  delta?: number;
  Icon: LucideIcon;
  tone?: "default" | "warm" | "success" | "danger";
  className?: string;
  index?: number;
}

const toneMap = {
  default: { ring: "border-deep-blue-100", iconText: "text-deep-blue-500", bg: "bg-deep-blue-50/50", delta: "text-deep-blue-500" },
  warm: { ring: "border-ink-gold-200", iconText: "text-ink-gold-500", bg: "bg-ink-gold-50/40", delta: "text-warn-orange" },
  success: { ring: "border-green-100", iconText: "text-success-green", bg: "bg-green-50/50", delta: "text-success-green" },
  danger: { ring: "border-red-100", iconText: "text-alert-red", bg: "bg-red-50/50", delta: "text-alert-red" },
};

export function KPICard({ label, value, suffix, delta, Icon, tone = "default", className, index = 0 }: KPICardProps) {
  const t = toneMap[tone];
  const isPositive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn("card-gold p-5 group hover:shadow-card-hover transition-shadow", className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <p className="text-xs font-medium text-deep-blue-500 uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="num text-3xl font-semibold text-deep-blue-800">{value}</span>
            {suffix && <span className="text-sm text-deep-blue-400">{suffix}</span>}
          </div>
          {typeof delta === "number" && (
            <div className={cn("text-xs flex items-center gap-1 font-medium", t.delta)}>
              <span>{isPositive ? "▲" : "▼"}</span>
              <span>{Math.abs(delta)}%</span>
              <span className="text-deep-blue-400 font-normal">同比</span>
            </div>
          )}
        </div>
        <div className={cn("gold-ring-icon", t.bg, t.ring, "border", t.iconText)}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>
    </motion.div>
  );
}

interface StatChipProps {
  label: string;
  count: number;
  color: "red" | "orange" | "green" | "blue" | "slate";
  active?: boolean;
  onClick?: () => void;
}

export function StatChip({ label, count, color, active, onClick }: StatChipProps) {
  const colors = {
    red: "bg-red-50 text-alert-red border-red-100",
    orange: "bg-orange-50 text-warn-orange border-orange-100",
    green: "bg-green-50 text-success-green border-green-100",
    blue: "bg-blue-50 text-deep-blue-600 border-deep-blue-100",
    slate: "bg-slate-50 text-deep-blue-600 border-deep-blue-100",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "chip border transition-all duration-200 px-3 py-1.5",
        colors[color],
        active ? "ring-2 ring-offset-1 ring-ink-gold-400/60 scale-[1.02]" : "hover:scale-[1.02]",
      )}
    >
      <span>{label}</span>
      <span className="num ml-1 text-[11px] opacity-90">{count}</span>
    </button>
  );
}

export function EmptyState({ title, hint, icon: Icon }: { title: string; hint?: string; icon?: LucideIcon }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      {Icon && <div className="text-deep-blue-300 mb-4"><Icon size={40} strokeWidth={1.2} /></div>}
      <div className="text-deep-blue-600 font-medium mb-1">{title}</div>
      {hint && <div className="text-sm text-deep-blue-400">{hint}</div>}
    </div>
  );
}
