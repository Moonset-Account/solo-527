"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Plus, Filter, Clock, CheckCircle2, XCircle, ArrowRightLeft, Eye, Users } from "lucide-react";
import Link from "next/link";

const statusMeta: Record<string, { label: string; variant: any; icon: any }> = {
  PENDING: { label: "待审批", variant: "warning" as const, icon: Clock },
  APPROVED: { label: "处理中", variant: "default" as const, icon: Users },
  COMPLETED: { label: "已完成", variant: "success" as const, icon: CheckCircle2 },
  REJECTED: { label: "已驳回", variant: "destructive" as const, icon: XCircle },
};

const serviceTypes = ["空调维修", "门禁申请", "会议预订", "保洁服务", "停车月卡", "网络故障", "其他"];

export default function ServicesPage() {
  const [statusTab, setStatusTab] = useState<string>("all");
  const { data: services } = trpc.service.list.useQuery(statusTab === "all" ? undefined : { status: statusTab });
  const { data: tenants } = trpc.tenant.list.useQuery();
  const utils = trpc.useUtils();
  const createMut = trpc.service.create.useMutation({ onSuccess: () => { utils.service.list.invalidate(); setOpen(false); resetForm(); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenantId: "", type: "", description: "" });
  const resetForm = () => setForm({ tenantId: "", type: "", description: "" });

  const tabs = [
    { key: "all", label: "全部", count: services?.length ?? 0 },
    { key: "PENDING", label: "待审批", count: services?.filter((s: any) => s.status === "PENDING").length ?? 0 },
    { key: "APPROVED", label: "处理中", count: services?.filter((s: any) => s.status === "APPROVED").length ?? 0 },
    { key: "COMPLETED", label: "已完成", count: services?.filter((s: any) => s.status === "COMPLETED").length ?? 0 },
    { key: "REJECTED", label: "已驳回", count: services?.filter((s: any) => s.status === "REJECTED").length ?? 0 },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="服务申请"
        description="管理园区租户提交的各类服务申请与响应时间"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />新建申请</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>新建服务申请</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>申请租户 *</Label>
                  <Select value={form.tenantId} onValueChange={(v) => setForm({ ...form, tenantId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="选择租户" /></SelectTrigger>
                    <SelectContent>
                      {tenants?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>服务类型 *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="选择类型" /></SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>问题描述 *</Label>
                  <Textarea className="mt-1" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="请详细描述申请内容、具体要求等..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button onClick={() => createMut.mutate(form)} disabled={!form.tenantId || !form.type || !form.description}>提交申请</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="card-border-left-green">
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 border-b border-pine-100 -mx-6 px-6 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-4 py-4 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  statusTab === tab.key
                    ? "border-pine-800 text-pine-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${statusTab === tab.key ? "bg-pine-100 text-pine-800" : "bg-zinc-100 text-zinc-500"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请编号</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>租户</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>处理人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>流转次数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((sr: any, i: number) => {
                const meta = statusMeta[sr.status];
                const Icon = meta.icon;
                return (
                  <TableRow key={sr.id} className="animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                    <TableCell className="font-mono text-xs text-pine-700">#{sr.id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-zinc-800">{sr.type}</TableCell>
                    <TableCell>{sr.tenant?.name}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{sr.requester?.name}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{sr.assignee?.name ?? "-"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <Badge variant={meta.variant}><Icon className="h-3 w-3 mr-1" />{meta.label}</Badge>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                        <ArrowRightLeft className="h-3 w-3" />{sr.statusLogs?.length ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">{formatDate(sr.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/services/${sr.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" />查看</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!services || services.length === 0) && (
                <TableRow><TableCell colSpan={9} className="text-center text-zinc-400 py-12">暂无服务申请</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
