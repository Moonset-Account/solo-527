import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Wrench, FileText, DollarSign, Bell, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { data: user } = api.user.me.useQuery();
  const { data: myRepairs } = api.repair.list.useQuery(
    { page: 1, pageSize: 5, mineOnly: true },
    { enabled: !!user }
  );
  const { data: notifications } = api.notification.list.useQuery(
    { page: 1, pageSize: 3, unreadOnly: true },
    { enabled: !!user }
  );

  const stats = [
    { label: "我的报修", value: myRepairs?.total || 0, icon: Wrench, href: "/repairs" },
    { label: "待处理举报", value: 0, icon: FileText, href: "/complaints" },
    { label: "退款申请", value: 0, icon: DollarSign, href: "/refunds" },
    { label: "未读消息", value: notifications?.unreadCount || 0, icon: Bell, href: "/notifications" },
  ];

  const quickActions = [
    { label: "提交报修", href: "/repairs/new", icon: Wrench, color: "bg-blue-500" },
    { label: "二手交易", href: "/trades", icon: DollarSign, color: "bg-green-500" },
    { label: "提交举报", href: "/complaints/new", icon: AlertCircle, color: "bg-orange-500" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">欢迎回来，{user?.name || "同学"}</h1>
            <p className="text-zinc-500 mt-1">
              {user?.dormNumber} {user?.roomNumber} · {formatDate(new Date())}
            </p>
          </div>
          <div className="flex gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: action.color }}
                >
                  <Icon className="h-5 w-5" />
                  {action.label}
                </Link>
              );
            })}
          </div>
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
                  <div className="p-3 bg-zinc-100 rounded-lg">
                    <Icon className="h-6 w-6 text-zinc-600" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">最近报修</h2>
              <Link href="/repairs" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {myRepairs?.items?.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <Wrench className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                  <p>暂无报修记录</p>
                  <Link href="/repairs/new" className="text-blue-600 hover:text-blue-700 text-sm">
                    立即提交
                  </Link>
                </div>
              ) : (
                myRepairs?.items?.slice(0, 5).map((repair) => (
                  <Link
                    key={repair.id}
                    href={`/repairs/${repair.id}`}
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
                          {repair.dormNumber} {repair.roomNumber} · {formatDate(repair.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={repair.status} type="repair" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">消息通知</h2>
              <Link href="/notifications" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {notifications?.items?.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                  <p>暂无新消息</p>
                </div>
              ) : (
                notifications?.items?.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-4 hover:bg-zinc-50"
                  >
                    <div className={`p-2 rounded-lg ${notification.status === "READ" ? "bg-zinc-100" : "bg-blue-100"}`}>
                      <Bell className={`h-5 w-5 ${notification.status === "READ" ? "text-zinc-500" : "text-blue-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${notification.status === "READ" ? "text-zinc-500" : "text-zinc-900"}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-zinc-500 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="p-5 border-b border-zinc-200">
            <h2 className="font-semibold text-zinc-900">报修状态说明</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-5">
            {[
              { status: "PENDING", label: "待处理", icon: Clock, color: "text-yellow-600" },
              { status: "ASSIGNED", label: "已分配", icon: TrendingUp, color: "text-blue-600" },
              { status: "IN_PROGRESS", label: "处理中", icon: TrendingUp, color: "text-purple-600" },
              { status: "COMPLETED", label: "已完成", icon: CheckCircle, color: "text-green-600" },
              { status: "CANCELLED", label: "已取消", icon: Clock, color: "text-gray-600" },
              { status: "REJECTED", label: "已拒绝", icon: AlertCircle, color: "text-red-600" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.status} className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-sm text-zinc-700">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
