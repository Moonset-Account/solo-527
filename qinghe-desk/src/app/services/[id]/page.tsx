"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Users, Paperclip, MessageSquare, Send, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";

const statusMeta: Record<string, { label: string; variant: any; color: string }> = {
  PENDING: { label: "待审批", variant: "warning" as const, color: "bg-amber-500" },
  APPROVED: { label: "处理中", variant: "default" as const, color: "bg-pine-700" },
  COMPLETED: { label: "已完成", variant: "success" as const, color: "bg-emerald-500" },
  REJECTED: { label: "已驳回", variant: "destructive" as const, color: "bg-red-500" },
};

const flowSteps = ["PENDING", "APPROVED", "COMPLETED"];

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const { data: sr } = trpc.service.get.useQuery({ id: params.id });
  const utils = trpc.useUtils();
  const approveMut = trpc.service.approve.useMutation({ onSuccess: () => utils.service.get.invalidate() });
  const rejectMut = trpc.service.reject.useMutation({ onSuccess: () => utils.service.get.invalidate() });
  const completeMut = trpc.service.complete.useMutation({ onSuccess: () => utils.service.get.invalidate() });
  const { data: users = [] } = trpc.user.list.useQuery();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [note, setNote] = useState("");

  if (!sr) return <div className="p-8">加载中...</div>;

  const currentIdx = flowSteps.indexOf(sr.status);

  return (
    <div className="animate-fade-in">
      <Link href="/services" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-pine-700 mb-4">
        <ArrowLeft className="h-4 w-4" />返回服务申请
      </Link>
      <PageHeader
        title={`${sr.type} · ${sr.tenant?.name}`}
        description={`申请编号 #${sr.id.slice(-6).toUpperCase()}`}
        actions={
          sr.status === "PENDING" ? (
            <div className="flex gap-2">
              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><ThumbsDown className="h-4 w-4" />驳回</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>驳回申请</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div><Label>驳回原因 *</Label><Textarea className="mt-1" rows={4} value={note} onChange={(e) => setNote(e.target.value)} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRejectOpen(false)}>取消</Button>
                    <Button variant="destructive" onClick={() => rejectMut.mutate({ id: sr.id, reason: note })} disabled={!note}>确认驳回</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogTrigger asChild>
                  <Button><ThumbsUp className="h-4 w-4" />审批通过</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>分配处理人</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div><Label>处理人</Label>
                      <Select value={assigneeId} onValueChange={setAssigneeId}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="选择处理人（可选）" /></SelectTrigger>
                        <SelectContent>
                          {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApproveOpen(false)}>取消</Button>
                    <Button onClick={() => { approveMut.mutate({ id: sr.id, assigneeId: assigneeId || undefined }); }}>确认审批</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : sr.status === "APPROVED" ? (
            <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary"><CheckCircle2 className="h-4 w-4" />标记完成</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>处理结果</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div><Label>处理说明 *</Label><Textarea className="mt-1" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="描述具体处理过程、结果、时间等..." /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCompleteOpen(false)}>取消</Button>
                  <Button onClick={() => completeMut.mutate({ id: sr.id, result: note })} disabled={!note}>确认完成</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 card-border-left-green">
          <CardContent className="pt-6">
            <div className="mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">申请详情</p>
              <h2 className="font-serif text-2xl font-bold text-pine-900 mb-2">{sr.type}</h2>
              <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">{sr.description}</p>
            </div>

            <div className="mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">状态流转 · 时间回看</p>
              <div className="relative">
                <div className="absolute top-3 left-3 h-1 w-full max-w-md rounded-full bg-pine-100" />
                <div
                  className="absolute top-3 left-3 h-1 rounded-full bg-gradient-to-r from-pine-800 to-emerald-500 transition-all"
                  style={{ width: `calc(${(Math.max(currentIdx, 0) / (flowSteps.length - 1)) * 100}% - 1.5rem)` }}
                />
                <div className="relative flex justify-between max-w-md">
                  {flowSteps.map((step, i) => {
                    const sm = statusMeta[step];
                    const done = i <= currentIdx;
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                          done ? sm.color : "bg-zinc-200"
                        }`}>
                          {done && i === currentIdx && sr.status !== "COMPLETED" && <Clock className="h-3.5 w-3.5 text-white" />}
                          {done && (i < currentIdx || sr.status === "COMPLETED") && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <p className={`mt-3 text-xs font-medium ${done ? "text-pine-800" : "text-zinc-400"}`}>{sm.label}</p>
                      </div>
                    );
                  })}
                  {sr.status === "REJECTED" && (
                    <div className="flex flex-col items-center">
                      <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-red-500 shadow-sm">
                        <XCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="mt-3 text-xs font-medium text-red-700">已驳回</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-pine-800" />
                <p className="text-sm font-semibold text-pine-900">流转记录时间线</p>
              </div>
              <div className="space-y-5 pl-2">
                {sr.statusLogs?.map((log: any, i: number) => (
                  <div key={log.id} className="relative pl-7 pb-2">
                    <div className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${
                      i === 0 ? "bg-amber-500" : i === sr.statusLogs.length - 1 ? "bg-emerald-500" : "bg-pine-600"
                    }`} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-pine-900">{log.toStatus}</span>
                          {log.fromStatus && (
                            <span className="text-xs text-zinc-400">由 {log.fromStatus} 流转</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600">{log.note}</p>
                        <p className="text-xs text-zinc-400 mt-1.5">操作人：{sr.requester?.name || "系统"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-500">{formatDate(log.createdAt)}</p>
                      </div>
                    </div>
                    {i < sr.statusLogs.length - 1 && (
                      <div className="absolute left-[5px] top-5 bottom-0 w-px bg-pine-100" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="card-border-left-amber">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">申请租户</span><span className="font-medium text-zinc-800">{sr.tenant?.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">申请人</span><span className="text-zinc-800">{sr.requester?.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">处理人</span><span className="text-zinc-800">{sr.assignee?.name ?? "未分配"}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-zinc-500">当前状态</span><Badge variant={statusMeta[sr.status].variant}>{statusMeta[sr.status].label}</Badge></div>
              <div className="flex justify-between"><span className="text-zinc-500">创建时间</span><span className="text-zinc-700">{formatDate(sr.createdAt)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-pine-700" />附件 & 备注
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg border border-dashed border-pine-200 p-6 text-center text-xs text-zinc-500">
                <Paperclip className="h-6 w-6 mx-auto mb-2 text-zinc-300" />
                <p>支持上传原始单据、照片等附件</p>
                <p className="text-zinc-400 mt-1">保留原始凭证，便于业务复盘与审计</p>
              </div>
              <div className="mt-4 space-y-2">
                {sr.notes?.length > 0 ? sr.notes.map((n: any) => (
                  <div key={n.id} className="rounded-lg bg-pine-50/50 p-3">
                    <p className="text-xs font-medium text-pine-800">{n.author?.name}</p>
                    <p className="text-sm text-zinc-700 mt-1">{n.content}</p>
                  </div>
                )) : <p className="text-xs text-zinc-400">暂无备注</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
