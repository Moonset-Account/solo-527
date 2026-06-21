"use client";

import { useState } from "react";
import {
  Building2,
  Receipt,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/trpc/react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getOverdueDays,
  getOverdueBadgeStyle,
  formatCNY,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CHART_COLORS = {
  paid: "#059669",
  unpaid: "#F97316",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overdue" | "todo">("overdue");

  const { data: stats, isLoading: statsLoading } = api.dashboard.getStats.useQuery();
  const { data: overdueList, isLoading: overdueLoading } = api.dashboard.getOverdueList.useQuery({ limit: 10 });
  const { data: todoList, isLoading: todoLoading } = api.dashboard.getTodoList.useQuery();
  const { data: trendData, isLoading: trendLoading } = api.dashboard.getCollectionTrend.useQuery();

  const statCards = [
    {
      title: "在管租约",
      value: stats?.activeLeases ?? 0,
      total: stats?.totalLeases ?? 0,
      icon: Building2,
      gradient: "gradient-primary",
      href: "/leases",
    },
    {
      title: "累计收缴",
      value: formatCurrency(stats?.totalCollected ?? 0),
      icon: DollarSign,
      gradient: "gradient-success",
      href: "/bills",
    },
    {
      title: "逾期金额",
      value: formatCurrency(stats?.overdueAmount ?? 0),
      count: stats?.overdueBills ?? 0,
      icon: AlertTriangle,
      gradient: "gradient-danger",
      href: "/bills?status=OVERDUE",
    },
    {
      title: "待办工单",
      value: stats?.myAssignments ?? 0,
      total: stats?.pendingAssignments ?? 0,
      icon: ClipboardList,
      gradient: "gradient-warning",
      href: "/assignments",
    },
  ];

  const chartData = trendData?.map((item) => ({
    month: item.month,
    已收缴: item.paid / 10000,
    待收缴: item.unpaid / 10000,
  })) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">数据概览</h1>
            <p className="mt-1 text-sm text-slate-500">
              欢迎回来，查看今日租后运营情况
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              收缴率: <span className="font-semibold text-emerald-600">{stats?.collectionRate ?? 0}%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <a
              key={card.title}
              href={card.href}
              className="stat-card group animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">{card.title}</p>
                  <p className="mt-2 stat-value">{card.value}</p>
                  {card.count !== undefined && (
                    <p className="mt-1 text-xs text-slate-500">
                      共 {card.count} 笔
                    </p>
                  )}
                  {card.total !== undefined && card.total !== card.value && (
                    <p className="mt-1 text-xs text-slate-500">
                      总计 {card.total} 个
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.gradient} text-white`}
                >
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">查看详情</span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="card-title">收租趋势</h2>
              </div>
              <span className="text-sm text-slate-500">单位：万元</span>
            </div>
            <div className="card-content">
              {trendLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "4px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)} 万元`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="已收缴" fill={CHART_COLORS.paid} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="待收缴" fill={CHART_COLORS.unpaid} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">待处理事项</h2>
            </div>
            <div className="border-b border-slate-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("overdue")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === "overdue"
                      ? "text-primary border-b-2 border-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  租金逾期 ({overdueList?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab("todo")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === "todo"
                      ? "text-primary border-b-2 border-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  我的待办 ({todoList?.length ?? 0})
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {activeTab === "overdue" ? (
                overdueLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : overdueList?.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-slate-500">
                    <Clock className="h-12 w-12 mb-2 text-slate-300" />
                    <p>暂无逾期账单</p>
                  </div>
                ) : (
                  overdueList?.map((bill, index) => {
                    const overdueDays = getOverdueDays(bill.dueDate);
                    return (
                      <a
                        key={bill.id}
                        href={`/bills/${bill.id}`}
                        className="flex items-start gap-4 border-b border-slate-100 p-4 hover:bg-slate-50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">
                              {bill.propertyName}
                            </p>
                            <Badge className={getOverdueBadgeStyle(overdueDays)}>
                              逾期 {overdueDays} 天
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {bill.tenantName} · {bill.period}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="font-mono font-semibold text-red-600">
                              {formatCNY(bill.amount)}
                            </span>
                            <span className="text-xs text-slate-400">
                              到期日: {formatDate(bill.dueDate)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
                      </a>
                    );
                  })
                )
              ) : todoLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : todoList?.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-slate-500">
                  <ClipboardList className="h-12 w-12 mb-2 text-slate-300" />
                  <p>暂无待办工单</p>
                </div>
              ) : (
                todoList?.map((item, index) => (
                  <a
                    key={item.id}
                    href={`/assignments/${item.id}`}
                    className="flex items-start gap-4 border-b border-slate-100 p-4 hover:bg-slate-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">
                          {item.title}
                        </p>
                        <Badge className={getStatusColor(item.priority)} variant="muted">
                          {getStatusLabel(item.priority)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.propertyName} · {item.tenantName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className={getStatusColor(item.status)} variant="muted">
                          {getStatusLabel(item.status)}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          处理人: {item.assigneeName}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
                  </a>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-200">
              <Button variant="ghost" className="w-full justify-center" asChild>
                <a href={activeTab === "overdue" ? "/bills" : "/assignments"}>
                  查看全部 <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
