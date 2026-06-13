"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, UserCheck, MessageSquare, Plus, Wrench, Flag } from "lucide-react";
import Link from "next/link";

const handlerOptions = [
  { id: "clerk_admin_001", name: "张管理" },
  { id: "clerk_op_001", name: "李运营" },
  { id: "clerk_op_002", name: "王工程" },
];

const anomalyStatusMeta: Record<string, { label: string; variant: any; color: string }> = {
  OPEN: { label: "待处理", variant: "warning" as const, color: "bg-amber-500" },
  RESOLVED: { label: "已解决", variant: "success" as const, color: "bg-emerald-500" },
};

export default function InspectionDetailPage({ params }: { params: { id: string } }) {
  const { data: inspection } = trpc.inspection.get.useQuery({ id: params.id });
  const utils = trpc.useUtils();
  const reportMut = trpc.inspection.reportAnomaly.useMutation({
    onSuccess: () => {
      utils.inspection.get.invalidate();
      setReportOpen(false);
      resetReportForm();
    },
  });
  const resolveMut = trpc.inspection.resolveAnomaly.useMutation({
    onSuccess: () => utils.inspection.get.invalidate(),
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [affectedObjects, setAffectedObjects] = useState("");
  const [handlerId, setHandlerId] = useState("");
  const [followUpAction, setFollowUpAction] = useState("");

  const resetReportForm = () => {
    setAffectedObjects("");
    setHandlerId("");
    setFollowUpAction("");
  };

  if (!inspection) return <div className="p-8">加载中...</div>;

  const items = inspection.items ?? [];
  const totalItems = items.length;
  const passedItems = items.filter((i: any) => i.passed).length;
  const failedItems = totalItems - passedItems;
  const anomalies = inspection.anomalies ?? [];

  return (
    <div className="animate-fade-in">
      <Link href="/inspections" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-pine-700 mb-4">
        <ArrowLeft className="h-4 w-4" />返回巡检列表
      </Link>
      <PageHeader
        title={`巡检记录 · ${inspection.area}`}
        description={`巡检人: ${inspection.inspector?.name ?? "-"} · ${formatDate(inspection.inspectedAt)}`}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="card-border-left-green">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">总项数</p>
                <p className="font-serif text-3xl font-bold text-pine-800 mt-1">{totalItems}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-pine-100 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-pine-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-border-left-emerald">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">通过数</p>
                <p className="font-serif text-3xl font-bold text-emerald-600 mt-1">{passedItems}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-border-left-red">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">异常数</p>
                <p className="font-serif text-3xl font-bold text-red-600 mt-1">{failedItems}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-border-left-green">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-pine-700" />检查项清单
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">序号</TableHead>
                  <TableHead>检查项目</TableHead>
                  <TableHead className="w-24 text-center">状态</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any, idx: number) => (
                  <TableRow key={item.id ?? idx} className={!item.passed ? "bg-red-50/60" : ""}>
                    <TableCell className="font-mono text-xs text-zinc-500">{String(idx + 1).padStart(2, "0")}</TableCell>
                    <TableCell className="font-medium text-zinc-800">{item.item}</TableCell>
                    <TableCell className="text-center">
                      {item.passed ? (
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-red-100 text-red-600">
                          <XCircle className="h-4 w-4" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">{item.note || <span className="text-zinc-300">-</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="card-border-left-amber">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />异常记录
                </CardTitle>
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary">
                      <Plus className="h-3.5 w-3.5" />登记异常
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>登记异常</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>影响对象 *</Label>
                        <Textarea
                          className="mt-1"
                          rows={3}
                          value={affectedObjects}
                          onChange={(e) => setAffectedObjects(e.target.value)}
                          placeholder="描述受影响的具体对象，如设备、区域、人员等..."
                        />
                      </div>
                      <div>
                        <Label>当前处理人 *</Label>
                        <Select value={handlerId} onValueChange={setHandlerId}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="选择处理人" />
                          </SelectTrigger>
                          <SelectContent>
                            {handlerOptions.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>后续动作 *</Label>
                        <Textarea
                          className="mt-1"
                          rows={3}
                          value={followUpAction}
                          onChange={(e) => setFollowUpAction(e.target.value)}
                          placeholder="描述整改计划、责任人、时间节点等..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setReportOpen(false)}>取消</Button>
                      <Button
                        onClick={() =>
                          reportMut.mutate({
                            inspectionId: inspection.id,
                            affectedObjects,
                            handlerId,
                            followUpAction,
                          })
                        }
                        disabled={!affectedObjects || !handlerId || !followUpAction}
                      >
                        确认登记
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {anomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.map((a: any, i: number) => {
                    const sm = anomalyStatusMeta[a.status] || anomalyStatusMeta.OPEN;
                    return (
                      <div
                        key={a.id}
                        className={`relative rounded-lg border-l-4 p-4 ${sm.color.replace("bg-", "border-l-")} bg-white border border-zinc-200 animate-slide-up`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Flag className={`h-3.5 w-3.5 ${a.status === "OPEN" ? "text-amber-600" : "text-emerald-600"}`} />
                            <Badge variant={sm.variant}>{sm.label}</Badge>
                          </div>
                          {a.status === "OPEN" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                              onClick={() => resolveMut.mutate({ id: a.id })}
                            >
                              <Wrench className="h-3 w-3" />标记整改完成
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-zinc-500 mb-0.5">影响对象</p>
                              <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed">{a.affectedObjects}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-pine-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-zinc-500 mb-0.5">当前处理人</p>
                              <p className="text-zinc-800 font-medium">{a.handler?.name ?? "-"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-zinc-500 mb-0.5">后续动作</p>
                              <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed">{a.followUpAction}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center">
                  <div className="h-10 w-10 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-emerald-800">暂无异常记录</p>
                  <p className="text-xs text-emerald-600 mt-1">本次巡检结果良好，所有项目均通过</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
