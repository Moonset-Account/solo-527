import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Download, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { downloadExport } from '../lib/api';
import type { ExportStatus } from '../../shared/types';

const statusConfig: Record<ExportStatus, { icon: React.ElementType; color: string; label: string }> = {
  queued: { icon: Clock, color: 'text-amber', label: '排队中' },
  processing: { icon: Loader2, color: 'text-blue-400', label: '生成中' },
  completed: { icon: CheckCircle, color: 'text-emerald-400', label: '已完成' },
  failed: { icon: XCircle, color: 'text-coral', label: '失败' },
};

const viewTypeLabels: Record<string, string> = {
  funnel: '转化漏斗',
  channel: '渠道质量',
  consultant: '顾问负载',
  'follow-up': '复诊趋势',
  anomalies: '异常摘要',
};

export default function Exports() {
  const { exportTasks, fetchExportTasksData, submitExport, loading, filterParams } = useDashboardStore();

  useEffect(() => {
    fetchExportTasksData();
    const interval = setInterval(fetchExportTasksData, 5000);
    return () => clearInterval(interval);
  }, [fetchExportTasksData]);

  const handleSubmit = (viewType: string, format: 'csv' | 'xlsx') => {
    submitExport(viewType, format);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">导出中心</h1>
          <p className="text-sm text-slate-400 mt-1">异步导出报表数据，支持 CSV 和 Excel 格式</p>
        </div>
      </div>

      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">新建导出</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['funnel', 'channel', 'consultant', 'follow-up', 'anomalies'] as const).map((viewType) => (
            <div key={viewType} className="bg-slate-900/50 rounded-lg border border-slate-700/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">{viewTypeLabels[viewType]}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit(viewType, 'csv')}
                  disabled={loading.exportSubmit}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleSubmit(viewType, 'xlsx')}
                  disabled={loading.exportSubmit}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-600/20 text-slate-300 border border-slate-600/30 hover:bg-slate-600/30 transition-colors disabled:opacity-50"
                >
                  XLSX
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-200">导出记录</h2>
        </div>
        {exportTasks.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">暂无导出记录</p>
            <p className="text-sm text-slate-500 mt-1">选择上方视图和格式开始导出</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">视图类型</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">格式</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">创建时间</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">完成时间</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {exportTasks.map((task) => {
                  const config = statusConfig[task.status];
                  const Icon = config.icon;
                  return (
                    <tr key={task.id} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-200 font-mono">
                        {viewTypeLabels[task.viewType] ?? task.viewType}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-300 uppercase font-mono">
                        {task.format}
                      </td>
                      <td className="px-6 py-3">
                        <span className={cn('flex items-center gap-1.5 text-sm', config.color)}>
                          <Icon className={cn('w-3.5 h-3.5', task.status === 'processing' && 'animate-spin')} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-400 font-mono">
                        {new Date(task.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-400 font-mono">
                        {task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td className="px-6 py-3">
                        {task.status === 'completed' && task.downloadUrl && (
                          <a
                            href={downloadExport(task.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            下载
                          </a>
                        )}
                        {task.status === 'processing' && (
                          <span className="text-xs text-slate-500">生成中...</span>
                        )}
                        {task.status === 'queued' && (
                          <span className="text-xs text-slate-500">等待中...</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
