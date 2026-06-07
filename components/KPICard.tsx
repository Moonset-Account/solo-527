"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendUnit?: string;
  trendIsGood?: (val: number) => boolean;
  subtitle?: string;
  loading?: boolean;
}

export default function KPICard({
  title,
  value,
  unit,
  trend,
  trendUnit = "",
  trendIsGood = (v) => v > 0,
  subtitle,
  loading,
}: KPICardProps) {
  const isGood = trend !== undefined ? trendIsGood(trend) : true;
  const isNeutral = trend === 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
          {loading ? (
            <div className="h-9 w-24 bg-slate-100 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-semibold text-slate-800 animate-number-roll">
                {value}
              </span>
              {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>
          )}
        </div>
        {trend !== undefined && !loading && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isNeutral
                ? "bg-slate-100 text-slate-600"
                : isGood
                ? "bg-success-50 text-success-600"
                : "bg-danger-50 text-danger-600"
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {trend > 0 ? "+" : ""}
              {trend}
              {trendUnit}
            </span>
          </div>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
