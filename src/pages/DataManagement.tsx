import { useState, useMemo, useCallback } from 'react';
import {
  Upload,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Table,
  BookOpen,
  Download,
  Plus,
  Loader2,
  X,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import PageContainer from '../components/layout/PageContainer';
import { INDICATORS, WATER_QUALITY_GRADES } from '../utils/constants';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../utils/mockData';
import { runQualityCheck, measurementsToCSV } from '../utils/dataService';
import { api } from '../utils/apiClient';
import type { QualityCheckResult } from '../types';

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<'import' | 'quality' | 'dictionary'>('quality');
  const [qualityCheck, setQualityCheck] = useState<QualityCheckResult | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message?: string;
    imported?: number;
    skipped?: number;
  } | null>(null);

  useMemo(() => {
    const result = runQualityCheck(MOCK_MEASUREMENTS, MOCK_SITES);
    setQualityCheck(result);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImportFile(file);
      generatePreview();
    }
  };

  const generatePreview = () => {
    const preview = Array(5).fill(null).map((_, i) => ({
      采样时间: new Date(Date.now() - i * 86400000).toLocaleString('zh-CN'),
      站点名称: MOCK_SITES[i % MOCK_SITES.length].name,
      水温: (15 + Math.random() * 10).toFixed(1),
      pH: (6.5 + Math.random() * 2).toFixed(2),
      溶解氧: (5 + Math.random() * 5).toFixed(2),
      氨氮: (0.2 + Math.random() * 1).toFixed(3),
      状态: Math.random() > 0.1 ? '正常' : '异常',
    }));
    setImportPreview(preview);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      generatePreview();
    }
  };

  const handleConfirmImport = useCallback(async () => {
    if (importPreview.length === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      const result = await api.measurements.import(importPreview);
      setImportResult({
        success: result.success,
        message: result.message,
        imported: result.imported,
        skipped: result.skipped,
      });

      if (result.success) {
        setImportPreview([]);
        setImportFile(null);
        const qualityResult = runQualityCheck(MOCK_MEASUREMENTS, MOCK_SITES);
        setQualityCheck(qualityResult);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: '导入失败，请重试',
      });
    } finally {
      setImporting(false);
    }
  }, [importPreview]);

  const sampleCountChart = qualityCheck
    ? {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: Object.keys(qualityCheck.sampleCountByMonth).sort(),
          axisLabel: { rotate: 45, fontSize: 11 },
        },
        yAxis: { type: 'value' },
        series: [
          {
            data: Object.keys(qualityCheck.sampleCountByMonth)
              .sort()
              .map((k) => qualityCheck.sampleCountByMonth[k]),
            type: 'bar',
            itemStyle: { color: '#0ea5e9' },
            barWidth: '50%',
          },
        ],
      }
    : null;

  return (
    <PageContainer
      title="数据管理中心"
      subtitle="数据导入、质量检查与数据字典维护"
      actions={
        <button
          onClick={() => {
            const csv = measurementsToCSV(MOCK_MEASUREMENTS, MOCK_SITES);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'water_quality_data.csv';
            link.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          导出示例数据
        </button>
      }
    >
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { key: 'quality', label: '质量检查', icon: AlertTriangle },
          { key: 'import', label: '批量导入', icon: Upload },
          { key: 'dictionary', label: '数据字典', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-cyan-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'quality' && qualityCheck && (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4">
            <QualityStatCard
              title="总记录数"
              value={qualityCheck.totalRecords.toLocaleString()}
              icon={Database}
              color="from-cyan-500 to-blue-600"
            />
            <QualityStatCard
              title="异常数据"
              value={qualityCheck.anomalyCount.toString()}
              icon={AlertTriangle}
              color="from-amber-500 to-orange-600"
            />
            <QualityStatCard
              title="水温缺失"
              value={qualityCheck.missingValues.temperature.toString()}
              icon={XCircle}
              color="from-rose-500 to-red-600"
            />
            <QualityStatCard
              title="pH缺失"
              value={qualityCheck.missingValues.ph.toString()}
              icon={XCircle}
              color="from-violet-500 to-purple-600"
            />
            <QualityStatCard
              title="溶解氧缺失"
              value={qualityCheck.missingValues.dissolvedOxygen.toString()}
              icon={XCircle}
              color="from-emerald-500 to-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <h3 className="font-display font-semibold text-slate-800 mb-4">按月样本量分布</h3>
              <div className="h-64">
                <ReactECharts option={sampleCountChart} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <h3 className="font-display font-semibold text-slate-800 mb-4">各站点样本量统计</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(qualityCheck.sampleCountBySite)
                  .sort((a, b) => b[1] - a[1])
                  .map(([site, count]) => {
                    const max = Math.max(...Object.values(qualityCheck.sampleCountBySite));
                    const percentage = (count / max) * 100;
                    return (
                      <div key={site}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-700 truncate">{site}</span>
                          <span className="font-mono font-medium text-slate-600">{count}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Table className="w-5 h-5 text-slate-400" />
              缺失值详情
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">指标名称</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">缺失数量</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">缺失率</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {INDICATORS.map((ind) => {
                    const missing = (qualityCheck.missingValues as any)[ind.code] || 0;
                    const rate = ((missing / qualityCheck.totalRecords) * 100).toFixed(2);
                    const isGood = Number(rate) < 5;
                    return (
                      <tr key={ind.code} className="border-b border-slate-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: ind.color }} />
                            {ind.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">{missing}</td>
                        <td className="py-3 px-4 font-mono">{rate}%</td>
                        <td className="py-3 px-4">
                          {isGood ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              正常
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              需关注
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive ? 'border-cyan-400 bg-cyan-50' : 'border-slate-300 bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">拖拽 CSV 文件到此处上传</h3>
            <p className="text-slate-500 mb-4">或点击下方按钮选择文件</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 cursor-pointer transition-colors">
              <Plus className="w-4 h-4" />
              选择文件
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {importFile && (
              <p className="mt-4 text-sm text-slate-600">
                已选择: <span className="font-medium">{importFile.name}</span>
              </p>
            )}
          </div>

          {importResult && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                importResult.success
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-rose-50 border border-rose-200'
              }`}
            >
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    importResult.success ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {importResult.message}
                </p>
                {importResult.success && importResult.imported !== undefined && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    成功导入 {importResult.imported} 条
                    {importResult.skipped && importResult.skipped > 0
                      ? `，跳过 ${importResult.skipped} 条`
                      : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-semibold text-slate-800">数据预览</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    共 {importPreview.length} 条数据校验通过
                  </span>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        确认导入
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {Object.keys(importPreview[0]).map((key) => (
                        <th key={key} className="text-left py-3 px-4 font-medium text-slate-600">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-3 px-4 text-slate-700">
                            {val as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dictionary' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-400" />
              监测指标定义
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">指标编码</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">指标名称</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">单位</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">标准下限</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">标准上限</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">等级阈值</th>
                  </tr>
                </thead>
                <tbody>
                  {INDICATORS.map((ind) => (
                    <tr key={ind.code} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-mono text-slate-500">{ind.code}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: ind.color }} />
                          <span className="font-medium text-slate-800">{ind.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{ind.unit || '-'}</td>
                      <td className="py-3 px-4 font-mono">{ind.standardMin}</td>
                      <td className="py-3 px-4 font-mono">{ind.standardMax}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {WATER_QUALITY_GRADES.map((grade) => (
                            <span
                              key={grade.grade}
                              className="text-xs px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: grade.color }}
                              title={`${grade.grade}类: ${ind.gradeThresholds[grade.grade]}`}
                            >
                              {grade.grade}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-4">水质等级说明</h3>
            <div className="grid grid-cols-6 gap-4">
              {WATER_QUALITY_GRADES.map((grade) => (
                <div key={grade.grade} className="text-center p-4 rounded-lg bg-slate-50">
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: grade.color }}
                  >
                    {grade.grade}
                  </div>
                  <p className="text-sm font-medium text-slate-800">{grade.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

interface QualityStatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
}

function QualityStatCard({ title, value, icon: Icon, color }: QualityStatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-2">{title}</p>
          <p className="text-2xl font-display font-bold text-slate-800">{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
