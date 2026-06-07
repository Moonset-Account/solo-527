"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/hooks/use-trpc";
import type { FunnelFilter } from "@/lib/types";
import { Users, Clock, TrendingUp, TrendingDown } from "lucide-react";

type MetricsCardsProps = {
  filters: FunnelFilter;
};

type CardConfig = {
  key: keyof Awaited<ReturnType<typeof trpc.funnel.getMetrics.query>>;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  numberColor: string;
  format: (v: number) => string;
};

const CARDS: CardConfig[] = [
  {
    key: "totalWaitlist",
    label: "总候补量",
    icon: Users,
    iconBg: "bg-primary/10",
    numberColor: "text-primary",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "avgWaitDays",
    label: "平均等待天数",
    icon: Clock,
    iconBg: "bg-warning/10",
    numberColor: "text-warning",
    format: (v) => `${v.toFixed(1)} 天`,
  },
  {
    key: "conversionRate",
    label: "转正率",
    icon: TrendingUp,
    iconBg: "bg-success/10",
    numberColor: "text-success",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: "refundRate",
    label: "退费率",
    icon: TrendingDown,
    iconBg: "bg-danger/10",
    numberColor: "text-danger",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
];

function Skeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-border animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-20 bg-border rounded animate-pulse" />
          <div className="h-4 w-16 bg-border rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function MetricsCards({ filters }: MetricsCardsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["metrics", filters],
    queryFn: () => trpc.funnel.getMetrics.query(filters),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => (
          <Skeleton key={c.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const value = data?.[card.key] ?? 0;
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="bg-white rounded-xl p-5 shadow-sm border border-border"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-11 h-11 rounded-full ${card.iconBg} flex items-center justify-center`}
              >
                <Icon size={20} className={card.numberColor} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${card.numberColor}`}>
                  {card.format(value)}
                </div>
                <div className="text-sm text-text-secondary">{card.label}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
