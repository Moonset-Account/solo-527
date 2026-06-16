"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import {
  Clock,
  Loader2,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const CATEGORIES = ["PRODUCT", "SERVICE", "BILLING", "TECHNICAL", "OTHER"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT: "产品", SERVICE: "服务", BILLING: "账单", TECHNICAL: "技术", OTHER: "其他",
};
const STATUS_CFG: Record<string, { label: string; variant: "pending" | "in_progress" | "closed" }> = {
  PENDING: { label: "待处理", variant: "pending" },
  IN_PROGRESS: { label: "进行中", variant: "in_progress" },
  COMPLETED: { label: "已完成", variant: "closed" },
};

export default function AttributionPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", rootCause: "", assigneeId: "", dueDate: "" });
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);

  const { data: feedbackData } = trpc.feedback.list.useQuery({ limit: 100 });
  const { data: improvementData, refetch } = trpc.improvement.list.useQuery({ limit: 100 });
  const createMut = trpc.improvement.create.useMutation({
    onSuccess: () => { refetch(); setModalOpen(false); setForm({ title: "", description: "", rootCause: "", assigneeId: "", dueDate: "" }); setSelectedFeedbacks([]); },
  });
  const updateMut = trpc.improvement.update.useMutation({ onSuccess: () => refetch() });

  const byCategory = useMemo(() => {
    const groups: Record<string, number> = {};
    CATEGORIES.forEach(c => groups[c] = 0);
    feedbackData?.items.forEach(f => { groups[f.category] = (groups[f.category] || 0) + 1; });
    return groups;
  }, [feedbackData]);

  const byRootCause = useMemo(() => {
    const groups: Record<string, number> = {};
    feedbackData?.items.forEach(f => {
      const cause = f.rootCause || "未归因";
      groups[cause] = (groups[cause] || 0) + 1;
    });
    return groups;
  }, [feedbackData]);

  const byStatus = useMemo(() => {
    type ImprovementItem = NonNullable<typeof improvementData>["items"][number];
    const result: Record<string, ImprovementItem[]> = { PENDING: [], IN_PROGRESS: [], COMPLETED: [] };
    improvementData?.items.forEach(i => { if (result[i.status]) result[i.status].push(i); });
    return result;
  }, [improvementData]);

  const handleCreate = () => {
    createMut.mutate({
      ...form,
      dueDate: new Date(form.dueDate),
      relatedFeedbackIds: selectedFeedbacks.length > 0 ? selectedFeedbacks : undefined,
    });
  };

  const moveStatus = (id: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => {
    updateMut.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">反馈归因概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIES.map(cat => (
            <StatCard key={cat} value={byCategory[cat] || 0} label={CATEGORY_LABELS[cat]} />
          ))}
        </div>
      </div>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-slate-900 mb-3">根因分布</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(byRootCause).map(([cause, count]) => (
              <div key={cause} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">{cause}</span>
                <Badge variant="medium">{count}</Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">改进动作</h2>
          <Button onClick={() => setModalOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />新建改进</Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {(["PENDING", "IN_PROGRESS", "COMPLETED"] as const).map(status => (
            <div key={status} className="bg-slate-50 rounded-lg p-4 min-h-[200px]">
              <div className="flex items-center gap-2 mb-3">
                {status === "PENDING" && <Clock className="h-4 w-4 text-amber-500" />}
                {status === "IN_PROGRESS" && <Loader2 className="h-4 w-4 text-blue-500" />}
                {status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                <span className="font-medium text-slate-700">{STATUS_CFG[status].label}</span>
                <Badge variant={STATUS_CFG[status].variant}>{byStatus[status]?.length || 0}</Badge>
              </div>
              <div className="space-y-3">
                {byStatus[status]?.map(imp => (
                  <Card key={imp.id} className="!shadow-none">
                    <CardBody className="!p-3 space-y-2">
                      <p className="font-medium text-sm text-slate-900">{imp.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{imp.assignee?.name || "未指派"}</span>
                        <span>·</span>
                        <span>{new Date(imp.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="medium">{imp.feedbacks?.length || 0} 条反馈</Badge>
                        <div className="flex gap-1">
                          {status !== "PENDING" && (
                            <button onClick={() => moveStatus(imp.id, status === "IN_PROGRESS" ? "PENDING" : "IN_PROGRESS")} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {status !== "COMPLETED" && (
                            <button onClick={() => moveStatus(imp.id, status === "PENDING" ? "IN_PROGRESS" : "COMPLETED")} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
                {(!byStatus[status] || byStatus[status].length === 0) && (
                  <p className="text-center text-xs text-slate-400 py-6">暂无数据</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="新建改进动作">
        <div className="space-y-4">
          <div><label className="label">标题</label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div><label className="label">描述</label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div><label className="label">根因</label><Input value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">指派人ID</label><Input value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))} /></div>
            <div><label className="label">截止日期</label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label">关联反馈</label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
              {feedbackData?.items.map(fb => (
                <label key={fb.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={selectedFeedbacks.includes(fb.id)} onChange={e => {
                    if (e.target.checked) setSelectedFeedbacks(s => [...s, fb.id]);
                    else setSelectedFeedbacks(s => s.filter(id => id !== fb.id));
                  }} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  <span className="text-slate-700 truncate">{fb.title}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleCreate} loading={createMut.isPending}>创建</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
