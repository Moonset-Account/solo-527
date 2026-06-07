import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Activity, Droplets, Thermometer, AlertTriangle, FileCheck } from 'lucide-react';
import { GlobalFilterBar } from '@/components/filters/GlobalFilterBar';
import { DataCard } from '@/components/common/DataCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { SamplingMap } from '@/components/charts/SamplingMap';
import { ExceedRecordList } from '@/components/charts/ExceedRecordList';
import { ReportGenerator } from '@/components/report/ReportGenerator';
import { RoleSwitcher } from '@/components/common/RoleSwitcher';
import { useFilterStore } from '@/store/useFilterStore';
import { WATER_QUALITY_RECORDS } from '@/data/mockData';
import { filterWaterQualityRecords, calculateSummaryStats } from '@/utils/dataProcessing';
import { useChartInteractionStore } from '@/store/useChartInteractionStore';

export const Dashboard: React.FC = () => {
  const filters = useFilterStore();
  const { selectedPointId, resetInteraction } = useChartInteractionStore();
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredRecords = useMemo(() => {
    return filterWaterQualityRecords(WATER_QUALITY_RECORDS, filters);
  }, [filters]);

  const stats = useMemo(() => {
    return calculateSummaryStats(filteredRecords);
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg">
              <Droplets size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">河流水质监测公开平台</h1>
              <p className="text-xs text-zinc-500">清水河流域水质监测数据分析工作台</p>
            </div>
          </div>
          <RoleSwitcher />
        </div>
        <GlobalFilterBar />
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DataCard
            title="监测样本数"
            value={stats.totalSamples.toLocaleString()}
            subtitle="筛选范围内有效样本"
            icon={Activity}
            color="default"
            loading={isLoading}
          />
          <DataCard
            title="水质达标率"
            value={`${stats.complianceRate}%`}
            subtitle="符合标准限值的样本比例"
            icon={FileCheck}
            color={stats.complianceRate >= 90 ? 'success' : stats.complianceRate >= 70 ? 'warning' : 'danger'}
            loading={isLoading}
          />
          <DataCard
            title="超标记录"
            value={stats.exceedCount}
            subtitle="超出标准限值的样本数"
            icon={AlertTriangle}
            color={stats.exceedCount > 0 ? 'danger' : 'default'}
            loading={isLoading}
          />
          <DataCard
            title="预警记录"
            value={stats.warningCount}
            subtitle="接近标准限值的样本数"
            icon={Thermometer}
            color={stats.warningCount > 0 ? 'warning' : 'default'}
            loading={isLoading}
          />
        </div>

        {selectedPointId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-800">
              🎯 已选中采样点，趋势图已过滤显示对应数据
            </p>
            <button
              onClick={resetInteraction}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              取消选择
            </button>
          </div>
        )}

        <div ref={chartAreaRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TrendChart
              records={filteredRecords}
              selectedIndicators={filters.selectedIndicators}
              loading={isLoading}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SamplingMap
                records={filteredRecords}
                loading={isLoading}
              />
              <ExceedRecordList
                records={filteredRecords}
                maxItems={8}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <ReportGenerator
              records={filteredRecords}
              chartRef={chartAreaRef}
            />
            
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <h3 className="font-semibold text-zinc-900 mb-3">数据说明</h3>
              <div className="space-y-3 text-xs text-zinc-600">
                <div className="p-2 bg-zinc-50 rounded">
                  <p className="font-medium text-zinc-700 mb-1">📊 数据范围</p>
                  <p>2025年1月1日 - 2025年12月31日，共8个监测点位</p>
                </div>
                <div className="p-2 bg-zinc-50 rounded">
                  <p className="font-medium text-zinc-700 mb-1">🔬 检测标准</p>
                  <p>依据《地表水环境质量标准》(GB 3838-2002)</p>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-200">
                  <p className="font-medium text-amber-800 mb-1">⚠️ 使用限制</p>
                  <p className="text-amber-700">本平台数据为模拟演示数据，仅供功能展示，不代表真实水质状况。实际应用请以官方发布数据为准。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-zinc-200 bg-white">
        <div className="px-6 text-center text-xs text-zinc-500">
          <p>© 2025 河流水质监测公开平台 · 数据可视化分析工作台</p>
          <p className="mt-1">数据更新时间: 每日 08:00 · 技术支持: D3.js + React</p>
        </div>
      </footer>
    </div>
  );
};
