"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/ui/ChartCard";
import { DepartmentComparisonChart } from "@/components/charts/DepartmentComparisonChart";
import { useAppStore } from "@/store";
import { Download, Filter } from "lucide-react";

export default function ComparisonPage() {
  const getDepartmentComparison = useAppStore((state) => state.getDepartmentComparison);
  const getFilteredVisits = useAppStore((state) => state.getFilteredVisits);
  const deptComparison = useMemo(() => getDepartmentComparison(), [getDepartmentComparison]);
  const filteredVisits = useMemo(() => getFilteredVisits(), [getFilteredVisits]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">多维度对比分析</h1>
          <p className="text-sm text-neutral-500 mt-1">
            从科室、医生、时段、患者类型等维度进行横向对比
          </p>
        </div>

        <ChartCard
          title="科室等待时间对比"
          subtitle="点击科室柱状图可快速筛选查看该科室数据"
        >
          <DepartmentComparisonChart data={deptComparison} height={400} />
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="科室详细排名">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500">排名</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-500">科室</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-500">平均等待</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-500">就诊等待</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-500">就诊人次</th>
                  </tr>
                </thead>
                <tbody>
                  {deptComparison.map((dept) => (
                    <tr key={dept.deptId} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            dept.rank <= 3
                              ? "bg-danger-100 text-danger-600"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {dept.rank}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-neutral-800 font-medium">
                        {dept.deptName}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-neutral-600 text-right font-mono">
                        {dept.avgWaitTotal}分钟
                      </td>
                      <td className="px-4 py-2.5 text-sm text-neutral-600 text-right font-mono">
                        {dept.avgWaitDoctor}分钟
                      </td>
                      <td className="px-4 py-2.5 text-sm text-neutral-600 text-right font-mono">
                        {dept.totalVisits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="患者类型对比">
            <div className="space-y-4">
              {[
                { type: "普通门诊", visits: Math.round(filteredVisits.length * 0.55), avgWait: 42 },
                { type: "急诊", visits: Math.round(filteredVisits.length * 0.15), avgWait: 15 },
                { type: "复诊", visits: Math.round(filteredVisits.length * 0.20), avgWait: 28 },
                { type: "特需门诊", visits: Math.round(filteredVisits.length * 0.10), avgWait: 18 },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-700">{item.type}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-neutral-500">{item.visits}人次</span>
                      <span className="text-sm font-mono font-medium text-neutral-800">
                        {item.avgWait}分钟
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${(item.avgWait / 50) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard title="时段对比分析">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { slot: "凌晨 (0-6点)", avgWait: 25, visits: Math.round(filteredVisits.length * 0.05) },
              { slot: "上午 (6-12点)", avgWait: 48, visits: Math.round(filteredVisits.length * 0.45) },
              { slot: "午间 (12-14点)", avgWait: 35, visits: Math.round(filteredVisits.length * 0.10) },
              { slot: "下午 (14-18点)", avgWait: 42, visits: Math.round(filteredVisits.length * 0.32) },
              { slot: "晚间 (18-24点)", avgWait: 28, visits: Math.round(filteredVisits.length * 0.08) },
            ].map((item, index) => (
              <div key={index} className="p-3 bg-neutral-50 rounded-lg text-center">
                <p className="text-sm font-medium text-neutral-800 mb-2">{item.slot}</p>
                <p className="text-2xl font-bold text-primary-600 font-mono mb-1">
                  {item.avgWait}
                </p>
                <p className="text-xs text-neutral-500">分钟 · {item.visits}人次</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}
