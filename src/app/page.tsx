"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Loader2,
  ArrowRight,
  AlertTriangle,
  Clock,
  BookOpen,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  BarChart3,
  XCircle,
  MessageSquare,
  FileText,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Area,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

const STATUS_MAP: Record<string, { label: string; variant: "pending" | "in_progress" | "pending_review" | "closed" }> = {
  PENDING: { label: "待处理", variant: "pending" },
  IN_PROGRESS: { label: "处理中", variant: "in_progress" },
  PENDING_REVIEW: { label: "待评价", variant: "pending_review" },
  CLOSED: { label: "已关闭", variant: "closed" },
};

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT: "产品",
  SERVICE: "服务",
  BILLING: "账单",
  TECHNICAL: "技术",
  OTHER: "其他",
};

const CATEGORY_COLORS: Record<string, string> = {
  PRODUCT: "#F59E0B",
  SERVICE: "#3B82F6",
  BILLING: "#8B5CF6",
  TECHNICAL: "#EF4444",
  OTHER: "#6B7280",
};

export default function DashboardPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"overview" | "unclosed">("overview");

  const role = (user?.publicMetadata?.role as string) ?? "CUSTOMER";

  const { data, isLoading } = trpc.stats.getDashboard.useQuery(undefined, {
    enabled: isLoaded && isSignedIn && role === "SUPERVISOR",
  });

  const { data: unclosedData, isLoading: unclosedLoading } = trpc.stats.getUnclosedStats.useQuery(undefined, {
    enabled: isLoaded && isSignedIn && role === "SUPERVISOR" && activeTab === "unclosed",
  });

  const { data: closureData } = trpc.stats.getClosureStats.useQuery({ days: 14 }, {
    enabled: isLoaded && isSignedIn && role === "SUPERVISOR",
  });

  const { data: knowledgeStats } = trpc.stats.getKnowledgeHitRate.useQuery(undefined, {
    enabled: isLoaded && isSignedIn && role === "SUPERVISOR",
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    if (role === "CUSTOMER") {
      router.replace("/feedback/my");
    } else if (role === "STAFF") {
      router.replace("/feedback/board");
    }
  }, [isLoaded, isSignedIn, role, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (role !== "SUPERVISOR") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const chartData = data.feedbacksByCategory.map((c) => ({
    name: CATEGORY_LABELS[c.category] ?? c.category,
    count: c.count,
    fill: CATEGORY_COLORS[c.category] ?? "#F59E0B",
  }));

  const closureChartData = closureData?.dailyStats.map((d) => ({
    date: d.date.slice(5),
    closureRate: d.closureRate,
    total: d.total,
    closed: d.closed,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">数据概览</h1>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "overview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setActiveTab("unclosed")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "unclosed"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            未闭环
            {unclosedData && unclosedData.totalUnclosed > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-rose-100 text-rose-600 rounded-full">
                {unclosedData.totalUnclosed}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              value={data.totalFeedbacks}
              label="反馈总数"
              icon={MessageSquare}
              sparklineData={closureChartData.slice(-7).map((d) => d.total)}
            />
            <StatCard
              value={`${data.closureRate.toFixed(1)}%`}
              label="关闭率"
              icon={CheckSquare}
              trend={closureData && closureData.dailyStats.length >= 2 &&
                closureData.dailyStats[closureData.dailyStats.length - 1].closureRate >=
                closureData.dailyStats[closureData.dailyStats.length - 2].closureRate
                ? "up"
                : "down"}
              trendValue={closureData && closureData.dailyStats.length >= 2
                ? `${(closureData.dailyStats[closureData.dailyStats.length - 1].closureRate -
                    closureData.dailyStats[closureData.dailyStats.length - 2].closureRate
                  ).toFixed(1)}%`
                : undefined}
            />
            <StatCard
              value={`${Math.round(data.avgResponseMinutes)} 分`}
              label="平均响应时间"
              icon={Clock}
            />
            <StatCard
              value={`${(knowledgeStats?.hitRate ?? 0).toFixed(1)}%`}
              label="知识命中率"
              icon={BookOpen}
              trend="up"
              trendValue="+5.2%"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StatCard
              value={unclosedData?.totalUnclosed ?? data.pendingTodos}
              label="待办事项"
              icon={Zap}
              className="!bg-amber-50/50"
            />
            <StatCard
              value={unclosedData?.overdue24h ?? 0}
              label="24h未响应"
              icon={AlertTriangle}
              className="!bg-rose-50/50"
            />
            <StatCard
              value={unclosedData?.overdue48h ?? 0}
              label="48h未闭环"
              icon={XCircle}
              className="!bg-rose-100/50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-900">关闭率趋势</h2>
              </CardHeader>
              <CardBody>
                {closureChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={closureChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748B" }} domain={[0, "dataMax + 5"]} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748B" }} unit="%" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          fontSize: "13px",
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="total" name="总反馈" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="closed" name="已关闭" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="closureRate" name="关闭率(%)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-12">暂无数据</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-900">反馈分类分布</h2>
              </CardHeader>
              <CardBody>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#64748B" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          fontSize: "13px",
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-12">暂无数据</p>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">最近反馈</h2>
                <button
                  onClick={() => router.push("/feedback/board")}
                  className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  查看全部
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </CardHeader>
              <CardBody className="p-0">
                {data.recentFeedbacks.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-12">暂无反馈</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.recentFeedbacks.map((fb) => {
                      const statusInfo = STATUS_MAP[fb.status] ?? STATUS_MAP.PENDING;
                      return (
                        <div
                          key={fb.id}
                          onClick={() => router.push(`/feedback/${fb.id}`)}
                          className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {fb.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {fb.customer?.name ?? "未知客户"} ·{" "}
                              {format(new Date(fb.createdAt), "MM-dd HH:mm", {
                                locale: zhCN,
                              })}
                            </p>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">知识库命中Top</h2>
                <button
                  onClick={() => router.push("/knowledge")}
                  className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  查看全部
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </CardHeader>
              <CardBody className="p-0">
                {knowledgeStats?.recentHits && knowledgeStats.recentHits.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {knowledgeStats.recentHits.slice(0, 5).map((hit: any) => (
                      <div key={hit.id} className="px-6 py-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {hit.knowledgeEntry?.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {hit.knowledgeEntry?.category}
                          </p>
                        </div>
                        <Badge variant={hit.helpful ? "closed" : "critical"}>
                          {hit.helpful ? "有效" : "无效"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-12">暂无命中记录</p>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {activeTab === "unclosed" && (
        <>
          {unclosedLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          ) : unclosedData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  value={unclosedData.totalUnclosed}
                  label="未闭环总数"
                  icon={AlertTriangle}
                  className="!bg-amber-50"
                />
                <StatCard
                  value={unclosedData.pendingCount}
                  label="待处理"
                  icon={Clock}
                />
                <StatCard
                  value={unclosedData.inProgressCount}
                  label="处理中"
                  icon={Loader2}
                />
                <StatCard
                  value={unclosedData.pendingReviewCount}
                  label="待审核"
                  icon={FileText}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardBody className="text-center py-6">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{unclosedData.overdue24h}</p>
                    <p className="text-sm text-slate-500 mt-1">24小时未首次响应</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="text-center py-6">
                    <XCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{unclosedData.overdue48h}</p>
                    <p className="text-sm text-slate-500 mt-1">48小时未闭环</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="text-center py-6">
                    <BookOpen className="h-8 w-8 text-brand-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{unclosedData.missingKnowledge}</p>
                    <p className="text-sm text-slate-500 mt-1">未关联知识库</p>
                  </CardBody>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><h3 className="font-medium text-sm text-slate-700">缺失备注</h3></CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-slate-900">{unclosedData.missingNotes}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><h3 className="font-medium text-sm text-slate-700">缺失处理结果</h3></CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-slate-900">{unclosedData.missingResult}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><h3 className="font-medium text-sm text-slate-700">知识未命中</h3></CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-slate-900">{unclosedData.missingKnowledge}</p>
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">最久未闭环反馈</h2>
                  <button
                    onClick={() => router.push("/feedback/board")}
                    className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    查看全部
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </CardHeader>
                <CardBody className="p-0">
                  {unclosedData.oldestFeedbacks.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-12">暂无未闭环反馈</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500">
                          <th className="px-4 py-3 text-left font-medium">反馈</th>
                          <th className="px-4 py-3 text-left font-medium">客户</th>
                          <th className="px-4 py-3 text-left font-medium">负责人</th>
                          <th className="px-4 py-3 text-left font-medium">状态</th>
                          <th className="px-4 py-3 text-left font-medium">等待时长</th>
                          <th className="px-4 py-3 text-left font-medium">备注数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unclosedData.oldestFeedbacks.map((fb: any) => {
                          const waitHours = Math.round((Date.now() - new Date(fb.createdAt).getTime()) / 3600000);
                          const statusInfo = STATUS_MAP[fb.status] ?? STATUS_MAP.PENDING;
                          return (
                            <tr
                              key={fb.id}
                              onClick={() => router.push(`/feedback/${fb.id}`)}
                              className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-900 truncate max-w-[200px]">{fb.title}</p>
                              </td>
                              <td className="px-4 py-3 text-slate-600">{fb.customer?.name ?? "-"}</td>
                              <td className="px-4 py-3 text-slate-600">{fb.assignee?.name ?? "未指派"}</td>
                              <td className="px-4 py-3">
                                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-mono-data ${waitHours > 48 ? "text-rose-600 font-semibold" : waitHours > 24 ? "text-amber-600" : "text-slate-600"}`}>
                                  {waitHours} 小时
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-mono-data ${fb._count.notes === 0 ? "text-rose-500" : "text-slate-600"}`}>
                                  {fb._count.notes} 条
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardBody>
              </Card>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
