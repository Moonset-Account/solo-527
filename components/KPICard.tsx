"use client";

import {
  Users,
  Clock,
  ThumbsUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: "passengers" | "ontime" | "load" | "complaints" | "delay";
  trend?: "up" | "down" | "neutral";
  warning?: boolean;
}

const iconMap = {
  passengers: Users,
  ontime: ThumbsUp,
  load: Clock,
  complaints: AlertTriangle,
  delay: Clock,
};

const colorMap = {
  passengers: "bg-blue-500",
  ontime: "bg-green-500",
  load: "bg-orange-500",
  complaints: "bg-red-500",
  delay: "bg-purple-500",
};

export default function KPICard({
  title,
  value,
  unit,
  change,
  icon,
  trend,
  warning,
}: KPICardProps) {
  const Icon = iconMap[icon];
  const bgColor = colorMap[icon];

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${
        warning ? "border-red-300 bg-red-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                    ? "text-red-600"
                    : "text-gray-500"
              }`}
            >
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4" />
              ) : trend === "down" ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span>{change > 0 ? "+" : ""}{change.toFixed(1)}%</span>
              <span className="text-gray-400">较昨日</span>
            </div>
          )}
          {warning && (
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>需要关注</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
