import { useState, useRef } from 'react';
import { Upload, Database, BookOpen, AlertTriangle, CheckCircle, XCircle, FileText, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import ChartCard from '../components/charts/ChartCard';
import { parseCSV } from '../utils/export';
import { dataDictionary } from '../data/mockData';
import { CHART_PALETTE } from '../utils/format';

export default function DataManagerPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'dictionary' | 'quality'>('import');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getDataQualityReport } = useStore();
  const qualityReport = getDataQualityReport();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setImportStatus('uploading');

    try {
      const data = await parseCSV(file);
      setPreviewData(data.slice(0, 5));
      setImportStatus('success');
    } catch (error) {
      setImportStatus('error');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setUploadedFile(file);
    setImportStatus('uploading');

    try {
      const data = await parseCSV(file);
      setPreviewData(data.slice(0, 5));
      setImportStatus('success');
    } catch (error) {
      setImportStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据管理</h1>
          <p className="mt-1 text-sm text-slate-500">数据导入、数据字典和数据质量监控</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'import'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload size={16} />
          数据导入
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'dictionary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={16} />
          数据字典
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'quality'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle size={16} />
          数据质量
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          <ChartCard
            title="批量导入数据"
            subtitle="支持CSV格式数据，拖拽或点击上传"
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload size={48} className="mx-auto text-slate-400" />
              <p className="mt-4 text-lg font-medium text-slate-700">
                {uploadedFile ? uploadedFile.name : '拖拽文件到此处，或点击选择文件'}
              </p>
              <p className="mt-2 text-sm text-slate-500">支持 CSV 格式文件，大小不超过 50MB</p>

              {importStatus === 'success' && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm text-emerald-700">
                  <CheckCircle size={16} />
                  文件上传成功，已解析 {previewData.length} 条数据
                </div>
              )}
              {importStatus === 'error' && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700">
                  <XCircle size={16} />
                  文件解析失败，请检查文件格式
                </div>
              )}
            </div>

            {previewData.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 font-medium text-slate-700">数据预览（前5条）</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        {Object.keys(previewData[0]).map((key, idx) => (
                          <th key={idx} className="px-3 py-2 text-left font-medium text-slate-600">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          {Object.values(row).map((val, vidx) => (
                            <td key={vidx} className="px-3 py-2 text-slate-700">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                    字段映射设置
                  </button>
                  <button className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/30">
                    确认导入
                  </button>
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="导入模板" subtitle="下载标准导入模板">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">候选人数据</p>
                    <p className="text-xs text-slate-500">包含候选人基本信息和流程记录</p>
                  </div>
                </div>
                <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                  下载模板
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Database size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">面试记录</p>
                    <p className="text-xs text-slate-500">面试评价和结果记录</p>
                  </div>
                </div>
                <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                  下载模板
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Settings size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">基础配置</p>
                    <p className="text-xs text-slate-500">部门、职位、渠道配置</p>
                  </div>
                </div>
                <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                  下载模板
                </button>
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'dictionary' && (
        <ChartCard
          title="数据字典"
          subtitle="系统字段定义和说明"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3 font-medium text-slate-600">字段名</th>
                  <th className="pb-3 font-medium text-slate-600">显示名称</th>
                  <th className="pb-3 font-medium text-slate-600">描述</th>
                  <th className="pb-3 font-medium text-slate-600">类型</th>
                  <th className="pb-3 font-medium text-slate-600">单位</th>
                  <th className="pb-3 font-medium text-slate-600">枚举值</th>
                </tr>
              </thead>
              <tbody>
                {dataDictionary.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-mono text-xs text-slate-700 bg-slate-50/50">{item.fieldName}</td>
                    <td className="py-3 font-medium text-slate-800">{item.displayName}</td>
                    <td className="py-3 text-slate-600">{item.description}</td>
                    <td className="py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{item.unit || '-'}</td>
                    <td className="py-3">
                      {item.enumValues ? (
                        <div className="flex flex-wrap gap-1">
                          {item.enumValues.map((ev, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                            >
                              {ev.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">数据总数</p>
                <Database size={18} className="text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{qualityReport.totalRecords}<span className="text-sm font-normal text-slate-500 ml-1">条</span></p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">数据完整度</p>
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{qualityReport.dataCompleteness}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${qualityReport.dataCompleteness}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">异常记录</p>
                <AlertTriangle size={18} className="text-orange-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-orange-600">{qualityReport.anomalyCount}<span className="text-sm font-normal text-slate-500 ml-1">条</span></p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">重复记录</p>
                <XCircle size={18} className="text-red-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-red-600">{qualityReport.duplicateCount}<span className="text-sm font-normal text-slate-500 ml-1">条</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <ChartCard title="缺失值统计" subtitle="各字段缺失情况">
              <div className="space-y-4">
                {qualityReport.missingFields.map((field, idx) => (
                  <div key={idx}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-700">{field.field}</span>
                      <span className="text-slate-500">{field.count}条 ({field.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${field.percentage}%`,
                          backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="数据质量建议" subtitle="系统自动生成的优化建议">
              <div className="space-y-3">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="mt-0.5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">反馈数据缺失较多</p>
                      <p className="mt-1 text-xs text-orange-700">建议优化候选人反馈收集流程，在每个阶段结束后主动邀请评价</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="mt-0.5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">流程数据完整度良好</p>
                      <p className="mt-1 text-xs text-blue-700">阶段记录完整性达到 92%，继续保持</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="mt-0.5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">无重复数据</p>
                      <p className="mt-1 text-xs text-emerald-700">数据去重机制运行正常，未检测到重复记录</p>
                    </div>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
