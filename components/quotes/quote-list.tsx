"use client";

import { useState, useCallback } from "react";
import { Search, Filter, Download, Plus, Eye, Check, X } from "lucide-react";
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
import { QuoteStatusBadge } from "@/components/ui/status-badges";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaginatedResult } from "@/lib/pagination";
import type { Quote, Project, User } from "@prisma/client";

type QuoteWithRelations = Quote & {
  project: Pick<Project, "id" | "name">;
  confirmedBy: Pick<User, "id" | "name"> | null;
  _count: { versionHistory: number };
};

interface QuoteListProps {
  designerId?: string;
  showConfirmButton?: boolean;
}

export function QuoteList({ designerId, showConfirmButton = false }: QuoteListProps) {
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
    return `/api/quotes?${params.toString()}`;
  }, [page, designerId, search, statusFilter]);

  const { data, loading, error, refetch } = useApi<PaginatedResult<QuoteWithRelations>>(
    buildUrl()
  );

  const confirmMutation = useMutation<
    { confirmedById: string; note?: string },
    Quote
  >("/api/quotes", "POST", {
    onSuccess: () => {
      refetch();
    },
  });

  const handleConfirm = (quoteId: string) => {
    const confirmedById = "current-user-id";
    confirmMutation.mutate({ confirmedById });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">报价管理</h1>
          <p className="text-muted-foreground">
            管理项目报价，确认报价后将自动更新项目预算
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新建报价
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>报价列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索报价..."
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
          <CardDescription>
            点击"确认"按钮确认报价，确认后将自动记录预算变更
          </CardDescription>
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
              <div className="text-muted-foreground mb-2">暂无报价记录</div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                创建第一个报价
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>报价编号</TableHead>
                    <TableHead>项目名称</TableHead>
                    <TableHead>版本</TableHead>
                    <TableHead>总金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>确认人</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        Q-{quote.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>{quote.project.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">v{quote.version}</Badge>
                        {quote._count.versionHistory > 1 && (
                          <Badge variant="secondary" className="ml-2">
                            {quote._count.versionHistory}个版本
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(quote.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={quote.status} />
                      </TableCell>
                      <TableCell>{quote.confirmedBy?.name || "-"}</TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            查看
                          </Button>
                          {showConfirmButton &&
                            quote.status === "PENDING_CONFIRMATION" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirm(quote.id)}
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
