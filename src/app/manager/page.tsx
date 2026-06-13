import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  formatDate,
  formatTime,
  getConflictStatusColor,
  getConflictStatusName,
} from "@/lib/utils";
import type { CourtConflict, Booking, SafetyReport } from "@/lib/types";

export default async function ManagerDashboard() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0] ?? "";

  const { count: pendingConflictCount } = await supabase
    .from("court_conflicts")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "in_progress"]);

  const { count: todayBookingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("booking_date", today)
    .in("status", ["pending", "confirmed", "completed"]);

  const { count: reportCount } = await supabase
    .from("safety_reports")
    .select("*", { count: "exact", head: true });

  const { data: recentConflicts } = await supabase
    .from("court_conflicts")
    .select("*, court:court_id(*)")
    .order("created_at", { ascending: false })
    .limit(5);

  const conflictsData = (recentConflicts as CourtConflict[]) ?? [];

  const stats = [
    {
      label: "待处理冲突",
      value: pendingConflictCount ?? 0,
      icon: "⚠️",
      color: "from-red-500 to-orange-500",
      href: "/manager/conflicts",
    },
    {
      label: "今日预约数",
      value: todayBookingCount ?? 0,
      icon: "📅",
      color: "from-blue-500 to-cyan-500",
      href: "/manager/bookings",
    },
    {
      label: "已生成报表",
      value: reportCount ?? 0,
      icon: "🛡️",
      color: "from-emerald-500 to-teal-500",
      href: "/manager/safety-reports",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">负责人工作台</h1>
        <p className="text-sm text-slate-500 mt-1">
          欢迎回来！今天是 {formatDate(today)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href} className="card hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">
              最近冲突记录
            </h2>
            <Link
              href="/manager/conflicts"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部 →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {conflictsData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <div className="text-4xl mb-2">✅</div>
                <p>暂无冲突记录</p>
              </div>
            ) : (
              conflictsData.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                    🏸
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800 text-sm">
                        {conflict.court?.name ?? "场地"}
                      </span>
                      <span
                        className={`badge ${getConflictStatusColor(conflict.status)}`}
                      >
                        {getConflictStatusName(conflict.status)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(conflict.conflict_date)}{" "}
                      {formatTime(conflict.start_time)} -{" "}
                      {formatTime(conflict.end_time)}
                      <span className="ml-2">
                        涉及 {conflict.booking_ids.length} 个预约
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">快捷操作</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link
              href="/manager/conflicts"
              className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <div className="text-2xl mb-2">⚠️</div>
              <div className="font-medium text-slate-800 text-sm">
                处理场地冲突
              </div>
              <div className="text-xs text-slate-500 mt-1">
                解决预约冲突问题
              </div>
            </Link>
            <Link
              href="/manager/safety-reports"
              className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium text-slate-800 text-sm">
                创建安全报表
              </div>
              <div className="text-xs text-slate-500 mt-1">
                手动提交设备检查
              </div>
            </Link>
            <Link
              href="/manager/bookings"
              className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <div className="text-2xl mb-2">📑</div>
              <div className="font-medium text-slate-800 text-sm">
                预约管理
              </div>
              <div className="text-xs text-slate-500 mt-1">
                查看和管理所有预约
              </div>
            </Link>
            <Link
              href="/manager/bookings"
              className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-slate-800 text-sm">
                今日统计
              </div>
              <div className="text-xs text-slate-500 mt-1">
                查看今日预约情况
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
