"use client";

import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const SLA_TARGETS: Record<string, number> = { CRITICAL: 240, HIGH: 480, OTHER: 1440 };
const TYPE_LABELS: Record<string, string> = { FIRST_RESPONSE: "首次响应", FULL_RESOLUTION: "完全解决" };

export default function ResponseTimePage() {
  const { data: records } = trpc.stats.getResponseTimeHistory.useQuery();

  const stats = useMemo(() => {
    if (!records?.length) return { avgFirst: 0, avgResolution: 0, slaRate: 0 };
    const first = records.filter(r => r.type === "FIRST_RESPONSE");
    const resolution = records.filter(r => r.type === "FULL_RESOLUTION");
    const avgFirst = first.length ? Math.round(first.reduce((s, r) => s + r.responseMinutes, 0) / first.length) : 0;
    const avgResolution = resolution.length ? Math.round(resolution.reduce((s, r) => s + r.responseMinutes, 0) / resolution.length) : 0;
    const slaMet = records.filter(r => r.responseMinutes <= SLA_TARGETS[r.type === "FIRST_RESPONSE" ? "CRITICAL" : "OTHER"]).length;
    return { avgFirst, avgResolution, slaRate: Math.round((slaMet / records.length) * 100) };
  }, [records]);

  const chartData = useMemo(() => {
    if (!records) return [];
    const byDate: Record<string, { date: string; firstSum: number; firstN: number; resSum: number; resN: number }> = {};
    records.forEach(r => {
      const date = new Date(r.recordedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
      if (!byDate[date]) byDate[date] = { date, firstSum: 0, firstN: 0, resSum: 0, resN: 0 };
      if (r.type === "FIRST_RESPONSE") { byDate[date].firstSum += r.responseMinutes; byDate[date].firstN++; }
      else { byDate[date].resSum += r.responseMinutes; byDate[date].resN++; }
    });
    return Object.values(byDate)
      .map(d => ({ date: d.date, firstResponse: d.firstN ? Math.round(d.firstSum / d.firstN) : 0, resolution: d.resN ? Math.round(d.resSum / d.resN) : 0 }))
      .slice(-14);
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={`${stats.avgFirst}分`} label="平均首次响应时间" />
        <StatCard value={`${stats.avgResolution}分`} label="平均解决时间" />
        <StatCard value="4h / 8h / 24h" label="SLA目标" />
        <StatCard value={`${stats.slaRate}%`} label="SLA达标率" />
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold text-slate-900">响应时间趋势</h3></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" unit="分" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
              <ReferenceLine y={240} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: "SLA 4h", position: "right", fill: "#F59E0B", fontSize: 11 }} />
              <Bar dataKey="firstResponse" name="首次响应(分)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="resolution" name="解决趋势(分)" stroke="#64748B" strokeWidth={2} dot={{ r: 3, fill: "#64748B" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold text-slate-900">近期响应记录</h3></CardHeader>
        <CardBody className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">反馈ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">类型</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">响应时长</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">SLA状态</th>
                </tr>
              </thead>
              <tbody>
                {records?.slice(0, 20).map(r => {
                  const limit = r.type === "FIRST_RESPONSE" ? SLA_TARGETS.CRITICAL : SLA_TARGETS.OTHER;
                  const met = r.responseMinutes <= limit;
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-mono-data text-slate-700">{r.feedbackId.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">{TYPE_LABELS[r.type] || r.type}</td>
                      <td className="px-6 py-3 text-sm font-mono-data text-slate-700">{r.responseMinutes} 分钟</td>
                      <td className="px-6 py-3"><Badge variant={met ? "closed" : "critical"}>{met ? "达标" : "超标"}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
