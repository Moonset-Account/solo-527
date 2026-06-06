"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/ui/ChartCard";
import { TrendChart } from "@/components/charts/TrendChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { AnnotationModal } from "@/components/modals/AnnotationModal";
import { useAppStore } from "@/store";
import { MessageSquarePlus, Calendar, Clock, AlertTriangle } from "lucide-react";
import { formatDate } from "@/utils";

export default function TrendAnalysisPage() {
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  const getTrendData = useAppStore((state) => state.getTrendData);
  const getHeatmapData = useAppStore((state) => state.getHeatmapData);
  const annotations = useAppStore((state) => state.annotations);

  const trendData = useMemo(() => getTrendData(), [getTrendData]);
  const heatmapData = useMemo(() => getHeatmapData(), [getHeatmapData]);

  const handlePointClick = (date: string) => {
    setSelectedDate(date);
    setAnnotationModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-800">趋势分析与异常标注</h1>
            <p className="text-sm text-neutral-500 mt-1">
              分析等待时间的时间趋势，支持人工标注异常情况
            </p>
          </div>
          <button
            onClick={() => setAnnotationModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            添加标注
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">分析周期</p>
                <p className="text-lg font-bold text-neutral-800">近30天</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-success-50 rounded-lg">
                <Clock className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">日均就诊量</p>
                <p className="text-lg font-bold text-neutral-800 font-mono">
                  {Math.round(trendData.reduce((a, b) => a + b.totalVisits, 0) / trendData.length)}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-warning-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">异常标注数</p>
                <p className="text-lg font-bold text-neutral-800 font-mono">
                  {annotations.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ChartCard
          title="等待时间变化趋势"
          subtitle="点击任意数据点可添加异常标注说明"
        >
          <TrendChart
            data={trendData}
            annotations={annotations}
            height={380}
            onPointClick={handlePointClick}
          />
        </ChartCard>

        <ChartCard
          title="周内时段热力图"
          subtitle="不同星期和时段的等待时间分布"
        >
          <HeatmapChart data={heatmapData} height={380} />
        </ChartCard>

        <ChartCard title="异常标注历史" subtitle="所有标注的异常情况记录">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">标注日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">异常类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">说明</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">关联科室</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {annotations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                      暂无异常标注记录
                    </td>
                  </tr>
                ) : (
                  annotations.map((ann) => (
                    <tr key={ann.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm text-neutral-700 font-mono">
                        {ann.metadata?.date || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs bg-warning-100 text-warning-700 rounded-full">
                          {ann.annotationType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate">
                        {ann.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {ann.metadata?.deptId ? "特定科室" : "全部"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {formatDate(ann.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      <AnnotationModal
        isOpen={annotationModalOpen}
        onClose={() => {
          setAnnotationModalOpen(false);
          setSelectedDate(undefined);
        }}
        defaultDate={selectedDate}
      />
    </DashboardLayout>
  );
}
