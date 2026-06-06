"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/ui/ChartCard";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { KPICard } from "@/components/ui/KPICard";
import { useAppStore } from "@/store";
import { Clock, Users, Activity } from "lucide-react";

export default function ProcessAnalysisPage() {
  const getFilteredVisits = useAppStore((state) => state.getFilteredVisits);
  const getSankeyData = useAppStore((state) => state.getSankeyData);
  const getKPIMetrics = useAppStore((state) => state.getKPIMetrics);

  const filteredVisits = useMemo(() => getFilteredVisits(), [getFilteredVisits]);
  const sankeyData = useMemo(() => getSankeyData(), [getSankeyData]);
  const kpi = useMemo(() => getKPIMetrics(), [getKPIMetrics]);

  const processNodes = [
    { name: "挂号等待", value: kpi.avgWaitRegister, key: "register" },
    { name: "分诊等待", value: kpi.avgWaitTriage, key: "triage" },
    { name: "就诊等待", value: kpi.avgWaitDoctor, key: "doctor" },
    { name: "缴费等待", value: kpi.avgWaitPayment, key: "payment" },
    { name: "取药等待", value: kpi.avgWaitMedicine, key: "medicine" },
  ];

  const maxWait = Math.max(...processNodes.map((n) => n.value));

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">流程瓶颈分析</h1>
          <p className="text-sm text-neutral-500 mt-1">
            深入分析门诊各流程节点的等待时间，识别效率瓶颈
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {processNodes.map((node) => (
            <KPICard
              key={node.key}
              title={node.name}
              value={node.value}
              unit="分钟"
              isTime={true}
              color={node.value === maxWait ? "danger" : "primary"}
              icon={<Clock className="w-4 h-4" />}
            />
          ))}
        </div>

        <ChartCard
          title="全流程流转桑基图"
          subtitle="点击节点可查看该环节的详细数据"
        >
          <SankeyChart data={sankeyData} height={400} />
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="各环节等待时间对比">
            <div className="space-y-4">
              {processNodes.map((node, index) => (
                <div key={node.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-neutral-700">{node.name}</span>
                    <span className="text-sm font-mono font-medium text-neutral-800">
                      {node.value} 分钟
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(node.value / maxWait) * 100}%`,
                        backgroundColor:
                          node.value === maxWait ? "#F53F3F" : "#165DFF",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="瓶颈诊断结论">
            <div className="space-y-4">
              <div className="p-4 bg-danger-50 rounded-lg border border-danger-100">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-danger-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-danger-700">主要瓶颈</p>
                    <p className="text-sm text-danger-600 mt-1">
                      {kpi.bottleneckNode} 是当前最主要的瓶颈环节，平均等待时间最长。
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-warning-50 rounded-lg border border-warning-100">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warning-700">优化建议</p>
                    <p className="text-sm text-warning-600 mt-1">
                      建议增加 {kpi.bottleneckNode.replace("等待", "")} 环节的资源配置，
                      或优化流程以减少患者等待时间。
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary-700">统计说明</p>
                    <p className="text-sm text-primary-600 mt-1">
                      基于 {filteredVisits.length} 条就诊记录计算，统计口径以各环节时间戳差值为准。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
