"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "positive" | "negative";
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl shadow-sm bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-indigo-primary/60 font-medium">{title}</span>
        <div className="w-9 h-9 rounded-full bg-green-primary/10 flex items-center justify-center text-green-primary">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-indigo-primary">{value}</span>
        {trend && (
          <span
            className={cn(
              "flex items-center text-xs font-medium",
              trend === "positive" ? "text-green-primary" : "text-red"
            )}
          >
            {trend === "positive" ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend === "positive" ? "上升" : "下降"}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-indigo-primary/40">{subtitle}</span>
      )}
    </div>
  );
}
