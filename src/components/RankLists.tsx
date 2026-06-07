"use client";

import { cn } from "@/lib/utils";
import { WorkOrder, Supplier } from "@/types";
import { AlertTriangle, Clock, Star } from "lucide-react";

interface RankItem {
  rank: number;
  name: string;
  value: number;
  unit?: string;
  trend?: "up" | "down" | "same";
  status?: "good" | "warning" | "danger";
}

interface RankListProps {
  title: string;
  items: RankItem[];
  valueLabel?: string;
  maxValue?: number;
}

function RankList({ title, items, valueLabel, maxValue }: RankListProps) {
  const getStatusColor = (status?: RankItem["status"]) => {
    switch (status) {
      case "danger":
        return "bg-red-500";
      case "warning":
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-red-500 text-white";
    if (rank === 2) return "bg-orange-500 text-white";
    if (rank === 3) return "bg-yellow-500 text-white";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="card">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <span
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                getRankStyle(item.rank)
              )}
            >
              {item.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {item.name}
              </p>
              {maxValue && (
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      getStatusColor(item.status)
                    )}
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {item.value}
                {item.unit && (
                  <span className="text-xs text-slate-500 ml-0.5">
                    {item.unit}
                  </span>
                )}
              </p>
              {valueLabel && (
                <p className="text-xs text-slate-500">{valueLabel}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimeoutOrdersListProps {
  orders: WorkOrder[];
  onOrderClick?: (order: WorkOrder) => void;
}

export function TimeoutOrdersList({
  orders,
  onOrderClick,
}: TimeoutOrdersListProps) {
  return (
    <div className="card">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-900">响应超时榜</h3>
        </div>
        <span className="text-xs text-slate-500">
          共 {orders.length} 单超时
        </span>
      </div>
      <div className="max-h-80 overflow-auto scrollbar-thin">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onOrderClick?.(order)}
            className="px-5 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {order.orderNo}
                  </p>
                  {order.isHoliday && (
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-md font-medium">
                      节假日
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {order.buildingName} · {order.repairType}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {order.supplierName}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-red-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">
                    {order.responseTime
                      ? Math.round(order.responseTime / 60)
                      : "-"}
                    小时
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">超标准 2h</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LowRatingListProps {
  orders: WorkOrder[];
  onOrderClick?: (order: WorkOrder) => void;
}

export function LowRatingList({ orders, onOrderClick }: LowRatingListProps) {
  const maskName = (name: string) => {
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  };

  return (
    <div className="card">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-slate-900">租户低分反馈</h3>
        </div>
        <span className="text-xs text-slate-500">匿名展示</span>
      </div>
      <div className="max-h-80 overflow-auto scrollbar-thin">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onOrderClick?.(order)}
            className="px-5 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-3.5 h-3.5",
                          star <= (order.tenantRating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    {maskName(order.tenantName)}
                  </span>
                </div>
                {order.tenantFeedback && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {order.tenantFeedback}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {order.repairType} · {order.supplierName}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RankList;
