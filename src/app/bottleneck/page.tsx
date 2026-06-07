'use client';

import { useState, useMemo } from 'react';
import BottleneckSankeyChart from '@/components/charts/BottleneckSankeyChart';
import FilterPanel from '@/components/layout/FilterPanel';
import WaitDistributionChart from '@/components/charts/WaitDistributionChart';
import KPICard from '@/components/common/KPICard';
import RemarkPanel from '@/components/common/RemarkPanel';
import {
  mockPrescriptions,
  mockRemarks,
  calculateSankeyData,
  calculateWaitDistribution,
  calculateKPIData,
} from '@/data/mockData';
import { useFilterStore } from '@/store/useFilterStore';
import type { Prescription, Remark } from '@/types';
import { Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { formatMinutes, formatPercent } from '@/utils/formatters';

export default function BottleneckPage() {
  const filters = useFilterStore();
  const [remarks, setRemarks] = useState<Remark[]>(mockRemarks);
  const [remarkPanel, setRemarkPanel] = useState({
    isOpen: false,
    targetType: '',
    targetValue: '',
    targetTitle: '',
    prescription: null as Prescription | null,
  });

  const filteredPrescriptions = useMemo(() => {
    return mockPrescriptions.filter((p) => {
      if (filters.windows.length > 0 && !filters.windows.includes(p.windowId)) return false;
      if (filters.pharmacists.length > 0 && !filters.pharmacists.includes(p.pharmacistId)) return false;
      if (filters.departments.length > 0 && !filters.departments.includes(p.departmentId)) return false;
      if (filters.prescriptionTypes.length > 0 && !filters.prescriptionTypes.includes(p.type)) return false;
      if (filters.timePeriods.length > 0 && !filters.timePeriods.includes(p.timePeriod)) return false;
      return true;
    });
  }, [filters]);

  const sankeyData = useMemo(() => calculateSankeyData(filteredPrescriptions), [filteredPrescriptions]);
  const waitDistribution = useMemo(() => calculateWaitDistribution(filteredPrescriptions), [filteredPrescriptions]);
  const kpiData = useMemo(() => calculateKPIData(filteredPrescriptions), [filteredPrescriptions]);

  const bottlenecks = useMemo(() => {
    return [
      {
        stage: '缴费→配药',
        avgDuration: kpiData.avgDispenseTime,
        count: filteredPrescriptions.length,
        severity: kpiData.avgDispenseTime > 15 ? 'critical' : kpiData.avgDispenseTime > 10 ? 'warning' : 'normal',
        description: '配药环节耗时较长，建议增加药师或优化备药流程',
      },
      {
        stage: '叫号→取药',
        avgDuration: 8.5,
        count: filteredPrescriptions.length,
        severity: 'normal',
        description: '患者取药响应正常',
      },
      {
        stage: '处方创建→缴费',
        avgDuration: 7.2,
        count: filteredPrescriptions.length,
        severity: 'warning',
        description: '部分患者缴费排队时间较长，建议增加自助缴费机',
      },
    ];
  }, [kpiData, filteredPrescriptions]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">流程瓶颈分析</h1>
        <p className="text-sm text-gray-500">
          通过桑基图分析处方全流程流转，识别各环节瓶颈
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FilterPanel />
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <KPICard
              title="平均流转时长"
              value={(kpiData.avgWaitTime + kpiData.avgDispenseTime).toFixed(1)}
              unit="分钟"
              icon={<Activity className="w-5 h-5" />}
              color="blue"
            />
            <KPICard
              title="配药平均耗时"
              value={kpiData.avgDispenseTime.toFixed(1)}
              unit="分钟"
              icon={<Clock className="w-5 h-5" />}
              color="orange"
              warning={kpiData.avgDispenseTime > 15}
            />
            <KPICard
              title="瓶颈环节数"
              value={bottlenecks.filter((b) => b.severity !== 'normal').length}
              unit="个"
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />
            <KPICard
              title="流程效率"
              value={formatPercent(0.82)}
              icon={<TrendingUp className="w-5 h-5" />}
              color="green"
            />
          </div>

          <BottleneckSankeyChart
            data={sankeyData}
            onDrillDown={(node) => handleAddRemark('metric', node, `节点分析：${node}`)}
          />

          <div className="grid grid-cols-2 gap-6">
            <WaitDistributionChart data={waitDistribution} />

            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">瓶颈环节识别</h3>
              <div className="space-y-3">
                {bottlenecks.map((b, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      b.severity === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : b.severity === 'warning'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{b.stage}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          b.severity === 'critical'
                            ? 'bg-red-500 text-white'
                            : b.severity === 'warning'
                            ? 'bg-orange-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {b.severity === 'critical' ? '严重' : b.severity === 'warning' ? '警告' : '正常'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      平均耗时：
                      <span
                        className={`font-mono font-medium ${
                          b.avgDuration > 15 ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {formatMinutes(b.avgDuration)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{b.description}</p>
                    <button
                      onClick={() => handleAddRemark('period', b.stage, b.stage)}
                      className="mt-2 text-xs text-primary-500 hover:text-primary-600"
                    >
                      + 添加备注
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">口径说明</h3>
            <div className="grid grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">时间节点定义</h4>
                <ul className="space-y-1.5">
                  <li>• <strong>处方创建：</strong>医生在HIS系统中开具处方的时间</li>
                  <li>• <strong>已缴费：</strong>患者完成缴费的时间</li>
                  <li>• <strong>配药中：</strong>药师开始配药的时间</li>
                  <li>• <strong>已叫号：</strong>配药完成后叫号的时间</li>
                  <li>• <strong>已取药：</strong>患者取走药品的时间</li>
                  <li>• <strong>已退药：</strong>患者申请退药完成的时间</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">指标计算口径</h4>
                <ul className="space-y-1.5">
                  <li>• <strong>总等待时长：</strong>取药时间 - 处方创建时间</li>
                  <li>• <strong>配药时长：</strong>配药完成时间 - 开始配药时间</li>
                  <li>• <strong>窗口利用率：</strong>实际处方量 / 窗口日容量*统计天数</li>
                  <li>• <strong>退药率：</strong>退药处方数 / 总处方数</li>
                  <li>• <strong>急诊优先：</strong>急诊处方平均优先级高于普通处方</li>
                </ul>
              </div>
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
