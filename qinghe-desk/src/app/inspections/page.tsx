"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Plus, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, Eye, MapPin, Users, Search } from "lucide-react";
import Link from "next/link";

const areas = ["A座1-3层", "A座4-8层", "A座9-12层", "B座全楼", "地下车库", "园区外围"];
const defaultChecklist = ["消防设施", "应急照明", "通道畅通", "地面清洁", "指示牌", "门窗", "空调", "电梯"];

const statusMeta: Record<string, { label: string; variant: any }> = {
  COMPLETED: { label: "正常", variant: "success" as const },
  HAS_ANOMALY: { label: "有异常", variant: "warning" as const },
};

export default function InspectionsPage() {
  const [dateFilter, setDateFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const { data: inspections, refetch } = trpc.inspection.list.useQuery({
    date: dateFilter || undefined,
    area: areaFilter || undefined,
  });
  const utils = trpc.useUtils();
  const createMut = trpc.inspection.create.useMutation({
    onSuccess: () => {
      utils.inspection.list.invalidate();
      setOpen(false);
      resetForm();
    },
  });

  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("");
  const [checklist, setChecklist] = useState(
    defaultChecklist.map((item) => ({ item, passed: true, note: "" }))
  );

  const resetForm = () => {
    setArea("");
    setChecklist(defaultChecklist.map((item) => ({ item, passed: true, note: "" })));
  };

  const updateCheckItem = (idx: number, field: string, value: any) => {
    setChecklist(checklist.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const stats = inspections
    ? {
        total: inspections.length,
        normal: inspections.filter((i: any) => i.status === "COMPLETED").length,
        anomaly: inspections.filter((i: any) => i.status === "HAS_ANOMALY").length,
        pendingFix: inspections.reduce(
          (acc: number, i: any) =>
            acc + (i.anomalies?.filter((a: any) => a.status === "OPEN").length ?? 0),
          0
        ),
      }
    : { total: 0, normal: 0, anomaly: 0, pendingFix: 0 };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="巡检管理"
        description="巡检计划执行与异常登记、影响对象跟踪、后续动作管理"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                新建巡检
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新建巡检</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <Label>巡检区域 *</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择巡检区域" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">检查项清单</Label>
                  <div className="space-y-3 border border-pine-100 rounded-lg p-4 bg-pine-50/30">
                    {checklist.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-pine-100">
                        <div className="flex items-center gap-2 pt-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCheckItem(idx, "passed", true)}
                            className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                              c.passed
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-zinc-300 hover:border-emerald-400"
                            }`}
                          >
                            {c.passed && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <span className="text-xs text-emerald-700 font-medium">通过</span>
                          <button
                            type="button"
                            onClick={() => updateCheckItem(idx, "passed", false)}
                            className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors ml-2 ${
                              !c.passed
                                ? "bg-red-500 border-red-500 text-white"
                                : "border-zinc-300 hover:border-red-400"
                            }`}
                          >
                            {!c.passed && <AlertTriangle className="h-3.5 w-3.5" />}
                          </button>
                          <span className="text-xs text-red-700 font-medium">异常</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-zinc-800 mb-1.5">{c.item}</p>
                          <Input
                            size={1}
                            className="h-8 text-xs"
                            placeholder="备注（可选）"
                            value={c.note}
                            onChange={(e) => updateCheckItem(idx, "note", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={() =>
                    createMut.mutate({
                      area,
                      inspectorId: "clerk_op_001",
                      checklist: checklist.map((c) => ({
                        item: c.item,
                        passed: c.passed,
                        note: c.note || undefined,
                      })),
                    })
                  }
                  disabled={!area}
                >
                  提交巡检
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="card-border-left-green">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">巡检总数</p>
                <p className="font-serif text-3xl font-bold text-pine-800 mt-1">{stats.total}</p>
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
                <p className="text-xs text-zinc-500">正常巡检</p>
                <p className="font-serif text-3xl font-bold text-emerald-600 mt-1">{stats.normal}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-border-left-amber">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">异常巡检</p>
                <p className="font-serif text-3xl font-bold text-amber-600 mt-1">{stats.anomaly}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-border-left-red">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">待整改异常</p>
                <p className="font-serif text-3xl font-bold text-red-600 mt-1">{stats.pendingFix}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-border-left-green">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Label className="w-14 shrink-0">日期</Label>
              <Input
                type="date"
                className="w-44"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  refetch();
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-14 shrink-0">区域</Label>
              <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); refetch(); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="全部区域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部区域</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>
              <Badge variant="outline">{inspections?.length ?? 0} 条记录</Badge>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>巡检ID</TableHead>
                <TableHead>区域</TableHead>
                <TableHead>巡检人</TableHead>
                <TableHead>巡检时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>异常数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections?.map((ins: any, i: number) => {
                const meta = statusMeta[ins.status] || statusMeta.COMPLETED;
                const anomalyCount = ins.anomalies?.length ?? 0;
                return (
                  <TableRow
                    key={ins.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <TableCell className="font-mono text-xs text-pine-700">
                      #{ins.id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-pine-600" />
                        <span className="font-medium text-zinc-800">{ins.area}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-600">
                        <Users className="h-3.5 w-3.5 text-pine-600" />
                        {ins.inspector?.name ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {formatDate(ins.inspectedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {anomalyCount > 0 ? (
                        <Badge variant="destructive">{anomalyCount}</Badge>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/inspections/${ins.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          查看详情
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!inspections || inspections.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-zinc-400 py-12">
                    暂无巡检记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
