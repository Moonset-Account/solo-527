import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  getBookingStatusColor,
  getBookingStatusName,
  getPaymentStatusColor,
  getPaymentStatusName,
} from "@/lib/utils";
import type { Booking, AuditLog } from "@/lib/types";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const today = new Date().toISOString().split("T")[0] ?? "";

  const [
    totalBookingsRes,
    todayBookingsRes,
    conflictsRes,
    revenueRes,
    recentBookingsRes,
    recentLogsRes,
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("booking_date", today),
    supabase
      .from("court_conflicts")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
    supabase
      .from("bookings")
      .select("total_price")
      .eq("payment_status", "paid"),
    supabase
      .from("bookings")
      .select("*, court:court_id(*)")
      .order("booking_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(8),
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalBookings = totalBookingsRes.count ?? 0;
  const todayBookings = todayBookingsRes.count ?? 0;
  const activeConflicts = conflictsRes.count ?? 0;
  const revenue =
    (revenueRes.data as Array<{ total_price: number }> ?? []).reduce(
      (sum, b) => sum + Number(b.total_price ?? 0),
      0
    );

  const recentBookings = (recentBookingsRes.data as Booking[]) ?? [];
  const recentLogs = (recentLogsRes.data as AuditLog[]) ?? [];

  const statsCards = [
    {
      label: "总预约数",
      value: totalBookings,
      icon: "📋",
      color: "from-blue-500 to-blue-600",
      href: "/admin/bookings",
    },
    {
      label: "今日预约",
      value: todayBookings,
      icon: "📅",
      color: "from-emerald-500 to-emerald-600",
      href: "/admin/bookings",
    },
    {
      label: "待处理冲突",
      value: activeConflicts,
      icon: "⚠️",
      color: "from-amber-500 to-amber-600",
      href: "/manager/conflicts",
    },
    {
      label: "累计收入",
      value: formatCurrency(revenue),
      icon: "💰",
      color: "from-purple-500 to-purple-600",
      href: "/admin/bookings",
    },
  ];

  const actionLabels: Record<string, string> = {
    create: "创建",
    update: "更新",
    delete: "删除",
  };

  const entityLabels: Record<string, string> = {
    schedule: "排班",
    coach: "教练",
    pricing_rule: "价格规则",
    court: "场地",
    waiting_list: "候补名单",
    booking: "预约",
  };

  const actionColors: Record<string, string> = {
    create: "bg-green-100 text-green-800",
    update: "bg-blue-100 text-blue-800",
    delete: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">管理员仪表盘</h1>
        <p className="text-sm text-slate-500 mt-1">
          今日是 {formatDate(today)}，欢迎回来
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card group">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl text-white shadow-md`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">最近预约</h3>
              <Link
                href="/bookings"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                查看全部 →
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="card-body text-center py-12 text-slate-500">
                暂无预约记录
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>场地</th>
                      <th>日期时间</th>
                      <th>状态</th>
                      <th>支付</th>
                      <th className="text-right">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div className="font-medium text-slate-800">
                            {booking.court?.code}
                          </div>
                          <div className="text-xs text-slate-500">
                            {booking.court?.name}
                          </div>
                        </td>
                        <td>
                          <div className="text-slate-700">
                            {formatDate(booking.booking_date)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatTime(booking.start_time)} -{" "}
                            {formatTime(booking.end_time)}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${getBookingStatusColor(booking.status)}`}
                          >
                            {getBookingStatusName(booking.status)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${getPaymentStatusColor(booking.payment_status)}`}
                          >
                            {getPaymentStatusName(booking.payment_status)}
                          </span>
                        </td>
                        <td className="text-right font-medium text-emerald-600">
                          {formatCurrency(booking.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">最近操作日志</h3>
              <Link
                href="/admin/audit-logs"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                查看全部 →
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <div className="card-body text-center py-12 text-slate-500">
                暂无操作日志
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <span
                        className={`badge ${actionColors[log.action] ?? "bg-gray-100 text-gray-800"} flex-shrink-0`}
                      >
                        {actionLabels[log.action] ?? log.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {entityLabels[log.entity_type] ?? log.entity_type}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {log.user_name ?? "系统"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDateTime(log.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
