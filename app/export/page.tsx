'use client';

import { useState, useEffect } from 'react';
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiClient } from '@/lib/utils/apiClient';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useFilterStore } from '@/lib/store/useFilterStore';
import type { Measurement, MonitoringSite } from '@/types';
import { INDICATORS } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/dataUtils';

export default function ExportCenterPage() {
  const { user } = useAuthStore();
  const { selectedIndicator, startDate, endDate, setFilters } = useFilterStore();
  const [sites, setSites] = useState<MonitoringSite[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'all'>('week');

  const fetchData = async () => {
    setLoading(true);
    try {
      const org = user?.role === 'admin' ? undefined : user?.organization;
      const [sitesData, measurementsData] = await Promise.all([
        apiClient.getSites(org) as Promise<MonitoringSite[]>,
        apiClient.getMeasurements({
          organizations: org ? [org] : undefined,
          limit: 10000,
        }) as Promise<{ data: Measurement[]; total: number }>,
      ]);
      setSites(sitesData);
      setMeasurements(measurementsData.data);
      if (sitesData.length > 0) {
        setSelectedSiteIds(sitesData.map(s => s.id));
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const getFilteredMeasurements = () => {
    let filtered = [...measurements];

    if (selectedSiteIds.length > 0) {
      filtered = filtered.filter(m => selectedSiteIds.includes(m.siteId));
    }

    const now = new Date();
    let start: Date | null = null;

    switch (dateRange) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = null;
    }

    if (start) {
      filtered = filtered.filter(m => new Date(m.sampleTime) >= start!);
    }

    return filtered.sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime());
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const org = user?.role === 'admin' ? undefined : user?.organization;
      const csvData = await apiClient.getMeasurements({
        organizations: org ? [org] : undefined,
        siteIds: selectedSiteIds.length > 0 ? selectedSiteIds : undefined,
        format: 'csv',
      }) as unknown as string;

      const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `水质监测数据_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } catch (error) {
      console.error('导出 CSV 失败:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const filtered = getFilteredMeasurements();
      const siteMap = new Map(sites.map(s => [s.id, s]));

      const reportContent = document.createElement('div');
      reportContent.style.padding = '40px';
      reportContent.style.fontFamily = 'Arial, sans-serif';
      reportContent.style.background = 'white';
      reportContent.style.width = '800px';

      const dateStr = new Date().toLocaleDateString('zh-CN');
      const rangeText = {
        week: '近一周',
        month: '近一月',
        quarter: '近三月',
        all: '全部',
      }[dateRange];

      reportContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; color: #1e293b; margin: 0;">河流水质监测周报</h1>
          <p style="color: #64748b; margin-top: 8px;">${dateStr} | ${rangeText}数据</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; color: #334155; margin: 0 0 12px 0;">数据概览</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #0ea5e9;">${sites.length}</div>
              <div style="font-size: 12px; color: #64748b;">监测站点</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #10b981;">${filtered.length}</div>
              <div style="font-size: 12px; color: #64748b;">监测记录</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${filtered.filter(m => m.isAnomaly).length}</div>
              <div style="font-size: 12px; color: #64748b;">异常记录</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #8b5cf6;">
                ${filtered.length > 0 ? (((filtered.length - filtered.filter(m => m.isAnomaly).length) / filtered.length * 100).toFixed(1)) : 100}%
              </div>
              <div style="font-size: 12px; color: #64748b;">达标率</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; color: #334155; margin: 0 0 12px 0;">指标平均值</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            ${INDICATORS.map(ind => {
              const values = filtered.map(m => (m as any)[ind.code]).filter((v: any) => v !== null);
              const avg = values.length > 0 ? (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2) : '-';
              return `
                <div style="background: ${ind.color}15; padding: 16px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 14px; color: ${ind.color}; font-weight: 500;">${ind.name}</div>
                  <div style="font-size: 24px; font-weight: bold; color: #1e293b; margin-top: 4px;">${avg} ${ind.unit}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div>
          <h2 style="font-size: 16px; color: #334155; margin: 0 0 12px 0;">最近异常记录</h2>
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead style="background: #f8fafc;">
                <tr>
                  <th style="padding: 10px; text-align: left; color: #64748b;">站点</th>
                  <th style="padding: 10px; text-align: left; color: #64748b;">采样时间</th>
                  <th style="padding: 10px; text-align: left; color: #64748b;">水温</th>
                  <th style="padding: 10px; text-align: left; color: #64748b;">pH</th>
                  <th style="padding: 10px; text-align: left; color: #64748b;">溶解氧</th>
                  <th style="padding: 10px; text-align: left; color: #64748b;">氨氮</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.filter(m => m.isAnomaly).slice(0, 10).map(m => {
                  const site = siteMap.get(m.siteId);
                  return `
                    <tr style="border-top: 1px solid #e2e8f0; background: #fef2f2;">
                      <td style="padding: 8px 10px;">${site?.name || '-'}</td>
                      <td style="padding: 8px 10px;">${formatDate(m.sampleTime)}</td>
                      <td style="padding: 8px 10px;">${m.temperature?.toFixed(1) || '-'}</td>
                      <td style="padding: 8px 10px;">${m.ph?.toFixed(2) || '-'}</td>
                      <td style="padding: 8px 10px;">${m.dissolvedOxygen?.toFixed(2) || '-'}</td>
                      <td style="padding: 8px 10px;">${m.ammoniaNitrogen?.toFixed(3) || '-'}</td>
                    </tr>
                  `;
                }).join('')}
                ${filtered.filter(m => m.isAnomaly).length === 0 ? `
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td colspan="6" style="padding: 20px; text-align: center; color: #64748b;">
                      暂无异常记录
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
          生成时间: ${new Date().toLocaleString('zh-CN')} | 数据来源: PostgreSQL 数据库
        </div>
      `;

      document.body.appendChild(reportContent);

      const canvas = await html2canvas(reportContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(reportContent);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`水质监测报告_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('导出 PDF 失败:', error);
    } finally {
      setExporting(false);
    }
  };

  const filtered = getFilteredMeasurements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">报告导出</h1>
          <p className="text-slate-500 mt-1">
            周会数据导出，所有数据来自 PostgreSQL 持久化存储
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总记录数</p>
              <p className="text-xl font-bold text-slate-800">{measurements.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">当前数据库中的所有记录</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">筛选后</p>
              <p className="text-xl font-bold text-slate-800">{filtered.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">按条件筛选后的记录数</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">异常记录</p>
              <p className="text-xl font-bold text-slate-800">{filtered.filter(m => m.isAnomaly).length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">筛选后的异常记录数</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">数据来源</p>
              <p className="text-sm font-bold text-slate-800">PostgreSQL</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">持久化数据库存储</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-600" />
            导出筛选条件
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                时间范围
              </label>
              <div className="flex gap-2">
                {(['week', 'month', 'quarter', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === range
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {{
                      week: '近一周',
                      month: '近一月',
                      quarter: '近三月',
                      all: '全部',
                    }[range]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                监测站点 ({selectedSiteIds.length}/{sites.length} 已选)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                {sites.map((site) => (
                  <label
                    key={site.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${
                      selectedSiteIds.includes(site.id)
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.includes(site.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSiteIds([...selectedSiteIds, site.id]);
                        } else {
                          setSelectedSiteIds(selectedSiteIds.filter(id => id !== site.id));
                        }
                      }}
                      className="hidden"
                    />
                    {site.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSelectedSiteIds(sites.map(s => s.id))}
                  className="text-xs text-cyan-600 hover:text-cyan-700"
                >
                  全选
                </button>
                <span className="text-xs text-slate-300">|</span>
                <button
                  onClick={() => setSelectedSiteIds([])}
                  className="text-xs text-slate-500 hover:text-slate-600"
                >
                  清空
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-cyan-600" />
            导出选项
          </h3>

          <div className="space-y-3">
            <button
              onClick={handleExportCSV}
              disabled={exporting || loading}
              className="w-full p-4 border border-slate-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-all flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700">导出 CSV</p>
                <p className="text-xs text-slate-500">适用于 Excel 分析，周会数据汇总</p>
              </div>
              {exporting ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-slate-400" />
              )}
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exporting || loading}
              className="w-full p-4 border border-slate-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-all flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <FileText className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700">导出 PDF 报告</p>
                <p className="text-xs text-slate-500">格式化周报，包含图表和统计</p>
              </div>
              {exporting ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
            <p className="text-xs text-cyan-700">
              <strong>说明：</strong>所有导出数据均来自 PostgreSQL 数据库。
              批量导入的数据会立即反映在导出文件中，确保端到端数据一致性。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">数据预览（前 20 条）</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">站点</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">采样时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">水温</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">pH</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">溶解氧</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">氨氮</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">来源</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : filtered.slice(0, 20).map((m) => {
                const site = sites.find(s => s.id === m.siteId);
                return (
                  <tr key={m.id} className={m.isAnomaly ? 'bg-rose-50' : ''}>
                    <td className="px-4 py-3 text-slate-700">{site?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(m.sampleTime)}</td>
                    <td className="px-4 py-3 text-slate-600">{m.temperature?.toFixed(1) || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{m.ph?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{m.dissolvedOxygen?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{m.ammoniaNitrogen?.toFixed(3) || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        m.dataSource === 'automatic'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {m.dataSource === 'automatic' ? '自动站' : '人工'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.isAnomaly ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                          异常
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          正常
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
  );
}
