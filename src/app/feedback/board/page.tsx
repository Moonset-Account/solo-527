"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_TABS = [
  { key: "ALL", label: "全部" },
  { key: "PENDING", label: "待处理" },
  { key: "IN_PROGRESS", label: "处理中" },
  { key: "PENDING_REVIEW", label: "待审核" },
  { key: "CLOSED", label: "已关闭" },
] as const;

const CATEGORIES = ["PRODUCT", "SERVICE", "BILLING", "TECHNICAL", "OTHER"] as const;
const URGENCIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const CATEGORY_LABEL: Record<string, string> = {
  PRODUCT: "产品", SERVICE: "服务", BILLING: "账单", TECHNICAL: "技术", OTHER: "其他",
};

const STATUS_VARIANT: Record<string, "pending" | "in_progress" | "pending_review" | "closed"> = {
  PENDING: "pending", IN_PROGRESS: "in_progress", PENDING_REVIEW: "pending_review", CLOSED: "closed",
};

const URGENCY_VARIANT: Record<string, "low" | "medium" | "high" | "critical"> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical",
};

export default function FeedbackBoardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = trpc.feedback.list.useQuery({
    ...(status !== "ALL" && { status: status as "PENDING" | "IN_PROGRESS" | "PENDING_REVIEW" | "CLOSED" }),
    ...(category && { category: category as typeof CATEGORIES[number] }),
    ...(urgency && { urgency: urgency as typeof URGENCIES[number] }),
    page,
    limit,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">反馈工作台</h1>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              status === tab.key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <Select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="w-28 text-sm"
        >
          <option value="">所有分类</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </Select>
        <Select
          value={urgency}
          onChange={(e) => { setUrgency(e.target.value); setPage(1); }}
          className="w-28 text-sm"
        >
          <option value="">所有紧急度</option>
          {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
        </Select>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="ml-2 text-sm">加载中...</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={MessageSquare} title="暂无反馈" description="当前筛选条件下没有反馈记录" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">标题</th>
                  <th className="px-4 py-3 text-left font-medium">客户</th>
                  <th className="px-4 py-3 text-left font-medium">负责人</th>
                  <th className="px-4 py-3 text-left font-medium">分类</th>
                  <th className="px-4 py-3 text-left font-medium">紧急度</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">创建时间</th>
                  <th className="px-4 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/feedback/${item.id}`)}
                    className="border-b border-slate-50 hover:bg-amber-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono-data text-xs text-slate-400">
                      {item.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.customer?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{item.assignee?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[item.category] ?? item.category}</td>
                    <td className="px-4 py-3"><Badge variant={URGENCY_VARIANT[item.urgency]}>{item.urgency}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[item.status]}>{STATUS_TABS.find(t => t.key === item.status)?.label ?? item.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/feedback/${item.id}`); }}>
                        查看
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
