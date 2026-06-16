"use client";

import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Star,
  Loader2,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_MAP: Record<string, { label: string; variant: "pending" | "in_progress" | "pending_review" | "closed" }> = {
  PENDING: { label: "待处理", variant: "pending" },
  IN_PROGRESS: { label: "处理中", variant: "in_progress" },
  PENDING_REVIEW: { label: "待评价", variant: "pending_review" },
  CLOSED: { label: "已关闭", variant: "closed" },
};

const URGENCY_MAP: Record<string, { label: string; variant: "critical" | "high" | "medium" | "low" }> = {
  CRITICAL: { label: "紧急", variant: "critical" },
  HIGH: { label: "高", variant: "high" },
  MEDIUM: { label: "中", variant: "medium" },
  LOW: { label: "低", variant: "low" },
};

const CATEGORY_MAP: Record<string, string> = {
  PRODUCT: "产品",
  SERVICE: "服务",
  BILLING: "账单",
  TECHNICAL: "技术",
  OTHER: "其他",
};

function RatingForm({ feedbackId, onDone }: { feedbackId: string; onDone: () => void }) {
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rateMutation = trpc.feedback.rate.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onDone();
    },
  });

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm mt-2">
        <Star className="h-4 w-4 fill-current" />
        感谢您的评价
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
      <p className="text-sm text-slate-600">请为本次服务评分：</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            className="p-0.5"
            onMouseEnter={() => setHoveredScore(s)}
            onMouseLeave={() => setHoveredScore(0)}
            onClick={() => setScore(s)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                s <= (hoveredScore || score)
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
        placeholder="请输入您的评价（可选）"
        rows={2}
      />
      <Button
        size="sm"
        variant="primary"
        loading={rateMutation.isPending}
        disabled={score === 0}
        onClick={() =>
          rateMutation.mutate({ feedbackId, score, comment: comment || undefined })
        }
      >
        提交评价
      </Button>
    </div>
  );
}

export default function MyFeedbackPage() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = trpc.feedback.getMyFeedback.useQuery({
    page,
    limit: 10,
  });

  const utils = trpc.useUtils();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <EmptyState
          icon={MessageSquare}
          title="暂无反馈"
          description="您还没有提交过反馈，现在就去提交一条吧"
          action={
            <Button variant="primary" onClick={() => (window.location.href = "/feedback/submit")}>
              <Plus className="h-4 w-4 mr-1" />
              提交反馈
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">我的反馈</h1>
        <Button variant="primary" size="sm" onClick={() => (window.location.href = "/feedback/submit")}>
          <Plus className="h-4 w-4 mr-1" />
          新反馈
        </Button>
      </div>

      <div className="space-y-3">
        {data.items.map((item: Record<string, any>) => {
          const statusInfo = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING;
          const urgencyInfo = URGENCY_MAP[item.urgency] ?? URGENCY_MAP.MEDIUM;
          const isExpanded = expandedId === item.id;
          const hasRating = item.ratings && item.ratings.length > 0;

          return (
            <Card key={item.id} className="overflow-hidden">
              <CardBody
                className="cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      <Badge variant={urgencyInfo.variant}>{urgencyInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{CATEGORY_MAP[item.category] ?? item.category}</span>
                      <span>
                        {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm", {
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </div>
              </CardBody>

              {isExpanded && (
                <div className="px-6 pb-5 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">
                    {item.description}
                  </p>

                  {item._count.attachments > 0 && (
                    <p className="text-xs text-slate-400">
                      包含 {item._count.attachments} 个附件
                    </p>
                  )}

                  {item.status === "PENDING_REVIEW" && !hasRating && (
                    <RatingForm
                      feedbackId={item.id}
                      onDone={() => utils.feedback.getMyFeedback.invalidate()}
                    />
                  )}

                  {hasRating && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-amber-500">
                      {item.ratings.map((r: any) =>
                        Array.from({ length: r.score }).map((_, i) => (
                          <Star key={`${r.id}-${i}`} className="h-3.5 w-3.5 fill-current" />
                        ))
                      )}
                      <span className="text-slate-400 ml-1">已评价</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <span className="text-sm text-slate-500">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
