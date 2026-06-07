"use client";

import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { MOCK_SUPPLIERS, MOCK_WORK_ORDERS } from "@/mock/data";
import {
  RepeatRateTrend,
  ResponseTimeBoxplot,
  RepairTypeDistribution,
} from "@/components/Charts";
import MetricCard from "@/components/MetricCard";
import { Star, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SuppliersPage() {
  const suppliersWithStats = useMemo(() => {
    return MOCK_SUPPLIERS.map((supplier) => {
      const orders = MOCK_WORK_ORDERS.filter((o) => o.supplierId === supplier.id);
      const completedOrders = orders.filter(
        (o) => o.status === "completed" || o.status === "closed"
      );
      const nonHolidayOrders = completedOrders.filter((o) => !o.isHoliday);

      const repeatCount = orders.filter((o) => o.isRepeat).length;
      const repeatRate = orders.length > 0 ? (repeatCount / orders.length) * 100 : 0;

      const responseTimes = nonHolidayOrders
        .filter((o) => o.responseTime)
        .map((o) => o.responseTime!);
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

      const timeoutCount = nonHolidayOrders.filter(
        (o) => o.responseTime && o.responseTime > 120
      ).length;

      const ratings = completedOrders
        .filter((o) => o.tenantRating)
        .map((o) => o.tenantRating!);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        ...supplier,
        orderCount: orders.length,
        repeatRate: Math.round(repeatRate * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime),
        timeoutCount,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    }).sort((a, b) => b.repeatRate - a.repeatRate);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            供应商管理
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {suppliersWithStats.length} 家合作供应商
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {suppliersWithStats.map((supplier, idx) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="card card-hover p-5 block"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{supplier.name}</h3>
                  <p className="text-xs text-slate-500">联系人: {supplier.contact}</p>
                </div>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    idx === 0
                      ? "bg-red-500"
                      : idx === 1
                      ? "bg-orange-500"
                      : idx === 2
                      ? "bg-yellow-500"
                      : "bg-slate-300"
                  }`}
                >
                  {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">复修率</p>
                  <p className="text-lg font-bold text-orange-600">
                    {supplier.repeatRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">平均响应</p>
                  <p className="text-lg font-bold text-slate-900">
                    {supplier.avgResponseTime}分
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">超时数</p>
                  <p className="text-lg font-bold text-red-600">
                    {supplier.timeoutCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">平均评分</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {supplier.avgRating}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">总工单</span>
                  <span className="font-medium text-slate-700">
                    {supplier.orderCount} 单
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
