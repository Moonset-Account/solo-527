import {
  ShieldCheck,
  Clock,
  Target,
  Users,
  TrendingUp,
  FileText,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AlertList } from "@/components/dashboard/AlertList";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

const recentTickets = [
  {
    id: "T001",
    title: "收到商品有破损",
    customer: "CUST001",
    status: "PROCESSING",
    priority: "HIGH",
    slaRule: "紧急投诉处理SLA",
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "T002",
    title: "物流信息三天未更新",
    customer: "CUST002",
    status: "PENDING",
    priority: "MEDIUM",
    slaRule: "普通咨询响应SLA",
    lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "T003",
    title: "申请退货退款",
    customer: "CUST004",
    status: "PROCESSING",
    priority: "MEDIUM",
    slaRule: "退换货处理SLA",
    lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

const hotKnowledge = [
  { id: "K001", title: "如何处理商品退换货申请", views: 1256, useful: 89, category: "退换货" },
  { id: "K002", title: "物流配送异常处理流程", views: 987, useful: 72, category: "物流" },
  { id: "K003", title: "商品质量问题鉴定指南", views: 756, useful: 65, category: "质量" },
  { id: "K004", title: "客户投诉升级处理规范", views: 543, useful: 48, category: "投诉" },
];

export default function Home() {
  return (
    <PageWrapper title="预警台首页" description="售后SLA监控与管理中心">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="SLA达标率"
            value="96.5%"
            change={2.3}
            trend="up"
            icon={ShieldCheck}
            variant="success"
          />
          <MetricCard
            title="平均响应时效"
            value="12分钟"
            change={8.5}
            trend="down"
            icon={Clock}
            variant="default"
          />
          <MetricCard
            title="知识命中率"
            value="78.3%"
            change={5.2}
            trend="up"
            icon={Target}
            variant="info"
          />
          <MetricCard
            title="客户满意度"
            value="4.6/5"
            change={1.1}
            trend="up"
            icon={Users}
            variant="warning"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-soft overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">待处理预警</p>
                      <p className="mt-1 text-2xl font-bold text-slate-800">8</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="danger" className="animate-breathe">3 条超时</Badge>
                    <Badge variant="warning">5 条预警</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">今日工单</p>
                      <p className="mt-1 text-2xl font-bold text-slate-800">23</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="success">12 已解决</Badge>
                    <Badge variant="secondary">11 处理中</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <AlertList />
          </div>

          <div className="space-y-6">
            <QuickStats />

            <Card className="border-0 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-800">
                  快捷操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full justify-start" variant="default">
                  <Link href="/knowledge">
                    <BookOpen className="mr-2 h-4 w-4" />
                    搜索知识库
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="secondary">
                  <Link href="/sla/rules">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    配置SLA规则
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="secondary">
                  <Link href="/hits">
                    <Target className="mr-2 h-4 w-4" />
                    查看知识命中
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="secondary">
                  <Link href="/knowledge/invalid">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    处理失效知识
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">
                待处理工单
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/trajectory">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="group flex items-center justify-between rounded-lg border border-slate-200/50 bg-white p-4 hover:border-slate-200 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${ticket.priority === "HIGH" ? "bg-red-500" : ticket.priority === "MEDIUM" ? "bg-amber-500" : "bg-green-500"}`}
                      />
                      <span className="text-xs text-slate-500">{ticket.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {ticket.slaRule}
                      </Badge>
                    </div>
                    <p className="mt-1 font-medium text-slate-800">{ticket.title}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                      <span>客户: {ticket.customer}</span>
                      <span>更新于: {formatDateTime(ticket.lastUpdate)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/trajectory/${ticket.id}`}>轨迹</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">
                热门知识
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/knowledge">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {hotKnowledge.map((k, index) => (
                <div
                  key={k.id}
                  className="group flex items-center justify-between rounded-lg border border-slate-200/50 bg-white p-4 hover:border-slate-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 group-hover:text-[#1e3a5f] transition-colors">
                        {k.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                        <Badge variant="outline" className="text-xs">
                          {k.category}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {k.views} 浏览
                        </span>
                        <span>{k.useful} 有用</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
