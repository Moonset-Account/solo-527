"use client";

import { useState, useEffect } from "react";
import { ReservationStatus } from "@/lib/types";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  pending: number;
  approved: number;
  dispatched: number;
  completed: number;
  totalRevenue: number;
  todayReservations: number;
}

export default function InternalDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    dispatched: 0,
    completed: 0,
    totalRevenue: 0,
    todayReservations: 0,
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);

  const { get, loading } = useApi();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [resResult, settleResult] = await Promise.all([
      get("/api/reservations?pageSize=100"),
      get("/api/settlements?pageSize=100"),
    ]);

    if (resResult.success && resResult.data) {
      const reservations = resResult.data as any[];
      const today = new Date().toISOString().split("T")[0];

      setStats({
        pending: reservations.filter(
          (r) => r.status === ReservationStatus.PENDING
        ).length,
        approved: reservations.filter(
          (r) => r.status === ReservationStatus.APPROVED
        ).length,
        dispatched: reservations.filter(
          (r) => r.status === ReservationStatus.DISPATCHED
        ).length,
        completed: reservations.filter(
          (r) => r.status === ReservationStatus.COMPLETED
        ).length,
        totalRevenue:
          (settleResult.data as any[])?.reduce(
            (sum: number, s: any) => sum + s.netIncome,
            0
          ) || 0,
        todayReservations: reservations.filter((r) =>
          r.scheduledDate.startsWith(today)
        ).length,
      });

      setRecentReservations(reservations.slice(0, 5));
    }
  };

  const statCards = [
    {
      label: "待审批",
      value: stats.pending,
      icon: "📋",
      color: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-700",
    },
    {
      label: "已审批待派发",
      value: stats.approved,
      icon: "✅",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
    },
    {
      label: "已派发作业中",
      value: stats.dispatched,
      icon: "🚜",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-700",
    },
    {
      label: "今日预约",
      value: stats.todayReservations,
      icon: "📅",
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-700",
    },
    {
      label: "已完成",
      value: stats.completed,
      icon: "🎯",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
    },
    {
      label: "累计净收益",
      value: formatCurrency(stats.totalRevenue),
      icon: "💰",
      color: "bg-primary-50 border-primary-200",
      textColor: "text-primary-700",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">管理工作台</h1>
        <p className="text-gray-500 mt-1">
          实时查看作业预约、农机调度和收益情况
        </p>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`card p-4 border ${card.color}`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className={`text-2xl font-bold ${card.textColor}`}>
              {card.value}
            </div>
            <div className="text-sm text-gray-600">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">最近预约</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : recentReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无预约记录</div>
          ) : (
            <div className="space-y-3">
              {recentReservations.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{r.reservationNo}</div>
                    <div className="text-sm text-gray-500">
                      {r.village} · {r.contactName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(r.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/internal/reservations"
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="text-2xl mb-1">📋</div>
              <div className="font-medium">作业预约管理</div>
              <div className="text-sm text-gray-500">审批、派发、改期</div>
            </a>
            <a
              href="/internal/dispatches"
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="text-2xl mb-1">🗺️</div>
              <div className="font-medium">路线派发</div>
              <div className="text-sm text-gray-500">农机、司机调度</div>
            </a>
            <a
              href="/internal/fuel"
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="text-2xl mb-1">⛽</div>
              <div className="font-medium">油料登记</div>
              <div className="text-sm text-gray-500">加油记录管理</div>
            </a>
            <a
              href="/internal/maintenance"
              className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="text-2xl mb-1">🔧</div>
              <div className="font-medium">维修管理</div>
              <div className="text-sm text-gray-500">维修暂停作业</div>
            </a>
            <a
              href="/internal/settlements"
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="text-2xl mb-1">💰</div>
              <div className="font-medium">收益结算</div>
              <div className="text-sm text-gray-500">作业费用结算</div>
            </a>
            <a
              href="/internal/settings"
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-2xl mb-1">⚙️</div>
              <div className="font-medium">基础数据</div>
              <div className="text-sm text-gray-500">农机、地块、司机</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
