'use client';

import { useState } from 'react';
import FilterPanel from '@/components/layout/FilterPanel';
import DataTable from '@/components/common/DataTable';
import RemarkPanel from '@/components/common/RemarkPanel';
import KPICard from '@/components/common/KPICard';
import { mockRemarks } from '@/data/mockData';
import { useFilterStore } from '@/store/useFilterStore';
import { useDetails, useAnalytics } from '@/hooks/useAnalytics';
import type { Prescription, Remark } from '@/types';
import { FileText, Clock, Pill, AlertTriangle, Download, X, Loader2, Database } from 'lucide-react';
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
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data: details, loading, metadata } = useDetails(filters, filters.drillDown, page, pageSize);
  const { data: analytics } = useAnalytics(filters, filters.drillDown);

  const kpiData = analytics?.kpi || {
    totalPrescriptions: 0,
    emergencyPrescriptions: 0,
    normalPrescriptions: 0,
    specialistPrescriptions: 0,
    avgWaitTime: 0,
    avgWaitTimeEmergency: 0,
    avgWaitTimeNormal: 0,
    avgWaitTimeSpecialist: 0,
    avgDispenseTime: 0,
    refundRate: 0,
    windowUtilization: {},
    peakHour: 9,
  };

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

  if (loading) {
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
          </div>
        </div>
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <FilterPanel />
          </div>
          <div className="flex-1 flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm text-gray-500">正在加载明细数据...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const records = details?.records || [];
  const pagination = details?.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 0 };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">处方明细查询</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">
                查看原始处方记录，支持下钻分析与添加人工备注
              </p>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                <Database className="w-3 h-3" />
                数据源: {metadata?.source || '本地计算'}
              </span>
            </div>
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
          {Object.keys(filters.drillDown).length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertTriangle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span className="text-sm text-primary-700">
                  当前下钻筛选：
                  {filters.drillDown.waitTimeRange && `等待时长 ${filters.drillDown.waitTimeRange}`}
                  {filters.drillDown.windowNo && `${filters.drillDown.windowNo}号窗口`}
                  {filters.drillDown.hour && `时段 ${filters.drillDown.hour}`}
                  {filters.drillDown.processNode && `流程节点 ${filters.drillDown.processNode}`}
                </span>
              </div>
              <button
                onClick={() => filters.clearDrillDown()}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 flex-shrink-0"
              >
                <X className="w-3 h-3" />
                清除下钻
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <KPICard
              title="筛选结果"
              value={formatNumber(pagination.total)}
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
            data={records}
            onAddRemark={handleAddRemark}
            onViewDetail={handleViewDetail}
          />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-card">
              <span className="text-sm text-gray-500">
                共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}

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
