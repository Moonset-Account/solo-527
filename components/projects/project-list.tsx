"use client";

import { useState, useCallback } from "react";
import { Search, Filter, Plus, Eye, Edit, Trash2 } from "lucide-react";
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
import { Pagination } from "@/components/ui/pagination";
import { ProjectStatusBadge } from "@/components/ui/status-badges";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { PaginatedResult } from "@/lib/pagination";
import type { Project, User } from "@prisma/client";

type ProjectWithRelations = Project & {
  designer: Pick<User, "id" | "name" | "avatarUrl">;
  client: Pick<User, "id" | "name" | "avatarUrl">;
  _count: {
    quotes: number;
    addons: number;
    repairs: number;
    feedbacks: number;
  };
};

export function ProjectList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const pageSize = 10;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    return `/api/projects?${params.toString()}`;
  }, [page, search, statusFilter]);

  const { data, loading, error, refetch } = useApi<PaginatedResult<ProjectWithRelations>>(
    buildUrl()
  );

  const totalBudget =
    data?.data.reduce((sum, p) => sum + p.currentBudget.toNumber(), 0) || 0;
  const totalSpent =
    data?.data.reduce((sum, p) => sum + p.totalSpent.toNumber(), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">项目管理</h1>
          <p className="text-muted-foreground">
            查看和管理所有项目，追踪进度和预算
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总项目数</CardDescription>
            <CardTitle className="text-2xl">{data?.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              进行中 {data?.data.filter((p) => p.status === "IN_PROGRESS").length || 0} 个
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总预算</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {formatCurrency(totalBudget)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              已支出 {formatCurrency(totalSpent)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>报价待确认</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {data?.data.filter((p) => p.status === "PENDING_QUOTE").length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">等待客户确认</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已完成</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {data?.data.filter((p) => p.status === "COMPLETED").length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">项目已交付</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>项目列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索项目..."
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
              <div className="text-muted-foreground mb-2">暂无项目</div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                创建第一个项目
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目名称</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>设计师</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>当前预算</TableHead>
                    <TableHead>预算偏差</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {project.address}
                      </TableCell>
                      <TableCell>{project.designer.name}</TableCell>
                      <TableCell>{project.client.name}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(project.currentBudget)}
                      </TableCell>
                      <TableCell
                        className={
                          project.budgetVariance.toNumber() > 0
                            ? "text-red-600 font-semibold"
                            : project.budgetVariance.toNumber() < 0
                            ? "text-green-600 font-semibold"
                            : ""
                        }
                      >
                        {project.budgetVariance.toNumber() > 0 ? "+" : ""}
                        {project.budgetVariance.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={project.status} />
                      </TableCell>
                      <TableCell>{formatDate(project.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/projects/${project.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-4 w-4" />
                              详情
                            </Button>
                          </Link>
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
