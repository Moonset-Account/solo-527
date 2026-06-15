"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCheck, TrendingUp, AlertTriangle, DollarSign, Wrench, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, refetch } = api.notification.list.useQuery(
    { page, pageSize: 20, unreadOnly },
    { placeholderData: keepPreviousData }
  );

  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REPAIR_STATUS_UPDATE":
        return <Wrench className="h-5 w-5" />;
      case "COMPLAINT_UPDATE":
        return <AlertTriangle className="h-5 w-5" />;
      case "REFUND_UPDATE":
        return <DollarSign className="h-5 w-5" />;
      case "TRADE_UPDATE":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.status !== "READ") {
      markAsRead.mutate({ id: notification.id });
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.repairRequestId) {
      return `/repairs/${notification.repairRequestId}`;
    }
    if (notification.tradeId) {
      return `/trades/${notification.tradeId}`;
    }
    if (notification.complaintId) {
      return `/complaints/${notification.complaintId}`;
    }
    if (notification.refundId) {
      return `/refunds/${notification.refundId}`;
    }
    return "#";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">消息通知</h1>
            <p className="text-zinc-500 mt-1">
              {data?.unreadCount ? `您有 ${data.unreadCount} 条未读消息` : "暂无未读消息"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-sm text-zinc-600">只看未读</span>
            </label>
            {data?.unreadCount! > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                全部已读
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">加载中...</div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500">暂无消息</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-zinc-100">
                {data?.items.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-4 p-4 hover:bg-zinc-50 transition-colors ${
                      notification.status !== "READ" ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      notification.status !== "READ" ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-400"
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-medium ${
                          notification.status !== "READ" ? "text-zinc-900" : "text-zinc-500"
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-zinc-400 whitespace-nowrap ml-4">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 line-clamp-2">
                        {notification.content}
                      </p>
                    </div>
                    {notification.status !== "READ" && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    )}
                  </Link>
                ))}
              </div>

              {data && data.totalPages > 1 && (
                <div className="p-4 border-t border-zinc-200">
                  <Pagination
                    page={page}
                    totalPages={data.totalPages}
                    pageSize={20}
                    total={data.total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
