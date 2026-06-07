'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FilterPanel from '@/components/layout/FilterPanel';
import WindowCompareChart from '@/components/charts/WindowCompareChart';
import PrescriptionStackChart from '@/components/charts/PrescriptionStackChart';
import KPICard from '@/components/common/KPICard';
import RemarkPanel from '@/components/common/RemarkPanel';
import { mockRemarks } from '@/data/mockData';
import { useFilterStore } from '@/store/useFilterStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Prescription, Remark, PharmacistCompareItem, DepartmentCompareItem } from '@/types';
import { Users, Building2, Pill, Clock, Loader2, Database, ExternalLink } from 'lucide-react';
import { formatMinutes, formatNumber, formatPercent, formatAmount } from '@/utils/formatters';

type CompareDimension = 'window' | 'pharmacist' | 'department' | 'time';

export default function ComparisonPage() {
  const router = useRouter();
  const filters = useFilterStore();
  const [compareDimension, setCompareDimension] = useState<CompareDimension>('window');
  const [remarks, setRemarks] = useState<Remark[]>(mockRemarks);
  const [remarkPanel, setRemarkPanel] = useState({
    isOpen: false,
    targetType: '',
    targetValue: '',
    targetTitle: '',
    prescription: null as Prescription | null,
  });

  const { data: analytics, loading, metadata } = useAnalytics(filters, filters.drillDown);

  const dimensions = [
    { key: 'window' as const, label: '按窗口对比', icon: Building2 },
    { key: 'pharmacist' as const, label: '按药师对比', icon: Users },
    { key: 'department' as const, label: '按科室对比', icon: Pill },
    { key: 'time' as const, label: '按时段对比', icon: Clock },
  ];

  const handleDrillDown = (type: 'window' | 'hour' | 'pharmacist' | 'department', value: string) => {
    if (type === 'window') {
      filters.setDrillDown({ windowNo: value });
    } else if (type === 'hour') {
      filters.setDrillDown({ hour: value });
    } else if (type === 'pharmacist') {
      filters.setPharmacists([value]);
    } else if (type === 'department') {
      filters.setDepartments([value]);
    }
    router.push('/details');
  };

  const handleAddRemark = (targetType: string, targetValue: string, targetTitle: string) => {
    setRemarkPanel({
      isOpen: true,
      targetType,
      targetValue,
      targetTitle,
      prescription: null,
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">多维度对比分析</h1>
          <p className="text-sm text-gray-500">
            按窗口、药师、科室、时段等多维度对比分析取药效率
          </p>
        </div>
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <FilterPanel />
          </div>
          <div className="flex-1 flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm text-gray-500">正在加载对比分析数据...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { windowCompare, hourlyPrescriptions, pharmacistCompare, departmentCompare, kpi: kpiData } = analytics;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">多维度对比分析</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            按窗口、药师、科室、时段等多维度对比分析取药效率
          </p>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            <Database className="w-3 h-3" />
            数据源: {metadata?.source || 'PostgreSQL + PostGIS'}
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FilterPanel />
        </div>

        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2">
              {dimensions.map((dim) => {
                const Icon = dim.icon;
                const isActive = compareDimension === dim.key;
                return (
                  <button
                    key={dim.key}
                    onClick={() => setCompareDimension(dim.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {dim.label}
                  </button>
                );
              })}
            </div>
          </div>

          {compareDimension === 'window' && (
            <>
              <WindowCompareChart
                data={windowCompare}
                onDrillDown={(w) => handleDrillDown('window', w)}
              />

              <div className="bg-white rounded-xl p-5 shadow-card">
                <h3 className="text-base font-semibold text-gray-900 mb-4">窗口详细对比</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">窗口</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">处方量</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均等待</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均配药</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">利用率</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">下钻明细</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {windowCompare.map((w) => (
                        <tr key={w.windowNo} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{w.windowNo}号窗口</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(w.totalPrescriptions)}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            <span className={w.avgWaitTime > 30 ? 'text-red-600 font-medium' : ''}>
                              {formatMinutes(w.avgWaitTime)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">{formatMinutes(w.avgDispenseTime)}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    w.utilization > 80 ? 'bg-red-500' : w.utilization > 60 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${w.utilization}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono">{w.utilization}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDrillDown('window', w.windowNo)}
                              className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                            >
                              查看明细 <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {compareDimension === 'pharmacist' && (
            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">药师效率对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">药师</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">职称</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">处理处方量</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均等待时长</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均配药时长</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">急诊占比</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">下钻明细</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pharmacistCompare.map((p: PharmacistCompareItem) => (
                      <tr key={p.pharmacistId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{p.pharmacistName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.title}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(p.totalPrescriptions)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          <span className={p.avgWaitTime > 30 ? 'text-red-600 font-medium' : ''}>
                            {formatMinutes(p.avgWaitTime)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatMinutes(p.avgDispenseTime)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatPercent(p.emergencyRate)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDrillDown('pharmacist', p.pharmacistId)}
                            className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                          >
                            查看明细 <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {compareDimension === 'department' && (
            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">科室处方对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">科室</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">类别</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">处方量</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均等待时长</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">急诊占比</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均金额</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">下钻明细</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {departmentCompare.map((d: DepartmentCompareItem) => (
                      <tr key={d.departmentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{d.departmentName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {d.deptCategory === 'emergency' ? '急诊' : d.deptCategory === 'specialist' ? '专科' : '门诊'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(d.totalPrescriptions)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          <span className={d.avgWaitTime > 30 ? 'text-red-600 font-medium' : ''}>
                            {formatMinutes(d.avgWaitTime)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatPercent(d.emergencyRate)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatAmount(d.avgAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDrillDown('department', d.departmentId)}
                            className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                          >
                            查看明细 <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {compareDimension === 'time' && (
            <PrescriptionStackChart
              data={hourlyPrescriptions}
              onDrillDown={(h) => handleDrillDown('hour', h)}
            />
          )}
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
