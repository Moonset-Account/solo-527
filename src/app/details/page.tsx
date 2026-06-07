'use client';

import { useState, useMemo } from 'react';
import FilterPanel from '@/components/layout/FilterPanel';
import DataTable from '@/components/common/DataTable';
import RemarkPanel from '@/components/common/RemarkPanel';
import KPICard from '@/components/common/KPICard';
import {
  mockPrescriptions,
  mockRemarks,
  calculateKPIData,
} from '@/data/mockData';
import { useFilterStore } from '@/store/useFilterStore';
import type { Prescription, Remark } from '@/types';
import { FileText, Clock, Pill, AlertTriangle, Download } from 'lucide-react';
import { formatNumber, formatPercent } from '@/utils/formatters';

export default function DetailsPage() {
  const filters = useFilterStore();
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
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

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

  const kpiData = useMemo(() => calculateKPIData(filteredPrescriptions), [filteredPrescriptions]);

  const handleAddRemark = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setRemarkPanel({
      isOpen: true,
      targetType: 'prescription',
      targetValue: prescription.id,
      targetTitle: `处方 ${prescription.prescriptionNo}`,
      prescription,
    });
  };

  const handleViewDetail = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setRemarkPanel({
      isOpen: true,
      targetType: 'prescription',
      targetValue: prescription.id,
      targetTitle: `处方 ${prescription.prescriptionNo}`,
      prescription,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">处方明细查询</h1>
            <p className="text-sm text-gray-500">
              查看原始处方记录，支持下钻分析与添加人工备注
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm">
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FilterPanel />
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <KPICard
              title="筛选结果"
              value={formatNumber(filteredPrescriptions.length)}
              unit="条"
              icon={<FileText className="w-5 h-5" />}
              color="blue"
            />
            <KPICard
              title="平均等待"
              value={kpiData.avgWaitTime.toFixed(1)}
              unit="分钟"
              icon={<Clock className="w-5 h-5" />}
              color="orange"
            />
            <KPICard
              title="平均配药"
              value={kpiData.avgDispenseTime.toFixed(1)}
              unit="分钟"
              icon={<Pill className="w-5 h-5" />}
              color="green"
            />
            <KPICard
              title="退药率"
              value={formatPercent(kpiData.refundRate)}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />
          </div>

          <DataTable
            data={filteredPrescriptions}
            onAddRemark={handleAddRemark}
            onViewDetail={handleViewDetail}
          />

          {selectedPrescription && (
            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">处方流转详情</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  <div className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center z-10 flex-shrink-0">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">处方创建</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedPrescription.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center z-10 flex-shrink-0">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">已缴费</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedPrescription.paidAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center z-10 flex-shrink-0">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">配药完成</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedPrescription.dispensedAt).toLocaleString('zh-CN')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        配药时长：{selectedPrescription.dispenseTime} 分钟
                      </p>
                    </div>
                  </div>
                  <div className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center z-10 flex-shrink-0">
                      <span className="text-xs font-bold">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">已叫号</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedPrescription.calledAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center z-10 flex-shrink-0">
                      <span className="text-xs font-bold">5</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPrescription.refundedAt ? '已退药' : '已取药'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(
                          selectedPrescription.refundedAt || selectedPrescription.pickedAt
                        ).toLocaleString('zh-CN')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        总等待时长：{selectedPrescription.waitTime} 分钟
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-5 shadow-card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">数据校验规则</h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">下钻校验</h4>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• 汇总数据与明细数据必须一一对应</li>
                  <li>• 点击图表可直接下钻到对应明细</li>
                  <li>• 筛选条件联动，明细数据实时更新</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">时间窗口</h4>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• 默认展示最近30天数据</li>
                  <li>• 支持自定义日期范围选择</li>
                  <li>• 数据按小时粒度统计分析</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">口径说明</h4>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• 急诊处方：急诊科开具且标记为急诊</li>
                  <li>• 普通处方：门诊科室开具的常规处方</li>
                  <li>• 专科处方：肿瘤科等专科开具的处方</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">对比原则</h4>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• 同一维度下的数据横向对比</li>
                  <li>• 异常数据自动标红提示</li>
                  <li>• 支持添加人工备注说明原因</li>
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
