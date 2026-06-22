"use client";

import { useState, useCallback } from "react";
import { Search, Filter, Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
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
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { PaginatedResult } from "@/lib/pagination";
import type { BudgetChange, Project, User } from "@prisma/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type BudgetChangeWithRelations = BudgetChange & {
  project: Pick<Project, "id" | "name">;
  createdBy: Pick<User, "id" | "name" | "role">;
};

interface BudgetTrackingProps {
  showExport?: boolean;
}

export function BudgetTracking({ showExport = true }: BudgetTrackingProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [changeType, setChangeType] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const pageSize = 10;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (changeType) params.set("changeType", changeType);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return `/api/budget-changes?${params.toString()}`;
  }, [page, search, changeType, startDate, endDate]);

  const { data, loading, error } = useApi<
    PaginatedResult<BudgetChangeWithRelations> & {
      summary: { totalAmount: number; totalChanges: number };
    }
  >(buildUrl());

  const chartData = data?.data
    .slice(0, 10)
    .reverse()
    .map((bc) => ({
      name: bc.project.name.slice(0, 8),
      变更金额: bc.amount.toNumber(),
      变更后预算: bc.newBudget.toNumber(),
    }));

  const overBudgetProjects =
    data?.data.filter((bc) => bc.amount.toNumber() > 0).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">预算追踪</h1>
          <p className="text-muted-foreground">
            实时监控所有项目的预算变更，追踪预算超支情况
          </p>
        </div>
        {showExport && (
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams();
              if (startDate) params.set("startDate", startDate);
              if (endDate) params.set("endDate", endDate);
              window.open(`/api/reports?type=budget&${params.toString()}`, "_blank");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            导出预算报表
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>预算变更总额</CardDescription>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${
                (data?.summary.totalAmount || 0) >= 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {(data?.summary.totalAmount || 0) >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {formatCurrency(Math.abs(data?.summary.totalAmount || 0))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              共 {data?.summary.totalChanges || 0} 次变更
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>增项确认金额</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {formatCurrency(
                data?.data
                  .filter((bc) => bc.changeType === "ADDON_CONFIRMED")
                  .reduce((sum, bc) => sum + bc.amount.toNumber(), 0) || 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              预算增加主要来源
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>超支项目数</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {overBudgetProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">需要重点关注</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均变更金额</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(
                data?.summary.totalChanges
                  ? (data.summary.totalAmount || 0) / data.summary.totalChanges
                  : 0
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">每次变更平均影响</div>
          </CardContent>
        </Card>
      </div>

      {chartData && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>预算变更趋势</CardTitle>
            <CardDescription>最近10次预算变更情况</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="变更金额" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>预算变更记录</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索..."
                  className="pl-8 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Input
                type="date"
                className="w-40"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                className="w-40"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                更多筛选
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
              <div className="text-muted-foreground">暂无预算变更记录</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目名称</TableHead>
                    <TableHead>变更类型</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>原预算</TableHead>
                    <TableHead>新预算</TableHead>
                    <TableHead>变更金额</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>变更时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((bc) => (
                    <TableRow key={bc.id}>
                      <TableCell className="font-medium">
                        {bc.project.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            bc.changeType === "ADDON_CONFIRMED"
                              ? "warning"
                              : bc.changeType === "QUOTE_CONFIRMED"
                              ? "info"
                              : "default"
                          }
                        >
                          {bc.changeType === "ADDON_CONFIRMED"
                            ? "增项确认"
                            : bc.changeType === "QUOTE_CONFIRMED"
                            ? "报价确认"
                            : bc.changeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {bc.description}
                      </TableCell>
                      <TableCell>{formatCurrency(bc.oldBudget)}</TableCell>
                      <TableCell>{formatCurrency(bc.newBudget)}</TableCell>
                      <TableCell
                        className={`font-semibold ${
                          bc.amount.toNumber() >= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {bc.amount.toNumber() >= 0 ? "+" : ""}
                        {formatCurrency(bc.amount)}
                      </TableCell>
                      <TableCell>{bc.createdBy.name}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {bc.note || "-"}
                      </TableCell>
                      <TableCell>{formatDateTime(bc.createdAt)}</TableCell>
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
