"use client";

import { useState, useCallback } from "react";
import { Search, Filter, MessageSquare, CheckCircle, Clock } from "lucide-react";
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
import { formatDate, formatDateTime } from "@/lib/utils";
import type { PaginatedResult } from "@/lib/pagination";
import type { Feedback, Project, User } from "@prisma/client";

type FeedbackWithRelations = Feedback & {
  project: Pick<Project, "id" | "name">;
  client: Pick<User, "id" | "name" | "avatarUrl">;
  resolvedBy: Pick<User, "id" | "name"> | null;
};

export function FeedbackManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);
  const pageSize = 10;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (showUnresolvedOnly) params.set("resolved", "false");
    return `/api/feedbacks?${params.toString()}`;
  }, [page, search, categoryFilter, showUnresolvedOnly]);

  const { data, loading, error, refetch } = useApi<PaginatedResult<FeedbackWithRelations>>(
    buildUrl()
  );

  const resolveMutation = useMutation<
    { id: string; resolution: string; resolvedById: string },
    Feedback
  >("/api/feedbacks", "PUT", {
    onSuccess: () => {
      refetch();
    },
  });

  const totalCount = data?.total || 0;
  const unresolvedCount =
    data?.data.filter((f) => !f.resolvedAt).length || 0;
  const resolvedCount =
    data?.data.filter((f) => f.resolvedAt).length || 0;
  const avgRating =
    data?.data
      .filter((f) => f.rating !== null)
      .reduce((sum, f) => sum + (f.rating || 0), 0) /
      (data?.data.filter((f) => f.rating !== null).length || 1);

  const handleResolve = (feedbackId: string) => {
    const resolution = window.prompt("请输入解决方案：");
    if (resolution) {
      resolveMutation.mutate({
        id: feedbackId,
        resolution,
        resolvedById: "current-user-id",
      });
    }
  };

  const categories = [
    { value: "design", label: "设计问题" },
    { value: "construction", label: "施工问题" },
    { value: "material", label: "材料问题" },
    { value: "schedule", label: "进度问题" },
    { value: "service", label: "服务问题" },
    { value: "other", label: "其他" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">客户反馈</h1>
          <p className="text-muted-foreground">
            汇总所有客户反馈，及时处理并跟进解决情况
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总反馈数</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              {totalCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">累计收到</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>待处理</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              {unresolvedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">需要跟进</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已解决</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              {resolvedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">已处理完成</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均评分</CardDescription>
            <CardTitle className="text-2xl">
              {avgRating.toFixed(1)}
              <span className="text-lg text-yellow-500 ml-1">★</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">客户满意度</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>反馈列表</CardTitle>
            <div className="flex items-center gap-3">
              <Button
                variant={showUnresolvedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnresolvedOnly(!showUnresolvedOnly)}
              >
                <Clock className="mr-2 h-4 w-4" />
                {showUnresolvedOnly ? "显示全部" : "仅显示待处理"}
              </Button>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">所有类别</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索反馈..."
                  className="pl-8 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
              <div className="text-muted-foreground">暂无反馈记录</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户</TableHead>
                    <TableHead>项目</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>评分</TableHead>
                    <TableHead>反馈内容</TableHead>
                    <TableHead>解决方案</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>反馈时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {feedback.client.name?.[0] || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{feedback.client.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{feedback.project.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {categories.find((c) => c.value === feedback.category)
                            ?.label || feedback.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {feedback.rating ? (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < (feedback.rating || 0)
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {feedback.content}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {feedback.resolution || "-"}
                      </TableCell>
                      <TableCell>
                        {feedback.resolvedAt ? (
                          <Badge variant="success">已解决</Badge>
                        ) : (
                          <Badge variant="warning">待处理</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(feedback.createdAt)}</TableCell>
                      <TableCell>
                        {!feedback.resolvedAt && (
                          <Button
                            size="sm"
                            onClick={() => handleResolve(feedback.id)}
                          >
                            处理
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
