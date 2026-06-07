'use client';

import { useState, useMemo } from 'react';
import FilterPanel from '@/components/layout/FilterPanel';
import WindowCompareChart from '@/components/charts/WindowCompareChart';
import PrescriptionStackChart from '@/components/charts/PrescriptionStackChart';
import KPICard from '@/components/common/KPICard';
import RemarkPanel from '@/components/common/RemarkPanel';
import {
  mockPrescriptions,
  mockRemarks,
  windows,
  departments,
  pharmacists,
  calculateWindowCompare,
  calculateHourlyPrescriptions,
  calculateKPIData,
} from '@/data/mockData';
import { useFilterStore } from '@/store/useFilterStore';
import { applyFilters } from '@/utils/filters';
import type { Prescription, Remark } from '@/types';
import { Users, Building2, Pill, Clock } from 'lucide-react';
import { formatMinutes, formatNumber } from '@/utils/formatters';

type CompareDimension = 'window' | 'pharmacist' | 'department' | 'time';

export default function ComparisonPage() {
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

  const filteredPrescriptions = useMemo(() => {
    return applyFilters(mockPrescriptions, filters, filters.drillDown);
  }, [filters]);

  const windowCompare = useMemo(() => calculateWindowCompare(filteredPrescriptions), [filteredPrescriptions]);
  const hourlyPrescriptions = useMemo(() => calculateHourlyPrescriptions(filteredPrescriptions), [filteredPrescriptions]);
  const kpiData = useMemo(() => calculateKPIData(filteredPrescriptions), [filteredPrescriptions]);

  const pharmacistCompare = useMemo(() => {
    const grouped: Record<string, Prescription[]> = {};
    filteredPrescriptions.forEach((p) => {
      if (!grouped[p.pharmacistName]) grouped[p.pharmacistName] = [];
      grouped[p.pharmacistName].push(p);
    });
    return Object.entries(grouped).map(([name, list]) => {
      const avgWait = list.reduce((s, p) => s + p.waitTime, 0) / list.length;
      const avgDispense = list.reduce((s, p) => s + p.dispenseTime, 0) / list.length;
      return {
        name,
        count: list.length,
        avgWaitTime: Math.round(avgWait * 10) / 10,
        avgDispenseTime: Math.round(avgDispense * 10) / 10,
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredPrescriptions]);

  const departmentCompare = useMemo(() => {
    const grouped: Record<string, Prescription[]> = {};
    filteredPrescriptions.forEach((p) => {
      if (!grouped[p.departmentName]) grouped[p.departmentName] = [];
      grouped[p.departmentName].push(p);
    });
    return Object.entries(grouped).map(([name, list]) => {
      const avgWait = list.reduce((s, p) => s + p.waitTime, 0) / list.length;
      const emergencyCount = list.filter((p) => p.type === 'emergency').length;
      return {
        name,
        count: list.length,
        avgWaitTime: Math.round(avgWait * 10) / 10,
        emergencyRate: Math.round((emergencyCount / list.length) * 100) / 100,
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredPrescriptions]);

  const dimensions = [
    { key: 'window' as const, label: '按窗口对比', icon: Building2 },
    { key: 'pharmacist' as const, label: '按药师对比', icon: Users },
    { key: 'department' as const, label: '按科室对比', icon: Pill },
    { key: 'time' as const, label: '按时段对比', icon: Clock },
  ];

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
                onDrillDown={(w) => handleAddRemark('window', w, `${w}号窗口`)}
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
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
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
                              onClick={() => handleAddRemark('window', w.windowNo, `${w.windowNo}号窗口`)}
                              className="text-xs text-primary-500 hover:text-primary-600"
                            >
                              添加备注
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">处理处方量</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均等待时长</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均配药时长</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pharmacistCompare.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(p.count)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          <span className={p.avgWaitTime > 30 ? 'text-red-600 font-medium' : ''}>
                            {formatMinutes(p.avgWaitTime)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatMinutes(p.avgDispenseTime)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleAddRemark('metric', p.name, p.name)}
                            className="text-xs text-primary-500 hover:text-primary-600"
                          >
                            添加备注
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">处方量</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">平均等待时长</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">急诊占比</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {departmentCompare.map((d, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(d.count)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          <span className={d.avgWaitTime > 30 ? 'text-red-600 font-medium' : ''}>
                            {formatMinutes(d.avgWaitTime)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${d.emergencyRate * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono">{(d.emergencyRate * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleAddRemark('metric', d.name, d.name)}
                            className="text-xs text-primary-500 hover:text-primary-600"
                          >
                            添加备注
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
              onDrillDown={(h) => handleAddRemark('period', h, `时段：${h}`)}
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
