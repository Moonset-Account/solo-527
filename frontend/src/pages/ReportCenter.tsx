import { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import dayjs from 'dayjs';
import { useFilterStore } from '../stores/filterStore';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
}

const reportTemplates: ReportTemplate[] = [
  { id: '1', name: '日报表', description: '每日能耗与故障汇总', type: 'daily' },
  { id: '2', name: '周报表', description: '周度能耗分析与对比', type: 'weekly' },
  { id: '3', name: '月报表', description: '月度运行分析报告', type: 'monthly' },
  { id: '4', name: '自定义报表', description: '自定义时间范围导出', type: 'custom' },
];

export default function ReportCenter() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('2');
  const [customStart, setCustomStart] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'));
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { roomIds, includeMaintenance, weekType } = useFilterStore();

  const handleExport = async () => {
    setExporting(true);
    setExportSuccess(false);
    
    try {
      let startTime, endTime;
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      
      switch (template?.type) {
        case 'daily':
          startTime = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
          endTime = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
          break;
        case 'weekly':
          startTime = dayjs().startOf('week').format('YYYY-MM-DD HH:mm:ss');
          endTime = dayjs().endOf('week').format('YYYY-MM-DD HH:mm:ss');
          break;
        case 'monthly':
          startTime = dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss');
          endTime = dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss');
          break;
        default:
          startTime = dayjs(customStart).startOf('day').format('YYYY-MM-DD HH:mm:ss');
          endTime = dayjs(customEnd).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      }

      const blob = await apiService.exportPDF({
        startTime,
        endTime,
        roomIds: roomIds.length > 0 ? roomIds : undefined,
        includeMaintenance,
        weekType: weekType !== 'all' ? weekType : undefined,
        includeCharts: true,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `能耗报表_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const recentExports = [
    { id: '1', name: '2024年第25周能耗分析报告.pdf', date: '2024-06-23 15:30', size: '2.3 MB' },
    { id: '2', name: '2024年6月机房运行月报.pdf', date: '2024-06-30 10:00', size: '3.1 MB' },
    { id: '3', name: '考试周能耗专项分析.pdf', date: '2024-06-21 16:45', size: '1.8 MB' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="chart-card">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">选择报表模板</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center mb-3">
                      <BarChart3 className={`w-5 h-5 ${
                        selectedTemplate === template.id ? 'text-blue-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <h4 className="font-medium text-white text-sm">{template.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                  </div>
                ))}
              </div>

              {selectedTemplate === '4' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">开始日期</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">结束日期</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    正在生成报表...
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    导出成功！
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    导出PDF报表
                  </>
                )}
              </button>
            </div>

            <div className="chart-card">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">导出说明</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>报表包含核心指标统计、能耗分类分析、告警记录汇总</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>支持按机房筛选，可选择特定机房进行专项分析</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>考试周数据会自动标记，便于对比分析</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>设备离线时段的数据已做特殊处理，不会误判为能耗下降</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>异常能耗点会自动标注，可点击查看详细关联信息</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="chart-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-semibold text-white">历史报表</h3>
            </div>
            
            <div className="space-y-3">
              {recentExports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                        {report.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{report.date}</span>
                        <span>{report.size}</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              查看更多历史报表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
