'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  FileText,
  Pill,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Database,
} from 'lucide-react';
import KPICard from '@/components/common/KPICard';
import WaitDistributionChart from '@/components/charts/WaitDistributionChart';
import WindowCompareChart from '@/components/charts/WindowCompareChart';
import PrescriptionStackChart from '@/components/charts/PrescriptionStackChart';
import FilterPanel from '@/components/layout/FilterPanel';
import RemarkPanel from '@/components/common/RemarkPanel';
import PharmacyHeatmap from '@/components/map/PharmacyHeatmap';
import { mockRemarks } from '@/data/mockData';
import { formatPercent, formatNumber } from '@/utils/formatters';
import { useFilterStore } from '@/store/useFilterStore';
import { useAnalytics, useHeatmap } from '@/hooks/useAnalytics';
import type { Prescription, Remark } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [remarks, setRemarks] = useState<Remark[]>(mockRemarks);
  const [remarkPanel, setRemarkPanel] = useState<{
    isOpen: boolean;
    targetType: string;
    targetValue: string;
    targetTitle: string;
    prescription: Prescription | null;
  }>({
    isOpen: false,
    targetType: '',
    targetValue: '',
    targetTitle: '',
    prescription: null,
  });

  const filters = useFilterStore();
  const { data: analytics, loading, metadata } = useAnalytics(filters, filters.drillDown);
  const { data: heatmap } = useHeatmap(filters, filters.drillDown);

  const handleDrillDown = (type: 'waitTime' | 'window' | 'hour', value: string) => {
    if (type === 'waitTime') {
      filters.setDrillDown({ waitTimeRange: value });
    } else if (type === 'window') {
      filters.setDrillDown({ windowNo: value });
    } else if (type === 'hour') {
      filters.setDrillDown({ hour: value });
    }
    router.push('/details');
  };

  const handleAddRemark = (targetType: string, targetValue: string, targetTitle: string, prescription?: Prescription) => {
    setRemarkPanel({
      isOpen: true,
      targetType,
      targetValue,
      targetTitle,
      prescription: prescription || null,
    });
  };

  const handleAddRemarkSubmit = (remark: Omit<Remark, 'id' | 'createdAt'>) => {
    const newRemark: Remark = {
      ...remark,
      id: `r${remarks.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    setRemarks([...remarks, newRemark]);
  };

  if (loading || !analytics) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">药房运营复盘总览</h1>
          <p className="text-sm text-gray-500">
            基于处方全流程数据分析取药瓶颈，支持多维度对比与下钻查询
          </p>
        </div>
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <FilterPanel />
          </div>
          <div className="flex-1 flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm text-gray-500">正在从 {metadata?.source || '数据源'} 加载数据...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { kpi: kpiData, waitDistribution, windowCompare, hourlyPrescriptions } = analytics;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">药房运营复盘总览</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            基于处方全流程数据分析取药瓶颈，支持多维度对比与下钻查询
          </p>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            <Database className="w-3 h-3" />
            数据源: {metadata?.source || '本地计算'}
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FilterPanel />
        </div>

        <div className="flex-1 space-y-6">
          {Object.keys(filters.drillDown).length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-primary-700">
                  当前下钻筛选：
                  {filters.drillDown.waitTimeRange && `等待时长 ${filters.drillDown.waitTimeRange}`}
                  {filters.drillDown.windowNo && `${filters.drillDown.windowNo}号窗口`}
                  {filters.drillDown.hour && `时段 ${filters.drillDown.hour}`}
                </span>
              </div>
              <button
                onClick={() => filters.clearDrillDown()}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                清除下钻
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <KPICard
              title="总处方量"
              value={formatNumber(kpiData.totalPrescriptions)}
              unit="张"
              trend={5.2}
              icon={<FileText className="w-5 h-5" />}
              color="blue"
              onClick={() => router.push('/details')}
            />
            <KPICard
              title="平均等待时长"
              value={kpiData.avgWaitTime.toFixed(1)}
              unit="分钟"
              trend={-8.3}
              icon={<Clock className="w-5 h-5" />}
              color="orange"
              warning={kpiData.avgWaitTime > 25}
              onClick={() => router.push('/details')}
            />
            <KPICard
              title="配药效率"
              value={kpiData.avgDispenseTime.toFixed(1)}
              unit="分钟/张"
              trend={-3.1}
              icon={<Pill className="w-5 h-5" />}
              color="green"
              onClick={() => router.push('/details')}
            />
            <KPICard
              title="退药率"
              value={formatPercent(kpiData.refundRate)}
              trend={0.5}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
              warning={kpiData.refundRate > 0.03}
              onClick={() => router.push('/details')}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
              <p className="text-sm text-red-600 font-medium mb-1">急诊处方</p>
              <p className="text-2xl font-bold text-red-700 font-mono">
                {formatNumber(kpiData.emergencyPrescriptions)}
              </p>
              <p className="text-xs text-red-500 mt-1">
                平均等待 {kpiData.avgWaitTimeEmergency.toFixed(1)} 分钟
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">普通处方</p>
              <p className="text-2xl font-bold text-blue-700 font-mono">
                {formatNumber(kpiData.normalPrescriptions)}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                平均等待 {kpiData.avgWaitTimeNormal.toFixed(1)} 分钟
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium mb-1">专科处方</p>
              <p className="text-2xl font-bold text-green-700 font-mono">
                {formatNumber(kpiData.specialistPrescriptions)}
              </p>
              <p className="text-xs text-green-500 mt-1">
                平均等待 {kpiData.avgWaitTimeSpecialist.toFixed(1)} 分钟
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <WaitDistributionChart
              data={waitDistribution}
              onDrillDown={(range) => handleDrillDown('waitTime', range)}
            />
            <WindowCompareChart
              data={windowCompare}
              onDrillDown={(windowNo) => handleDrillDown('window', windowNo)}
            />
          </div>

          <PrescriptionStackChart
            data={hourlyPrescriptions}
            onDrillDown={(hour) => handleDrillDown('hour', hour)}
          />

          <PharmacyHeatmap
            data={heatmap}
            onWindowClick={(windowNo) => handleDrillDown('window', windowNo)}
          />

          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">最近备注</h3>
              <button
                onClick={() => router.push('/details')}
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {remarks.slice(0, 3).map((remark) => (
                <div
                  key={remark.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    handleAddRemark(remark.targetType, remark.targetValue, remark.targetValue)
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {remark.targetType === 'window'
                        ? `${remark.targetValue}号窗口`
                        : remark.targetType === 'metric'
                        ? remark.targetValue
                        : remark.targetValue}
                    </span>
                    <span className="text-xs text-gray-400">{remark.author}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{remark.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RemarkPanel
        isOpen={remarkPanel.isOpen}
        onClose={() => setRemarkPanel({ ...remarkPanel, isOpen: false })}
        targetType={remarkPanel.targetType}
        targetValue={remarkPanel.targetValue}
        targetTitle={remarkPanel.targetTitle}
        remarks={remarks}
        onAddRemark={handleAddRemarkSubmit}
        prescription={remarkPanel.prescription}
      />
    </div>
  );
}
