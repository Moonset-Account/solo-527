"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BookOpen, MessageSquare, Star, Wrench,
  CheckCircle2, Link as LinkIcon, User, Calendar,
} from "lucide-react";

const TYPE_TABS = [
  { key: "KNOWLEDGE_VERSION", label: "知识版本", icon: BookOpen },
  { key: "UNCLOSED_FEEDBACK", label: "未关闭反馈", icon: MessageSquare },
  { key: "LOW_RATING", label: "低分评价", icon: Star },
  { key: "IMPROVEMENT_DUE", label: "改进到期", icon: Wrench },
] as const;

const PRIORITY_VARIANT: Record<string, "low" | "medium" | "high" | "critical"> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical",
};

export default function TodosPage() {
  const [activeType, setActiveType] = useState<string>("KNOWLEDGE_VERSION");
  const [page, setPage] = useState(1);
  const [completeModal, setCompleteModal] = useState<{ id: string; title: string } | null>(null);
  const [result, setResult] = useState("");

  const utils = trpc.useUtils();
  const { data, isPending } = trpc.todo.list.useQuery({
    type: activeType as any,
    page,
    limit: 12,
  });
  const completeMutation = trpc.todo.complete.useMutation({
    onSuccess: () => {
      utils.todo.list.invalidate();
      setCompleteModal(null);
      setResult("");
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">待办中心</h1>

      <div className="flex gap-1 border-b border-slate-200">
        {TYPE_TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveType(tab.key); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeType === tab.key ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="ml-2 text-sm">加载中...</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="暂无待办" description="当前分类下没有待办事项" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((todo) => (
            <Card key={todo.id} className="hover:border-amber-200 transition-colors">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">{todo.title}</h3>
                  <Badge variant={PRIORITY_VARIANT[todo.priority]}>{todo.priority}</Badge>
                </div>

                {todo.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{todo.description}</p>
                )}

                {todo.relatedFeedback && (
                  <a href={`/feedback/${todo.relatedFeedback.id}`}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700">
                    <LinkIcon className="h-3 w-3" />{todo.relatedFeedback.title}
                  </a>
                )}
                {todo.relatedKnowledge && (
                  <a href={`/knowledge/${todo.relatedKnowledge.id}`}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700">
                    <LinkIcon className="h-3 w-3" />{todo.relatedKnowledge.title} (v{todo.relatedKnowledge.version})
                  </a>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {todo.assignee && (
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{todo.assignee.name}</span>
                  )}
                  {todo.dueDate && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(todo.dueDate).toLocaleDateString()}</span>
                  )}
                </div>

                {todo.status !== "COMPLETED" && (
                  <Button variant="primary" size="sm" className="w-full"
                    onClick={() => setCompleteModal({ id: todo.id, title: todo.title })}
                  >完成</Button>
                )}
                {todo.status === "COMPLETED" && (
                  <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />已完成
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <span>{page} / {data?.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      )}

      <Modal isOpen={!!completeModal} onClose={() => setCompleteModal(null)} title="完成待办">
        <p className="text-sm text-slate-600 mb-3">{completeModal?.title}</p>
        <label className="label">处理结果</label>
        <Textarea placeholder="请输入处理结果..." value={result} onChange={(e) => setResult(e.target.value)} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setCompleteModal(null)}>取消</Button>
          <Button variant="primary" disabled={!result.trim() || completeMutation.isPending} loading={completeMutation.isPending}
            onClick={() => completeModal && completeMutation.mutate({ id: completeModal.id, result })}
          >确认完成</Button>
        </div>
      </Modal>
    </div>
  );
}
