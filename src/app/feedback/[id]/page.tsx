"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Timeline } from "@/components/ui/timeline";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeft, Clock, User, Tag, AlertTriangle, FileText,
  Paperclip, Star, MessageSquare, Activity, BookOpen,
  ThumbsUp, ThumbsDown, CheckCircle2, XCircle,
} from "lucide-react";

const STATUS_VARIANT: Record<string, "pending" | "in_progress" | "pending_review" | "closed"> = {
  PENDING: "pending", IN_PROGRESS: "in_progress", PENDING_REVIEW: "pending_review", CLOSED: "closed",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待处理", IN_PROGRESS: "处理中", PENDING_REVIEW: "待审核", CLOSED: "已关闭",
};

const NEXT_STATUS: Record<string, { key: string; label: string }[]> = {
  PENDING: [{ key: "IN_PROGRESS", label: "开始处理" }],
  IN_PROGRESS: [{ key: "PENDING_REVIEW", label: "提交审核" }],
  PENDING_REVIEW: [{ key: "CLOSED", label: "确认关闭" }, { key: "IN_PROGRESS", label: "退回处理" }],
  CLOSED: [],
};

const TABS = [
  { key: "notes", label: "备注", icon: MessageSquare },
  { key: "attachments", label: "附件", icon: Paperclip },
  { key: "knowledge", label: "知识命中", icon: BookOpen },
  { key: "ratings", label: "评分", icon: Star },
  { key: "response", label: "响应时间", icon: Activity },
  { key: "audit", label: "审计时间线", icon: Clock },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("notes");
  const [noteContent, setNoteContent] = useState("");
  const [result, setResult] = useState("");
  const [rootCause, setRootCause] = useState("");

  const { data: feedback, isPending } = trpc.feedback.getById.useQuery({ id });
  const { data: entityHistory } = trpc.auditLog.getEntityHistory.useQuery(
    { entityId: id, entityType: "FEEDBACK" },
    { enabled: activeTab === "audit" }
  );
  const { data: knowledgeList } = trpc.knowledge.list.useQuery({ page: 1, limit: 50 });
  const utils = trpc.useUtils();

  const updateMutation = trpc.feedback.update.useMutation({
    onSuccess: () => utils.feedback.getById.invalidate({ id }),
  });
  const addNoteMutation = trpc.feedback.addNote.useMutation({
    onSuccess: () => { setNoteContent(""); utils.feedback.getById.invalidate({ id }); },
  });

  if (isPending) return <div className="flex items-center justify-center py-20 text-slate-400">加载中...</div>;
  if (!feedback) return <EmptyState icon={FileText} title="反馈不存在" description="未找到该反馈记录" />;

  const nextActions = NEXT_STATUS[feedback.status] ?? [];

  return (
    <div className="space-y-4">
      <button onClick={() => router.push("/feedback/board")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-amber-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> 返回列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{feedback.title}</h1>
                <p className="text-sm text-slate-500 mt-1 font-mono-data">{feedback.id}</p>
              </div>
              <Badge variant={STATUS_VARIANT[feedback.status]}>{STATUS_LABEL[feedback.status]}</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{feedback.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /><span className="text-slate-500">分类:</span><span className="font-medium">{feedback.category}</span></div>
                <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-slate-400" /><span className="text-slate-500">紧急度:</span><Badge variant={feedback.urgency.toLowerCase() as "low" | "medium" | "high" | "critical"}>{feedback.urgency}</Badge></div>
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /><span className="text-slate-500">客户:</span><span className="font-medium">{feedback.customer?.name}</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /><span className="text-slate-500">创建:</span><span>{new Date(feedback.createdAt).toLocaleString()}</span></div>
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-1 border-b border-slate-200">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />{tab.label}
              </button>
            ))}
          </div>

          <Card>
            <CardBody>
              {activeTab === "notes" && (
                <div className="space-y-4">
                  {feedback.notes?.map((note: any) => (
                    <div key={note.id} className="border-b border-slate-100 pb-3 last:border-0">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <span className="font-medium text-slate-600">{note.author?.name}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{note.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea placeholder="添加备注..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="min-h-[60px]" />
                    <Button size="sm" disabled={!noteContent.trim() || addNoteMutation.isPending} loading={addNoteMutation.isPending}
                      onClick={() => addNoteMutation.mutate({ feedbackId: id, content: noteContent })}
                    >发送</Button>
                  </div>
                </div>
              )}

              {activeTab === "attachments" && (
                feedback.attachments?.length > 0 ? (
                  <div className="space-y-2">
                    {feedback.attachments.map((att: any) => (
                      <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700">
                        <Paperclip className="h-4 w-4 text-slate-400" />{att.name}
                        <span className="text-xs text-slate-400 ml-auto">{(att.size / 1024).toFixed(1)} KB</span>
                      </a>
                    ))}
                  </div>
                ) : <EmptyState icon={Paperclip} title="暂无附件" description="该反馈没有附件" />
              )}

              {activeTab === "knowledge" && (
                feedback.knowledgeHits?.length > 0 ? (
                  <div className="space-y-3">
                    {feedback.knowledgeHits.map((hit: any) => (
                      <div key={hit.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{hit.knowledgeEntry?.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            命中时间: {new Date(hit.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {hit.helpful ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                              <ThumbsUp className="h-3 w-3" /> 有效
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded">
                              <ThumbsDown className="h-3 w-3" /> 无效
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState icon={BookOpen} title="暂无知识命中" description="该反馈尚未关联知识条目" />
              )}

              {activeTab === "ratings" && (
                feedback.ratings?.length > 0 ? (
                  <div className="space-y-2">
                    {feedback.ratings.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 p-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-0.5">{Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < r.score ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                        ))}</div>
                        <span className="text-sm font-medium text-slate-700">{r.score}/5</span>
                        {r.comment && <span className="text-sm text-slate-500">- {r.comment}</span>}
                      </div>
                    ))}
                  </div>
                ) : <EmptyState icon={Star} title="暂无评分" description="该反馈尚未收到评分" />
              )}

              {activeTab === "response" && (
                feedback.responseRecords?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 text-slate-500">
                      <th className="py-2 text-left font-medium">类型</th>
                      <th className="py-2 text-left font-medium">响应时长</th>
                      <th className="py-2 text-left font-medium">记录时间</th>
                    </tr></thead>
                    <tbody>
                      {feedback.responseRecords.map((rec: any) => (
                        <tr key={rec.id} className="border-b border-slate-50">
                          <td className="py-2">{rec.type === "FIRST_RESPONSE" ? "首次响应" : "完整解决"}</td>
                          <td className="py-2 font-mono-data">{rec.responseMinutes} 分钟</td>
                          <td className="py-2 text-slate-500">{new Date(rec.recordedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <EmptyState icon={Activity} title="暂无响应记录" description="该反馈尚未记录响应时间" />
              )}

              {activeTab === "audit" && (
                (entityHistory && entityHistory.changes.length > 0) ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">共 {entityHistory.changes.length} 条变更记录</p>
                    <Badge variant="medium">{entityHistory.logs.length} 次操作</Badge>
                  </div>
                    <div className="space-y-3">
                      {entityHistory.changes.map((change: any, index: number) => (
                        <div
                          key={`${change.logId}-${index}`}
                          className="flex gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <div
                            className="w-2 h-2 rounded-full mt-2 shrink-0"
                            style={{
                              backgroundColor:
                                change.action === "CREATED"
                                  ? "#F59E0B"
                                  : change.action.includes("STATUS")
                                    ? "#3B82F6"
                                    : change.action === "RESULT_UPDATED"
                                      ? "#10B981"
                                      : "#8B5CF6",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                              <span className="font-medium text-slate-600">{change.userName}</span>
                              <span>·</span>
                              <span>{change.actionLabel}</span>
                              <span>·</span>
                              <span>{new Date(change.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-slate-700">
                              <span className="font-medium text-slate-600">{change.field}：</span>
                              {change.oldValue !== null && (
                                <>
                                  <span className="line-through text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded text-xs">
                                    {String(change.oldValue)}
                                  </span>
                                  <span className="mx-1.5 text-slate-400">→</span>
                                </>
                              )}
                              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs">
                                {String(change.newValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <EmptyState icon={Clock} title="暂无审计记录" description="该反馈暂无审计日志" />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-slate-900">操作</h3></CardHeader>
            <CardBody className="space-y-3">
              {nextActions.map((action) => (
                <Button key={action.key} variant="primary" className="w-full"
                  loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id, status: action.key as any })}
                >{action.label}</Button>
              ))}
              {feedback.status === "CLOSED" && (
                <p className="text-sm text-slate-400 text-center py-2">该反馈已关闭</p>
              )}
              <div>
                <label className="label">处理结果</label>
                <Textarea placeholder="输入处理结果..." value={result} onChange={(e) => setResult(e.target.value)} />
                {result.trim() && (
                  <Button variant="secondary" size="sm" className="mt-2 w-full" loading={updateMutation.isPending}
                    onClick={() => { updateMutation.mutate({ id, result }); setResult(""); }}
                  >保存结果</Button>
                )}
              </div>
              <div>
                <label className="label">根本原因</label>
                <Textarea placeholder="输入根本原因..." value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
                {rootCause.trim() && (
                  <Button variant="secondary" size="sm" className="mt-2 w-full" loading={updateMutation.isPending}
                    onClick={() => { updateMutation.mutate({ id, rootCause }); setRootCause(""); }}
                  >保存原因</Button>
                )}
              </div>
              <div>
                <label className="label">关联知识条目</label>
                <Select className="text-sm" defaultValue={feedback.knowledgeEntryId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      updateMutation.mutate({ id, knowledgeEntryId: value, knowledgeHelpful: true });
                    }
                  }}
                >
                  <option value="">未关联</option>
                  {knowledgeList?.items.map((k: any) => (
                    <option key={k.id} value={k.id}>{k.title}</option>
                  ))}
                </Select>
              </div>

              {feedback.knowledgeEntryId && feedback.status !== "CLOSED" && (
                <div>
                  <label className="label">知识命中效果</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => updateMutation.mutate({ id, knowledgeEntryId: feedback.knowledgeEntryId!, knowledgeHelpful: true })}
                    >
                      <ThumbsUp className="h-3.5 w-3.5 mr-1" /> 有效
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => updateMutation.mutate({ id, knowledgeEntryId: feedback.knowledgeEntryId!, knowledgeHelpful: false })}
                    >
                      <ThumbsDown className="h-3.5 w-3.5 mr-1" /> 无效
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
