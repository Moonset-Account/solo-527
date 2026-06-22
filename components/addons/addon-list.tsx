"use client";

import { useState, useCallback } from "react";
import { Search, Filter, Plus, Eye, Check, X, TrendingUp } from "lucide-react";
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
import { AddonStatusBadge } from "@/components/ui/status-badges";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaginatedResult } from "@/lib/pagination";
import type { Addon, Project, User } from "@prisma/client";

type AddonWithRelations = Addon & {
  project: Pick<Project, "id" | "name">;
  proposedBy: Pick<User, "id" | "name">;
  confirmedBy: Pick<User, "id" | "name"> | null;
  _count: { versionHistory: number };
};

interface AddonListProps {
  designerId?: string;
  showConfirmButton?: boolean;
}

export function AddonList({ designerId, showConfirmButton = false }: AddonListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const pageSize = 10;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (designerId) params.set("designerId", designerId);
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    return `/api/addons?${params.toString()}`;
  }, [page, designerId, search, statusFilter]);

  const { data, loading, error, refetch } = useApi<PaginatedResult<AddonWithRelations>>(
    buildUrl()
  );

  const confirmMutation = useMutation<
    { confirmedById: string; note?: string },
    Addon
  >("", "POST", {
    onSuccess: () => {
      refetch();
    },
  });

  const handleConfirm = (addonId: string) => {
    const confirmedById = "current-user-id";
    confirmMutation.mutate({ confirmedById }, `/api/addons/${addonId}?action=confirm`);
  };

  const pendingAmount =
    data?.data
      .filter((a) => a.status === "PENDING_CONFIRMATION")
      .reduce((sum, a) => sum + a.amount, 0) || 0;

  const confirmedAmount =
    data?.data
      .filter((a) => a.status === "CONFIRMED")
      .reduce((sum, a) => sum + a.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">增项管理</h1>
          <p className="text-muted-foreground">
            管理项目增项，确认后将自动更新项目预算并生成变更记录
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新增增项
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>待确认增项金额</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {formatCurrency(pendingAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data?.data.filter((a) => a.status === "PENDING_CONFIRMATION").length || 0} 个增项待确认
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已确认增项金额</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(confirmedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data?.data.filter((a) => a.status === "CONFIRMED").length || 0} 个增项已确认
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>增项总额</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {formatCurrency(pendingAmount + confirmedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              共 {data?.total || 0} 个增项记录
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>增项列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索增项..."
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
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-muted-foreground mb-2">暂无增项记录</div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                创建第一个增项
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>增项名称</TableHead>
                    <TableHead>项目名称</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>版本</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交人</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((addon) => (
                    <TableRow key={addon.id}>
                      <TableCell className="font-medium">{addon.name}</TableCell>
                      <TableCell>{addon.project.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {addon.reason}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        +{formatCurrency(addon.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{addon.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <AddonStatusBadge status={addon.status} />
                      </TableCell>
                      <TableCell>{addon.proposedBy.name}</TableCell>
                      <TableCell>{formatDate(addon.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            详情
                          </Button>
                          {showConfirmButton &&
                            addon.status === "PENDING_CONFIRMATION" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirm(addon.id)}
                                  disabled={confirmMutation.loading}
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  确认
                                </Button>
                                <Button variant="destructive" size="sm">
                                  <X className="mr-1 h-4 w-4" />
                                  拒绝
                                </Button>
                              </>
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
