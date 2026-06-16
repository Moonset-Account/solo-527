"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3, TrendingUp, CheckCircle2, BookOpen } from "lucide-react";

const MOCK_TREND = [
  { date: "06-01", rate: 72 }, { date: "06-02", rate: 68 }, { date: "06-03", rate: 75 },
  { date: "06-04", rate: 80 }, { date: "06-05", rate: 78 }, { date: "06-06", rate: 82 },
  { date: "06-07", rate: 85 }, { date: "06-08", rate: 79 }, { date: "06-09", rate: 83 },
  { date: "06-10", rate: 88 }, { date: "06-11", rate: 84 }, { date: "06-12", rate: 90 },
  { date: "06-13", rate: 87 }, { date: "06-14", rate: 91 },
];

export default function KnowledgePage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: knowledgeData, isLoading } = trpc.knowledge.list.useQuery({ page, limit });
  const { data: stats } = trpc.knowledge.getHitStats.useQuery({});

  const items = knowledgeData?.items ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">知识命中统计</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          value={stats?.totalHits ?? 0}
          label="总命中次数"
          trend="up"
          trendValue="+12%"
          icon={BarChart3}
        />
        <StatCard
          value={stats?.helpfulHits ?? 0}
          label="有效命中"
          trend="up"
          trendValue="+8%"
          icon={CheckCircle2}
        />
        <StatCard
          value={`${(stats?.hitRate ?? 0).toFixed(1)}%`}
          label="命中率"
          trend="up"
          trendValue="+3.2%"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold text-slate-900">命中趋势</h3></CardHeader>
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94A3B8" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94A3B8" }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, "命中率"]}
                />
                <Line type="monotone" dataKey="rate" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">知识条目</h3>
          <span className="text-sm text-slate-500">共 {knowledgeData?.total ?? 0} 条</span>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="ml-2 text-sm">加载中...</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={BookOpen} title="暂无知识条目" description="知识库为空" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">标题</th>
                  <th className="px-4 py-3 text-left font-medium">分类</th>
                  <th className="px-4 py-3 text-left font-medium">版本</th>
                  <th className="px-4 py-3 text-right font-medium">命中次数</th>
                  <th className="px-4 py-3 text-right font-medium">关联反馈</th>
                  <th className="px-4 py-3 text-left font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const entryStat = stats?.byEntry?.find((e: any) => e.id === item.id);
                  return (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                      <td className="px-4 py-3 text-slate-600"><Badge variant="medium">{item.category}</Badge></td>
                      <td className="px-4 py-3 font-mono-data text-slate-500">v{item.version}</td>
                      <td className="px-4 py-3 text-right font-mono-data">
                        <span className={entryStat?.hitCount ? "text-amber-600 font-semibold" : "text-slate-400"}>
                          {entryStat?.hitCount ?? item._count?.hits ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{item._count?.feedbacks ?? 0}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {(knowledgeData?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <span>{page} / {knowledgeData?.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= (knowledgeData?.totalPages ?? 1)} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      )}
    </div>
  );
}
