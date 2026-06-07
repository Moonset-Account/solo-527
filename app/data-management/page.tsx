'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';
import Papa from 'papaparse';
import { apiClient } from '@/lib/utils/apiClient';
import { useAuthStore } from '@/lib/store/useAuthStore';
import type { QualityCheckResult } from '@/types';
import { INDICATORS } from '@/lib/utils/constants';

export default function DataManagementPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'import' | 'quality'>('import');
  const [qualityData, setQualityData] = useState<QualityCheckResult | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message?: string;
    imported?: number;
  } | null>(null);

  const fetchQualityData = async () => {
    setQualityLoading(true);
    try {
      const org = user?.role === 'admin' ? undefined : user?.organization;
      const data = await apiClient.getQualityCheck(org) as QualityCheckResult;
      setQualityData(data);
    } catch (error) {
      console.error('获取质量检查数据失败:', error);
    } finally {
      setQualityLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchQualityData();
    }
  }, [user]);

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
      parseCSVFile(file);
    }
  };

  const parseCSVFile = (file: File) => {
    setImporting(true);
    setImportResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const data = results.data as any[];
        if (data.length > 0) {
          setImportPreview(data.slice(0, 10));
        } else {
          setImportPreview([]);
        }
        setImporting(false);
      },
      error: (error) => {
        console.error('CSV 解析失败:', error);
        setImportResult({
          success: false,
          message: 'CSV 文件解析失败，请检查文件格式',
        });
        setImporting(false);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      parseCSVFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const result: any = await apiClient.importMeasurements(importFile);
      setImportResult({
        success: result.success,
        message: result.message,
        imported: result.imported,
      });

      if (result.success) {
        setImportPreview([]);
        setImportFile(null);
        fetchQualityData();
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || '导入失败，请重试',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      ['站点编码', '站点名称', '采样时间', '水温', 'pH', '溶解氧', '氨氮', '降雨量', '数据来源', '备注', '采样人员'],
      ['RIV-001', '上游监测站1', '2024-01-15 10:00:00', '15.2', '7.5', '8.2', '0.3', '0', '人工采样', '常规采样', '张三'],
      ['RIV-002', '中游监测站1', '2024-01-15 10:30:00', '16.8', '7.8', '7.5', '0.5', '5.2', '自动站', '', ''],
    ];
    const csv = Papa.unparse(template);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '水质监测数据导入模板.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据管理</h1>
          <p className="text-slate-500 mt-1">批量导入数据、质量检查</p>
        </div>
        <button
          onClick={fetchQualityData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'import'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              批量导入
            </div>
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'quality'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              质量检查
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  支持 CSV 格式文件，将数据导入到 PostgreSQL 数据库持久化存储
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700"
                >
                  <Download className="w-4 h-4" />
                  下载导入模板
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  拖拽 CSV 文件到此处
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  或点击下方按钮选择文件
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  选择文件
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {importFile && (
                <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-cyan-500" />
                    <div>
                      <p className="font-medium text-slate-700">{importFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setImportFile(null);
                      setImportPreview([]);
                    }}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              )}

              {importPreview.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">数据预览（前 10 条）</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {Object.keys(importPreview[0]).slice(0, 8).map((key) => (
                            <th key={key} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).slice(0, 8).map((value: any, i) => (
                              <td key={i} className="px-3 py-2 text-slate-600 truncate max-w-[150px]">
                                {String(value || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  importResult.success
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-rose-50 border border-rose-200'
                }`}>
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-medium ${importResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {importResult.success ? '导入成功' : '导入失败'}
                    </p>
                    <p className={`text-sm ${importResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {importResult.message}
                      {importResult.imported !== undefined && ` (${importResult.imported} 条记录已写入 PostgreSQL)`}
                    </p>
                  </div>
                </div>
              )}

              {importFile && importPreview.length > 0 && (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setImportFile(null);
                      setImportPreview([]);
                      setImportResult(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      '确认导入'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-6">
              {qualityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : qualityData ? (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1">总记录数</p>
                      <p className="text-2xl font-bold text-slate-800">{qualityData.totalRecords}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1">异常记录</p>
                      <p className="text-2xl font-bold text-amber-600">{qualityData.anomalyCount}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1">缺失值总数</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {Object.values(qualityData.missingValues).reduce((a, b) => a + b, 0)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1">数据完整率</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {qualityData.totalRecords > 0
                          ? (100 - Object.values(qualityData.missingValues).reduce((a, b) => a + b, 0) / (qualityData.totalRecords * 4) * 100).toFixed(1)
                          : 100}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">各指标缺失值统计</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {INDICATORS.map((indicator) => {
                        const missingCount = (qualityData.missingValues as any)[indicator.code] || 0;
                        const missingRate = qualityData.totalRecords > 0
                          ? (missingCount / qualityData.totalRecords * 100).toFixed(1)
                          : 0;
                        return (
                          <div key={indicator.code} className="bg-white border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: indicator.color }} />
                              <span className="text-sm font-medium text-slate-700">{indicator.name}</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">{missingCount} 条</p>
                            <p className="text-xs text-slate-500">缺失率 {missingRate}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">各站点样本量统计</h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">站点名称</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">样本量</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">缺失率</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {qualityData.siteMissingRates.slice(0, 10).map((site, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-slate-700">{site.siteName}</td>
                              <td className="px-4 py-2 text-slate-600">{site.total} 条</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  site.missingRate > 10 ? 'bg-rose-100 text-rose-700' :
                                  site.missingRate > 5 ? 'bg-amber-100 text-amber-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {site.missingRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-slate-500">暂无质量检查数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
