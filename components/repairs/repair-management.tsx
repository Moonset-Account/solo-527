"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  Wrench,
  Bell,
} from "lucide-react";
import { useApi, useMutation } from "@/lib/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { RepairStatusBadge } from "@/components/ui/status-badges";
import { formatDate, formatDateTime, getDaysRemaining } from "@/lib/utils";
import type { PaginatedResult } from "@/lib/pagination";
import type { Repair, Project, User, RepairPhoto } from "@prisma/client";

type RepairWithRelations = Repair & {
  project: Pick<Project, "id" | "name" | "address">;
  reportedBy: Pick<User, "id" | "name">;
  assignedTo: Pick<User, "id" | "name"> | null;
  photos: RepairPhoto[];
  isOverdue?: boolean;
  daysRemaining?: number;
};

interface RepairManagementProps {
  showOverdueAlert?: boolean;
}

export function RepairManagement({ showOverdueAlert = true }: RepairManagementProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const pageSize = 10;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (showOverdueOnly) params.set("overdueOnly", "true");
    return `/api/repairs?${params.toString()}`;
  }, [page, search, statusFilter, showOverdueOnly]);

  const { data, loading, error, refetch } = useApi<PaginatedResult<RepairWithRelations>>(
    buildUrl()
  );

  const updateStatusMutation = useMutation<{ status: string; completedNote?: string }, Repair>(
    "/api/repairs",
    "PUT",
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  useEffect(() => {
    const checkOverdue = async () => {
      await fetch("/api/notifications?action=checkOverdue", { method: "POST" });
    };
    checkOverdue();
    const interval = setInterval(checkOverdue, 3600000);
    return () => clearInterval(interval);
  }, []);

  const overdueCount =
    data?.data.filter((r) => r.status !== "COMPLETED" && r.isOverdue).length || 0;
  const inProgressCount =
    data?.data.filter((r) => r.status === "IN_PROGRESS").length || 0;
  const completedCount =
    data?.data.filter((r) => r.status === "COMPLETED").length || 0;

  const handleStatusChange = (repairId: string, status: string, completedNote?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("id", repairId);
    updateStatusMutation.mutate({ status, completedNote });
  };

  return (
    <div className="space-y-6">
      {showOverdueAlert && overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-800">
              有 {overdueCount} 个返修任务已超时！请立即处理
            </p>
            <p className="text-sm text-red-600">
              超时返修已自动通知老板，请尽快安排处理
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowOverdueOnly(true)}
          >
            查看超时任务
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">返修管理</h1>
          <p className="text-muted-foreground">
            管理所有返修任务，超时时将自动提醒老板
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            fetch("/api/notifications?action=checkOverdue", { method: "POST" })
          }
        >
          <Bell className="mr-2 h-4 w-4" />
          检查超时任务
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={overdueCount > 0 ? "border-red-300 bg-red-50" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>已超时</CardDescription>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${
                overdueCount > 0 ? "text-red-600" : ""
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              {overdueCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">需要紧急处理</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>处理中</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-blue-600">
              <Wrench className="h-5 w-5" />
              {inProgressCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">正在处理</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已完成</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              {completedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">已解决</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>待处理</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              {data?.data.filter((r) => r.status === "REPORTED").length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">等待处理</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>返修任务列表</CardTitle>
            <div className="flex items-center gap-3">
              <Button
                variant={showOverdueOnly ? "destructive" : "outline"}
                size="sm"
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {showOverdueOnly ? "显示全部" : "仅显示超时"}
              </Button>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索返修..."
                  className="pl-8 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                筛选
              </Button>
            </div>
          </div>
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
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">暂无返修记录</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>项目</TableHead>
                    <TableHead>严重程度</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>截止日期</TableHead>
                    <TableHead>剩余天数</TableHead>
                    <TableHead>上报人</TableHead>
                    <TableHead>处理人</TableHead>
                    <TableHead>上报时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((repair) => (
                    <TableRow
                      key={repair.id}
                      className={
                        repair.status !== "COMPLETED" && repair.isOverdue
                          ? "bg-red-50"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {repair.title}
                        {repair.status !== "COMPLETED" && repair.isOverdue && (
                          <Badge variant="destructive" className="ml-2">
                            已超时 {Math.abs(repair.daysRemaining || 0)} 天
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{repair.project.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {repair.project.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            repair.severity === "high"
                              ? "destructive"
                              : repair.severity === "medium"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {repair.severity === "high"
                            ? "高"
                            : repair.severity === "medium"
                            ? "中"
                            : "低"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RepairStatusBadge
                          status={repair.status}
                          isOverdue={repair.isOverdue}
                        />
                      </TableCell>
                      <TableCell>{formatDate(repair.deadline)}</TableCell>
                      <TableCell
                        className={
                          repair.status !== "COMPLETED" &&
                          (repair.daysRemaining || 0) <= 0
                            ? "text-red-600 font-semibold"
                            : (repair.daysRemaining || 0) <= 3
                            ? "text-yellow-600"
                            : ""
                        }
                      >
                        {repair.status === "COMPLETED"
                          ? "-"
                          : repair.isOverdue
                          ? `已超时 ${Math.abs(repair.daysRemaining || 0)} 天`
                          : `${repair.daysRemaining} 天`}
                      </TableCell>
                      <TableCell>{repair.reportedBy.name}</TableCell>
                      <TableCell>{repair.assignedTo?.name || "-"}</TableCell>
                      <TableCell>{formatDateTime(repair.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {repair.status === "REPORTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(repair.id, "IN_PROGRESS")
                              }
                            >
                              开始处理
                            </Button>
                          )}
                          {repair.status === "IN_PROGRESS" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStatusChange(repair.id, "COMPLETED")
                              }
                            >
                              完成
                            </Button>
                          )}
                          {repair.photos.length > 0 && (
                            <Badge variant="outline">
                              {repair.photos.length} 张照片
                            </Badge>
                          )}
                        </div>
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
