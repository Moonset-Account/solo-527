"use client";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  Wrench,
  AlertTriangle,
  Clock,
  FileText,
  ArrowUpRight,
  ChevronRight,
  History,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: todos } = trpc.dashboard.todos.useQuery();
  const { data: activities } = trpc.dashboard.activities.useQuery();

  const statCards = [
    {
      label: "本月应收",
      value: formatCurrency(stats?.receivable ?? 0),
      icon: TrendingUp,
      accent: "from-pine-800 to-pine-700",
      badge: "+12.3%",
      badgeVariant: "success" as const,
    },
    {
      label: "本月已收",
      value: formatCurrency(stats?.received ?? 0),
      icon: Wallet,
      accent: "from-emerald-600 to-emerald-500",
      badge: "85%",
      badgeVariant: "success" as const,
    },
    {
      label: "待处理工单",
      value: String(stats?.pendingRepairs ?? 0),
      icon: Wrench,
      accent: "from-amber-500 to-amber-400",
      badge: "3 项逾期",
      badgeVariant: "warning" as const,
    },
    {
      label: "巡检异常",
      value: String(stats?.openAnomalies ?? 0),
      icon: AlertTriangle,
      accent: "from-red-600 to-red-500",
      badge: "需要关注",
      badgeVariant: "destructive" as const,
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="工作台"
        description="欢迎回来，这是园区今日的运营概览"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-xl p-6 text-white shadow-lg animate-slide-up"
              style={{
                backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                animationDelay: `${i * 60}ms`,
                background: card.accent.includes("pine") ? "linear-gradient(135deg,#1a3c34,#2f574c)" : card.accent.includes("emerald") ? "linear-gradient(135deg,#059669,#10b981)" : card.accent.includes("amber") ? "linear-gradient(135deg,#d97706,#d4a853)" : "linear-gradient(135deg,#dc2626,#ef4444)",
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={card.badgeVariant} className="bg-white/20 text-white border-0">
                  {card.badge}
                </Badge>
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">{card.label}</p>
              <p className="mt-2 font-serif text-3xl font-bold">{card.value}</p>
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-white/10" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-border-left-green animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-pine-900">待办事项</h3>
              <Link href="/services" className="text-xs text-pine-700 hover:underline flex items-center gap-1">
                查看全部 <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {todos?.pendingServices?.slice(0, 4).map((sr: any) => (
                <Link
                  key={sr.id}
                  href={`/services/${sr.id}`}
                  className="flex items-center justify-between rounded-lg border border-pine-100 p-3 hover:bg-pine-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{sr.type}</p>
                      <p className="text-xs text-zinc-500">{sr.tenant?.name} · {formatDate(sr.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">待审批</Badge>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </div>
                </Link>
              ))}
              {todos?.overdueBills?.slice(0, 3).map((bill: any) => (
                <Link
                  key={bill.id}
                  href={`/bills/${bill.id}`}
                  className="flex items-center justify-between rounded-lg border border-red-100 p-3 hover:bg-red-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{bill.period} 账单 - {bill.tenant?.name}</p>
                      <p className="text-xs text-zinc-500">到期日: {formatDate(bill.dueDate)} · {formatCurrency(bill.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">已逾期</Badge>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-border-left-amber animate-slide-up" style={{ animationDelay: "80ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-pine-900">近期变更</h3>
              <Link href="/audit-logs" className="text-xs text-pine-700 hover:underline flex items-center gap-1">
                审计日志 <History className="h-3 w-3" />
              </Link>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4 max-h-96 overflow-auto pr-1">
              {activities?.map((log: any) => (
                <div key={log.id} className="relative pl-5">
                  <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-amber-400 ring-4 ring-amber-100" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-pine-800">{log.operator?.name || "系统"}</span>
                        <span className="text-zinc-500 mx-1">·</span>
                        <span className="text-zinc-700">修改了 {log.entityType}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        字段 [{log.field}]: {log.oldValue ?? "-"} → {log.newValue ?? "-"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{formatDate(log.operatedAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
