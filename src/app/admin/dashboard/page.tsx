"use client";

import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Wrench,
  ShieldAlert,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: repairs } = api.repair.list.useQuery(
    { page: 1, pageSize: 5 },
    { enabled: true }
  );

  const { data: complaints } = api.complaint.list.useQuery(
    { page: 1, pageSize: 5 },
    { enabled: true }
  );

  const { data: refunds } = api.refund.list.useQuery(
    { page: 1, pageSize: 5 },
    { enabled: true }
  );

  const { data: users } = api.user.list.useQuery(
    { page: 1, pageSize: 5 },
    { enabled: true }
  );

  const stats = [
    { label: "报修总数", value: repairs?.total || 0, icon: Wrench, color: "bg-blue-500", href: "/admin/repairs" },
    { label: "待处理举报", value: complaints?.items?.filter(c => c.status === "PENDING").length || 0, icon: ShieldAlert, color: "bg-orange-500", href: "/admin/complaints" },
    { label: "待审批退款", value: refunds?.items?.filter(r => r.status === "PENDING").length || 0, icon: DollarSign, color: "bg-red-500", href: "/admin/refunds" },
    { label: "用户总数", value: users?.total || 0, icon: Users, color: "bg-green-500", href: "/admin/users" },
  ];

  const repairStatusCounts = repairs?.items?.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statusOverview = [
    { label: "待处理", count: repairStatusCounts["PENDING"] || 0, icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    { label: "处理中", count: repairStatusCounts["IN_PROGRESS"] || 0, icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "已完成", count: repairStatusCounts["COMPLETED"] || 0, icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50" },
    { label: "已拒绝", count: repairStatusCounts["REJECTED"] || 0, icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">管理后台</h1>
          <p className="text-zinc-500 mt-1">数据概览与快速操作</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.href}
                href={stat.href}
                className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusOverview.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`${item.bgColor} rounded-xl p-5`}>
                <div className="flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${item.color}`} />
                  <div>
                    <p className={`text-sm font-medium ${item.color}`}>{item.label}</p>
                    <p className={`text-2xl font-bold ${item.color} mt-1`}>{item.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                最新报修
              </h2>
              <Link href="/admin/repairs" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {repairs?.items?.slice(0, 5).map((repair) => (
                <Link
                  key={repair.id}
                  href={`/admin/repairs`}
                  className="flex items-center justify-between p-4 hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 rounded-lg">
                      <Wrench className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 truncate max-w-xs">
                        {repair.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {repair.dormNumber} {repair.roomNumber} · {repair.reportedBy?.name}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={repair.status} type="repair" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                待处理举报
              </h2>
              <Link href="/admin/complaints" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {complaints?.items?.filter(c => c.status === "PENDING").slice(0, 5).length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  暂无待处理举报
                </div>
              ) : (
                complaints?.items?.filter(c => c.status === "PENDING").slice(0, 5).map((complaint) => (
                  <Link
                    key={complaint.id}
                    href={`/admin/complaints`}
                    className="flex items-center justify-between p-4 hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <ShieldAlert className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 truncate max-w-xs">
                          {complaint.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {complaint.submittedBy?.name} · {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={complaint.status} type="complaint" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                待审批退款
              </h2>
              <Link href="/admin/refunds" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {refunds?.items?.filter(r => r.status === "PENDING").slice(0, 5).length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  暂无待审批退款
                </div>
              ) : (
                refunds?.items?.filter(r => r.status === "PENDING").slice(0, 5).map((refund) => (
                  <Link
                    key={refund.id}
                    href={`/admin/refunds`}
                    className="flex items-center justify-between p-4 hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 truncate max-w-xs">
                          {refund.reason}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {refund.requestedBy?.name} · {formatCurrency(refund.amount.toNumber())}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={refund.status} type="refund" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                快速操作
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <Link
                href="/admin/exports"
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">数据导出</p>
                  <p className="text-xs text-zinc-500">导出报修、举报等数据</p>
                </div>
              </Link>
              <Link
                href="/admin/audit-logs"
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <div className="p-2 bg-zinc-200 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">操作日志</p>
                  <p className="text-xs text-zinc-500">查看系统操作记录</p>
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">用户管理</p>
                  <p className="text-xs text-zinc-500">管理用户角色和权限</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
