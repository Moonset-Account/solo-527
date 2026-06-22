"use client";

import { useState, useCallback } from "react";
import { useApi, useMutation } from "@/lib/hooks/use-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/utils";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  MessageSquare,
  BarChart3,
  CheckCheck,
} from "lucide-react";
import type { PaginatedResult } from "@/lib/pagination";
import type { Notification, Repair } from "@prisma/client";

type NotificationWithRelations = Notification & {
  repair: (Repair & { project: { name: string } }) | null;
};

export function NotificationList() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const userId = "current-user-id";

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      userId,
    });
    return `/api/notifications?${params.toString()}`;
  }, [page, userId]);

  const { data, loading, error, refetch } = useApi<
    PaginatedResult<NotificationWithRelations> & { unreadCount: number }
  >(buildUrl());

  const markReadMutation = useMutation<
    { notificationId: string; userId: string },
    { success: boolean }
  >("/api/notifications", "PUT", {
    onSuccess: () => refetch(),
  });

  const markAllReadMutation = useMutation<{ userId: string }, { success: boolean }>(
    "/api/notifications?action=markAllRead",
    "POST",
    {
      onSuccess: () => refetch(),
    }
  );

  const handleMarkRead = (notificationId: string) => {
    markReadMutation.mutate({ notificationId, userId });
  };

  const handleMarkAllRead = () => {
    if (confirm("确定要标记所有通知为已读吗？")) {
      markAllReadMutation.mutate({ userId });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REPAIR_OVERDUE":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "BUDGET_CHANGE":
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      case "QUOTE_CONFIRMED":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "ADDON_CONFIRMED":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "FEEDBACK_RECEIVED":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case "MONTHLY_REPORT_READY":
        return <BarChart3 className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      REPAIR_OVERDUE: "返修超时",
      BUDGET_CHANGE: "预算变更",
      QUOTE_CONFIRMED: "报价确认",
      ADDON_CONFIRMED: "增项确认",
      FEEDBACK_RECEIVED: "客户反馈",
      MONTHLY_REPORT_READY: "月度报表",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8" />
            通知中心
          </h1>
          <p className="text-muted-foreground">
            查看所有系统通知，超时返修、预算变更等重要提醒
          </p>
        </div>
        {(data?.unreadCount || 0) > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            全部标记已读 ({data?.unreadCount})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={data?.unreadCount ? "border-yellow-300" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>未读通知</CardDescription>
            <CardTitle
              className={`text-2xl ${data?.unreadCount ? "text-yellow-600" : ""}`}
            >
              {data?.unreadCount || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总通知数</CardDescription>
            <CardTitle className="text-2xl">{data?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>超时提醒</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {data?.data.filter((n) => n.type === "REPAIR_OVERDUE").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">加载失败: {error.message}</div>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-muted-foreground">暂无通知</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((notification) => (
                    <TableRow
                      key={notification.id}
                      className={!notification.read ? "bg-blue-50/50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                          {getNotificationIcon(notification.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            notification.type === "REPAIR_OVERDUE"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {notification.title}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {notification.message}
                      </TableCell>
                      <TableCell>
                        {notification.read ? (
                          <Badge variant="outline">已读</Badge>
                        ) : (
                          <Badge variant="default">未读</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(notification.createdAt)}</TableCell>
                      <TableCell>
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkRead(notification.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            标记已读
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data && <Pagination result={data} onPageChange={setPage} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
