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
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Wrench, Clock, Users, Building2, Paperclip, MapPin, UserCheck, Send } from "lucide-react";
import Link from "next/link";

const urgencyMeta: Record<string, { label: string; variant: any; color: string }> = {
  HIGH: { label: "紧急", variant: "destructive" as const, color: "bg-red-500" },
  MEDIUM: { label: "一般", variant: "warning" as const, color: "bg-amber-500" },
  LOW: { label: "不急", variant: "success" as const, color: "bg-emerald-500" },
};

const statusMeta: Record<string, { label: string; variant: any; color: string }> = {
  PENDING: { label: "待处理", variant: "warning" as const, color: "bg-amber-500" },
  IN_PROGRESS: { label: "处理中", variant: "default" as const, color: "bg-pine-700" },
  RESOLVED: { label: "已解决", variant: "success" as const, color: "bg-emerald-500" },
};

const flowSteps = ["PENDING", "IN_PROGRESS", "RESOLVED"];

export default function RepairDetailPage({ params }: { params: { id: string } }) {
  const { data: repair } = trpc.repair.get.useQuery({ id: params.id });
  const utils = trpc.useUtils();
  const resolveMut = trpc.repair.resolve.useMutation({
    onSuccess: () => utils.repair.get.invalidate(),
  });
  const [resolveOpen, setResolveOpen] = useState(false);
  const [result, setResult] = useState("");

  if (!repair) return <div className="p-8">加载中...</div>;

  const currentIdx = flowSteps.indexOf(repair.status);
  const um = urgencyMeta[repair.urgency] ?? urgencyMeta.MEDIUM;
  const sm = statusMeta[repair.status] ?? statusMeta.PENDING;
  const canResolve = repair.status !== "RESOLVED";

  const handleResolve = () => {
    resolveMut.mutate({
      id: repair.id,
      result,
      assigneeId: "clerk_op_002",
    });
    setResolveOpen(false);
    setResult("");
  };

  return (
    <div className="animate-fade-in">
      <Link href="/repairs" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-pine-700 mb-4">
        <ArrowLeft className="h-4 w-4" />返回报修列表
      </Link>
      <PageHeader
        title={`报修 #${repair.id.slice(-6).toUpperCase()}`}
        description={repair.description.slice(0, 30)}
        actions={
          canResolve ? (
            <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
              <DialogTrigger asChild>
                <Button><CheckCircle2 className="h-4 w-4 mr-2" />标记解决</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>处理结果确认</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>处理说明 <span className="text-red-500">*</span></Label>
                    <Textarea
                      className="mt-1"
                      rows={5}
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      placeholder="请描述具体处理过程、解决方案、更换配件、耗时等信息，便于后续复盘归档..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResolveOpen(false)}>取消</Button>
                  <Button onClick={handleResolve} disabled={!result.trim() || resolveMut.isLoading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {resolveMut.isLoading ? "提交中..." : "确认解决"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-border-left">
            <CardContent className="pt-6">
              <div className="mb-6">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">问题详情</p>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={um.variant}>{um.label}</Badge>
                  <Badge variant={sm.variant}>{sm.label}</Badge>
                </div>
                <h2 className="font-serif text-2xl font-bold text-pine-900 mb-3 line-clamp-2">{repair.description}</h2>
                <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">{repair.description}</p>
              </div>

              <Separator className="my-6" />

              <div className="mb-6">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />现场照片 & 附件
                </p>
                <div className="rounded-lg border-2 border-dashed border-pine-200 p-10 text-center">
                  <Paperclip className="h-8 w-8 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm text-zinc-600">暂无上传附件</p>
                  <p className="text-xs text-zinc-400 mt-1">支持现场照片、视频、维修单据等原始证据归档</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">处理过程 · 时间线</p>
                <div className="relative mb-8">
                  <div className="absolute top-3 left-3 h-1 w-full max-w-sm rounded-full bg-pine-100" />
                  <div
                    className="absolute top-3 left-3 h-1 rounded-full bg-gradient-to-r from-amber-500 via-pine-700 to-emerald-500 transition-all"
                    style={{ width: `calc(${(Math.max(currentIdx, 0) / (flowSteps.length - 1)) * 100}% - 1.5rem)` }}
                  />
                  <div className="relative flex justify-between max-w-sm">
                    {flowSteps.map((step, i) => {
                      const st = statusMeta[step];
                      const done = i <= currentIdx;
                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                            done ? st.color : "bg-zinc-200"
                          }`}>
                            {done && i === currentIdx && repair.status !== "RESOLVED" && <Clock className="h-3.5 w-3.5 text-white" />}
                            {done && (i < currentIdx || repair.status === "RESOLVED") && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <p className={`mt-3 text-xs font-medium ${done ? "text-pine-800" : "text-zinc-400"}`}>{st.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5 pl-2">
                  <div className="relative pl-7 pb-2">
                    <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full ring-4 ring-white bg-amber-500" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-pine-900">创建工单 · 待处理</span>
                        </div>
                        <p className="text-sm text-zinc-600">报修工单已创建，等待工程组分派处理</p>
                        <p className="text-xs text-zinc-400 mt-1.5">操作人：系统自动记录</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-500">{formatDate(repair.createdAt)}</p>
                      </div>
                    </div>
                    <div className="absolute left-[5px] top-5 bottom-0 w-px bg-pine-100" />
                  </div>

                  {currentIdx >= 1 && (
                    <div className="relative pl-7 pb-2">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full ring-4 ring-white bg-pine-700" />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-pine-900">工程人员接手 · 处理中</span>
                          </div>
                          <p className="text-sm text-zinc-600">已分派至工程人员现场处理</p>
                          <p className="text-xs text-zinc-400 mt-1.5">
                            处理人：{repair.assignee?.name ?? "王工程"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-zinc-500">{formatDate(repair.createdAt)}</p>
                        </div>
                      </div>
                      {repair.status !== "RESOLVED" ? null : (
                        <div className="absolute left-[5px] top-5 bottom-0 w-px bg-pine-100" />
                      )}
                    </div>
                  )}

                  {repair.status === "RESOLVED" && (
                    <div className="relative pl-7 pb-2">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full ring-4 ring-white bg-emerald-500" />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-emerald-700">处理完成 · 已解决</span>
                          </div>
                          <p className="text-sm text-zinc-600">故障已修复，工单关闭</p>
                          <p className="text-xs text-zinc-400 mt-1.5">
                            完成人：{repair.assignee?.name ?? "王工程"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-zinc-500">
                            {repair.resolvedAt ? formatDate(repair.resolvedAt) : formatDate(repair.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {repair.status === "RESOLVED" && repair.result && (
            <Card className="card-border-left-emerald">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />处理结果
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">{repair.result}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="card-border-left-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-pine-700" />工单信息
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">工单编号</span>
                <span className="font-mono font-medium text-pine-800">#{repair.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">创建时间</span>
                <span className="text-zinc-700">{formatDate(repair.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">报修人</span>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-pine-700" />
                  <span className="text-zinc-700">管理员工单</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">紧急程度</span>
                <Badge variant={um.variant}>{um.label}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">当前状态</span>
                <Badge variant={sm.variant}>{sm.label}</Badge>
              </div>
              {repair.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">解决时间</span>
                  <span className="text-emerald-700">{formatDate(repair.resolvedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-border-left-amber">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-pine-700" />位置信息
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div className="rounded-lg bg-amber-50/50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-pine-700" />
                  <span className="font-semibold text-pine-900">{repair.room?.building?.name}</span>
                  <span className="text-pine-700">·</span>
                  <span className="font-medium text-zinc-800">{repair.room?.unitNumber}</span>
                </div>
                <p className="text-xs text-zinc-500 ml-6">{repair.room?.floor} 层 · 面积 {repair.room?.area}㎡</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-pine-700" />
                <span className="text-zinc-500">所属租户</span>
              </div>
              <p className="font-serif text-lg font-bold text-pine-900 pl-6">{repair.tenant?.name}</p>
              <p className="text-xs text-zinc-500 pl-6">{repair.tenant?.contact} · {repair.tenant?.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-pine-700" />处理人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {repair.assignee ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pine-800 to-pine-600 text-white font-serif font-bold">
                    {repair.assignee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-800">{repair.assignee.name}</p>
                    <p className="text-xs text-zinc-500">工程组 · {repair.assignee.role}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-pine-200 p-4 text-center">
                  <UserCheck className="h-6 w-6 mx-auto mb-2 text-zinc-300" />
                  <p className="text-sm text-zinc-500">未分配</p>
                  <p className="text-xs text-zinc-400 mt-1">待工程主管分派处理人员</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
