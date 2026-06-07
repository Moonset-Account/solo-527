import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Clock, Check, Loader2 } from 'lucide-react';
import { WaterQualityRecord, FilterState } from '@/types';
import { useFilterStore } from '@/store/useFilterStore';
import { usePermissionStore } from '@/store/usePermissionStore';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import { calculateSummaryStats } from '@/utils/dataProcessing';

interface ReportGeneratorProps {
  records: WaterQualityRecord[];
  chartRef?: React.RefObject<HTMLElement>;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ records, chartRef }) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  
  const filters = useFilterStore();
  const { canExportRawData } = usePermissionStore();

  const handleExportPDF = async () => {
    if (!chartRef?.current) return;
    
    setIsExporting('pdf');
    try {
      const summaryStats = calculateSummaryStats(records);
      await exportToPDF(chartRef.current, records, filters, summaryStats);
      setShowSuccess('pdf');
      setTimeout(() => setShowSuccess(null), 2000);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = () => {
    setIsExporting('excel');
    try {
      exportToExcel(records, filters);
      setShowSuccess('excel');
      setTimeout(() => setShowSuccess(null), 2000);
    } catch (error) {
      console.error('Excel export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const filterState = filters as FilterState;
  const hasFilters = 
    filterState.selectedSections.length > 0 ||
    filterState.selectedPoints.length > 0 ||
    filterState.selectedMonths.length > 0 ||
    filterState.selectedIndicators.length < 4 ||
    filterState.selectedAgencies.length > 0;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Download size={18} className="text-blue-600" />
        <h3 className="font-semibold text-zinc-900">报告导出</h3>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800 mb-1">当前筛选条件将嵌入报告</p>
          <p className="text-xs text-blue-600">
            {hasFilters ? '已设置筛选条件，报告将仅包含筛选范围内数据' : '未设置筛选，报告将包含全部数据'}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting !== null}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              {isExporting === 'pdf' ? (
                <Loader2 size={20} className="text-blue-600 animate-spin" />
              ) : showSuccess === 'pdf' ? (
                <Check size={20} className="text-emerald-600" />
              ) : (
                <FileText size={20} className="text-red-500" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-800">导出分析报告 (PDF)</p>
                <p className="text-xs text-zinc-500">包含图表、统计摘要和口径说明</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting !== null || !canExportRawData}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              {isExporting === 'excel' ? (
                <Loader2 size={20} className="text-emerald-600 animate-spin" />
              ) : showSuccess === 'excel' ? (
                <Check size={20} className="text-emerald-600" />
              ) : (
                <FileSpreadsheet size={20} className="text-emerald-600" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-800">导出原始数据 (Excel)</p>
                <p className="text-xs text-zinc-500">
                  {canExportRawData ? '包含所有字段的完整数据表格' : '登录研究团队账号后可导出'}
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock size={12} />
            <span>定时报表功能需要管理员权限配置</span>
          </div>
        </div>
      </div>
    </div>
  );
};
