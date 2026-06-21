"use client";

import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "gold"
  | "ghost";

interface StatusChipProps {
  variant?: Variant;
  size?: "sm" | "md";
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  default: "bg-deep-blue-50 text-deep-blue-600 border-deep-blue-100",
  success: "bg-green-50 text-success-green border-green-200",
  warn: "bg-orange-50 text-warn-orange border-orange-200",
  danger: "bg-red-50 text-alert-red border-red-200",
  info: "bg-blue-50 text-deep-blue-600 border-deep-blue-200",
  gold: "bg-ink-gold-50 text-ink-gold-600 border-ink-gold-200",
  ghost: "bg-white text-deep-blue-600 border-deep-blue-200",
};

const dotMap: Record<Variant, string> = {
  default: "bg-deep-blue-500",
  success: "bg-success-green",
  warn: "bg-warn-orange",
  danger: "bg-alert-red",
  info: "bg-blue-500",
  gold: "bg-ink-gold-500",
  ghost: "bg-deep-blue-400",
};

export function StatusChip({ variant = "default", size = "sm", pulse, children, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "chip border inline-flex items-center gap-1.5",
        variantClass[variant],
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotMap[variant], pulse && "animate-pulse")} />
      {children}
    </span>
  );
}

export function leadStatusVariant(s: string): Variant {
  switch (s) {
    case "NEW": return "info";
    case "FOLLOWING": return "gold";
    case "TRIAL_SCHEDULED": return "warn";
    case "TRIAL_DONE": return "default";
    case "CONVERTED": return "success";
    case "LOST": return "danger";
    default: return "ghost";
  }
}

export function leadLevelVariant(s: string): Variant {
  switch (s) {
    case "HOT": return "danger";
    case "WARM": return "warn";
    case "COLD": return "info";
    default: return "ghost";
  }
}

export function trialStatusVariant(s: string): Variant {
  switch (s) {
    case "SCHEDULED": return "warn";
    case "COMPLETED": return "success";
    case "CANCELLED": return "ghost";
    case "NO_SHOW": return "danger";
    default: return "ghost";
  }
}

export function classStatusVariant(s: string): Variant {
  switch (s) {
    case "ONGOING": return "success";
    case "PENDING": return "warn";
    case "FINISHED": return "ghost";
    case "SUSPENDED": return "danger";
    default: return "ghost";
  }
}

export function consumptionStatusVariant(s: string): Variant {
  switch (s) {
    case "NORMAL": return "success";
    case "EXCEPTION": return "danger";
    case "RECONCILED": return "gold";
    default: return "ghost";
  }
}
