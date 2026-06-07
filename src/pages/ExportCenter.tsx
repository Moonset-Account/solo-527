import { useState, useRef } from 'react';
import {
  FileDown,
  FileText,
  Image,
  Table,
  Calendar,
  CheckCircle,
  Download,
  Eye,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PageContainer from '../components/layout/PageContainer';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../utils/mockData';
import { measurementsToCSV, calculateOverviewStats } from '../utils/dataService';
import { INDICATORS } from '../utils/constants';

export default function ExportCenter() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const stats = calculateOverviewStats(MOCK_SITES, MOCK_MEASUREMENTS);

  const handleExportCSV = async () => {
    setExporting('csv');
    await new Promise((resolve) => setTimeout(resolve, 500));

    const csv = measurementsToCSV(MOCK_MEASUREMENTS, MOCK_SITES);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `水质监测数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setExporting(null);
    setExportSuccess('csv');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`水质监测报告_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    setExporting(null);
    setExportSuccess('pdf');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExportImage = async () => {
    setExporting('image');
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `水质监测截图_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    }

    setExporting(null);
    setExportSuccess('image');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  return (
    <PageContainer
      title="报告导出中心"
      subtitle="导出数据用于周会复盘和存档"
    >
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-4">
          <ExportOptionCard
            title="导出 CSV 数据"
            description="导出原始监测数据，支持 Excel 打开和进一步分析"
            icon={Table}
            color="from-emerald-500 to-teal-600"
            onClick={handleExportCSV}
            loading={exporting === 'csv'}
            success={exportSuccess === 'csv'}
          />
          <ExportOptionCard
            title="导出 PDF 报告"
            description="生成标准化的周会报告，包含关键指标和趋势"
            icon={FileText}
            color="from-blue-500 to-cyan-600"
            onClick={handleExportPDF}
            loading={exporting === 'pdf'}
            success={exportSuccess === 'pdf'}
          />
          <ExportOptionCard
            title="导出截图"
            description="导出当前预览页面的高清截图"
            icon={Image}
            color="from-purple-500 to-violet-600"
            onClick={handleExportImage}
            loading={exporting === 'image'}
            success={exportSuccess === 'image'}
          />
        </div>

        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-slate-400" />
                报告预览
              </h3>
              <span className="text-xs text-slate-500">
                生成时间: {new Date().toLocaleString('zh-CN')}
              </span>
            </div>

            <div ref={previewRef} className="p-6 bg-white">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <FileDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-800">
                      河流水质监测周报
                    </h2>
                    <p className="text-sm text-slate-500">
                      报告周期: {new Date(Date.now() - 7 * 86400000).toLocaleDateString('zh-CN')} -{' '}
                      {new Date().toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <PreviewMetric label="监测站点" value={stats.totalSites.toString()} unit="个" />
                <PreviewMetric label="监测记录" value={stats.totalRecords.toLocaleString()} unit="条" />
                <PreviewMetric label="异常数据" value={stats.anomalyCount.toString()} unit="条" highlight />
                <PreviewMetric label="达标率" value={stats.complianceRate.toFixed(1)} unit="%" />
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">核心指标概况</h4>
                <div className="grid grid-cols-4 gap-3">
                  {stats.indicators.map((ind) => {
                    const indicator = INDICATORS.find((i) => i.code === ind.code);
                    return (
                      <div key={ind.code} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: indicator?.color }}
                          />
                          <span className="text-xs text-slate-600">{ind.name}</span>
                        </div>
                        <p className="text-lg font-mono font-bold text-slate-800">
                          {ind.avgValue?.toFixed(2) || '--'}
                          <span className="text-xs font-normal text-slate-400 ml-1">
                            {ind.unit}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          达标率: {ind.complianceRate.toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">河段水质概览</h4>
                <div className="space-y-2">
                  {stats.riverSections.slice(0, 4).map((section) => (
                    <div key={section.name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{section.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500 text-xs">{section.siteCount} 个站点</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{
                            backgroundColor:
                              section.avgGrade === 'Ⅰ' || section.avgGrade === 'Ⅱ'
                                ? '#10B981'
                                : section.avgGrade === 'Ⅲ'
                                ? '#FBBF24'
                                : '#F97316',
                          }}
                        >
                          {section.avgGrade}类
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {stats.recentAnomalies.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-rose-700 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    近期异常记录
                  </h4>
                  <div className="space-y-2">
                    {stats.recentAnomalies.slice(0, 3).map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className="flex items-center justify-between text-xs bg-rose-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-slate-700">{anomaly.siteName}</span>
                        <span className="text-rose-600 font-medium">{anomaly.indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

interface ExportOptionCardProps {
  title: string;
  description: string;
  icon: any;
  color: string;
  onClick: () => void;
  loading: boolean;
  success: boolean;
}

function ExportOptionCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  loading,
  success,
}: ExportOptionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-white rounded-xl p-5 shadow-card border border-slate-100 hover:shadow-card-hover transition-all text-left disabled:opacity-50"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}
        >
          {success ? (
            <CheckCircle className="w-6 h-6 text-white" />
          ) : loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Icon className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-slate-800">{title}</h4>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
          {success && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              导出成功
            </p>
          )}
        </div>
        <Download className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </div>
    </button>
  );
}

interface PreviewMetricProps {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}

function PreviewMetric({ label, value, unit, highlight }: PreviewMetricProps) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-rose-50' : 'bg-slate-50'}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold ${highlight ? 'text-rose-600' : 'text-slate-800'}`}>
        {value}
        <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
