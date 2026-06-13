"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Plus, Filter, Wrench, AlertTriangle, Clock, CheckCircle2, Eye, Building2, Users } from "lucide-react";
import Link from "next/link";

const urgencyMeta: Record<string, { label: string; variant: any; cardClass: string; icon: any }> = {
  HIGH: { label: "紧急", variant: "destructive" as const, cardClass: "card-border-left-red", icon: AlertTriangle },
  MEDIUM: { label: "一般", variant: "warning" as const, cardClass: "card-border-left-amber", icon: Clock },
  LOW: { label: "不急", variant: "success" as const, cardClass: "card-border-left-green", icon: CheckCircle2 },
};

const statusMeta: Record<string, { label: string; variant: any; icon: any }> = {
  PENDING: { label: "待处理", variant: "warning" as const, icon: Clock },
  IN_PROGRESS: { label: "处理中", variant: "default" as const, icon: Wrench },
  RESOLVED: { label: "已解决", variant: "success" as const, icon: CheckCircle2 },
};

export default function RepairsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const queryInput: any = {};
  if (statusFilter !== "all") queryInput.status = statusFilter;
  if (urgencyFilter !== "all") queryInput.urgency = urgencyFilter;
  const { data: repairs } = trpc.repair.list.useQuery(Object.keys(queryInput).length > 0 ? queryInput : undefined);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="工程报修"
        description="园区工程报修工单管理与处理追踪"
        actions={
          <Link href="/repairs/new">
            <Button><Plus className="h-4 w-4" />新增报修</Button>
          </Link>
        }
      />

      <Card className="card-border-left-green mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-500">筛选条件：</span>
            </div>
            <div className="w-44">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="PENDING">待处理</SelectItem>
                  <SelectItem value="IN_PROGRESS">处理中</SelectItem>
                  <SelectItem value="RESOLVED">已解决</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger><SelectValue placeholder="紧急程度" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部程度</SelectItem>
                  <SelectItem value="HIGH">紧急</SelectItem>
                  <SelectItem value="MEDIUM">一般</SelectItem>
                  <SelectItem value="LOW">不急</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto text-sm text-zinc-500">
              共 <span className="font-semibold text-pine-800">{repairs?.length ?? 0}</span> 条工单
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {repairs?.map((r: any, i: number) => {
          const um = urgencyMeta[r.urgency] ?? urgencyMeta.LOW;
          const sm = statusMeta[r.status] ?? statusMeta.PENDING;
          const UrgencyIcon = um.icon;
          const StatusIcon = sm.icon;
          return (
            <Card key={r.id} className={`${um.cardClass} animate-slide-up`} style={{ animationDelay: `${i * 30}ms` }}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={sm.variant}><StatusIcon className="h-3 w-3 mr-1" />{sm.label}</Badge>
                  </div>
                  <Badge variant={um.variant}><UrgencyIcon className="h-3 w-3 mr-1" />{um.label}</Badge>
                </div>
                <h3 className="font-serif text-lg font-semibold text-pine-900 mb-2 line-clamp-2">{r.description}</h3>
                <div className="flex items-center gap-2 text-sm text-zinc-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-pine-700" />
                    <span>{r.room?.building?.name} · {r.room?.unitNumber}</span>
                  </div>
                  <span className="text-zinc-300">·</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-pine-700" />
                    <span>{r.tenant?.name}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-dashed border-pine-100 flex items-center justify-between">
                  <div className="text-xs text-zinc-500">
                    <span className="text-zinc-400">报修人：</span>{r.reporterId.slice(-6).toUpperCase()}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {formatDate(r.createdAt)}
                  </div>
                  <Link href={`/repairs/${r.id}`}>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" />详情</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!repairs || repairs.length === 0) && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-16 text-center text-zinc-400">
              <Wrench className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
              <p>暂无报修工单</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
