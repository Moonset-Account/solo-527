import { useEffect, useState } from 'react';
import { RefreshCw, Download, Save, Settings, Database, FileSpreadsheet, Clock, CheckCircle, AlertCircle, Loader2, Trash2, Play } from 'lucide-react';
import type { EtlStatus, MetricConfig, FilterCondition, ExportTask } from '@shared/types';
import { useDashboardStore } from '../store/useDashboardStore';

export default function DataManagement() {
  const [etlStatuses, setEtlStatuses] = useState<EtlStatus[]>([]);
  const [metricConfig, setMetricConfig] = useState<MetricConfig | null>(null);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [isRunningEtl, setIsRunningEtl] = useState(false);
  const [activeTab, setActiveTab] = useState<'etl' | 'metrics' | 'filters' | 'export'>('etl');
  
  const { savedFilters, fetchSavedFilters, applyFilter, deleteFilter } = useDashboardStore();

  useEffect(() => {
    fetchData();
    fetchSavedFilters();
  }, [fetchSavedFilters]);

  const fetchData = async () => {
    try {
      const [etlRes, metricsRes, exportRes] = await Promise.all([
        fetch('/api/etl/status'),
        fetch('/api/etl/metrics'),
        fetch('/api/etl/export/tasks'),
      ]);
      const etlData = await etlRes.json();
      const metricsData = await metricsRes.json();
      const exportData = await exportRes.json();
      if (etlData.code === 0) setEtlStatuses(etlData.data);
      if (metricsData.code === 0) setMetricConfig(metricsData.data);
      if (exportData.code === 0) setExportTasks(exportData.data);
    } catch (e) {
      console.error(e);
    }
  };

  const runEtl = async () => {
    setIsRunningEtl(true);
    try {
      const res = await fetch('/api/etl/run', { method: 'POST' });
      const result = await res.json();
      if (result.code === 0) {
        setEtlStatuses(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningEtl(false);
    }
  };

  const createExport = async (type: string) => {
    try {
      await fetch('/api/etl/export/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: `${type}_数据导出` }),
      });
      setTimeout(fetchData, 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyFilter = (filter: FilterCondition) => {
    applyFilter(filter);
    alert(`已应用筛选组合: ${filter.name || '未命名筛选'}`);
  };

  const handleDeleteFilter = async (filterId: string) => {
    if (confirm('确定要删除此筛选组合吗？')) {
      const success = await deleteFilter(filterId);
      if (success) {
        alert('删除成功');
      }
    }
  };

  const handleDownload = (downloadUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sourceLabels: Record<string, string> = {
    stations: '站点数据',
    trips: '行程记录',
    dispatches: '调度记录',
    alerts: '告警数据',
  };

  const statusConfig = {
    success: { icon: CheckCircle, class: 'text-emerald-400', label: '成功' },
    failed: { icon: AlertCircle, class: 'text-red-400', label: '失败' },
    running: { icon: Loader2, class: 'text-accent-cyan animate-spin', label: '运行中' },
  };

  const exportStatusConfig = {
    pending: { label: '等待中', class: 'badge-warning' },
    processing: { label: '处理中', class: 'badge-info' },
    completed: { label: '已完成', class: 'badge-success' },
    failed: { label: '失败', class: 'badge-danger' },
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN');
  };

  const tabs = [
    { key: 'etl', label: 'ETL状态', icon: Database },
    { key: 'metrics', label: '口径配置', icon: Settings },
    { key: 'filters', label: '筛选组合', icon: Save },
    { key: 'export', label: '导出任务', icon: Download },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">数据管理</h2>
          <p className="text-sm text-gray-400 mt-1">ETL监控、口径配置与数据导出</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-dark-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'etl' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="section-title">数据源更新状态</h3>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={runEtl}
              disabled={isRunningEtl}
            >
              <RefreshCw size={16} className={isRunningEtl ? 'animate-spin' : ''} />
              {isRunningEtl ? '执行中...' : '手动执行ETL'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {etlStatuses.map((status) => {
              const StatusIcon = statusConfig[status.status].icon;
              return (
                <div key={status.source} className="glass-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-200">{sourceLabels[status.source] || status.source}</h4>
                      <p className="text-xs text-gray-500 mt-1">记录数: {status.recordCount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon size={18} className={statusConfig[status.status].class} />
                      <span className={`text-sm ${statusConfig[status.status].class}`}>
                        {statusConfig[status.status].label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-dark-border/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      最后更新: {formatTime(status.lastUpdate)}
                    </div>
                    {status.missingFields.length > 0 && (
                      <div className="mt-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <p className="text-xs text-amber-400">
                          缺失字段: {status.missingFields.join(', ')}
                        </p>
                      </div>
                    )}
                    {status.errorMessage && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-xs text-red-400">
                          错误: {status.errorMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && metricConfig && (
        <div className="space-y-6">
          <h3 className="section-title">指标口径配置</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(metricConfig).map(([key, config]) => (
              <div key={key} className="glass-card p-5">
                <h4 className="font-medium text-gray-200 mb-2">{key}</h4>
                {(config as any).description && (
                  <p className="text-sm text-gray-400 mb-3">{(config as any).description}</p>
                )}
                {(config as any).formula && (
                  <div className="p-3 bg-gray-800/50 rounded-lg font-mono text-sm text-accent-cyan">
                    {(config as any).formula}
                  </div>
                )}
                {(config as any).morning && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">早高峰</span>
                      <span className="font-mono text-sm text-accent-orange">
                        {(config as any).morning[0]}:00 - {(config as any).morning[1]}:00
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">晚高峰</span>
                      <span className="font-mono text-sm text-accent-orange">
                        {(config as any).evening[0]}:00 - {(config as any).evening[1]}:00
                      </span>
                    </div>
                  </div>
                )}
                {(config as any).shortage !== undefined && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">短缺阈值</span>
                      <span className="font-mono text-sm text-red-400">{((config as any).shortage * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">堆积阈值</span>
                      <span className="font-mono text-sm text-blue-400">{((config as any).overflow * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                {(config as any).thresholds && (
                  <div className="space-y-2 mt-3">
                    {Object.entries((config as any).thresholds).map(([tkey, tval]) => (
                      <div key={tkey} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{tkey}</span>
                        <span className="font-mono text-sm text-emerald-400">{((tval as number) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'filters' && (
        <div className="space-y-4">
          <h3 className="section-title">已保存的筛选组合</h3>
          {savedFilters.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-500">暂无保存的筛选组合，可在站点分析页保存常用筛选条件</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {savedFilters.map((filter) => (
                <div key={filter.id} className="glass-card-hover p-5">
                  <h4 className="font-medium text-gray-200">{filter.name || '未命名筛选'}</h4>
                  <div className="mt-3 space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>区域</span>
                      <span className="text-gray-400">{filter.areas?.length > 0 ? filter.areas.join(', ') : '全部'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>车辆状态</span>
                      <span className="text-gray-400">{filter.bikeStatus?.join(', ') || '全部'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>天气</span>
                      <span className="text-gray-400">{filter.weatherTypes?.length > 0 ? filter.weatherTypes.join(', ') : '全部'}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button 
                      className="btn-primary flex-1 !py-1.5 text-xs flex items-center justify-center gap-1"
                      onClick={() => handleApplyFilter(filter)}
                    >
                      <Play size={12} />
                      应用
                    </button>
                    <button 
                      className="btn-secondary !py-1.5 text-xs flex items-center justify-center gap-1 text-red-400 hover:text-red-300"
                      onClick={() => handleDeleteFilter(filter.id!)}
                    >
                      <Trash2 size={12} />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="section-title">数据导出</h3>
            <div className="flex gap-2">
              <button className="btn-primary flex items-center gap-2" onClick={() => createExport('trips')}>
                <FileSpreadsheet size={16} />
                导出行程数据
              </button>
              <button className="btn-secondary flex items-center gap-2" onClick={() => createExport('stations')}>
                <FileSpreadsheet size={16} />
                导出站点数据
              </button>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-gray-800/30">
                  <th className="text-left py-3 px-4 data-table-header">任务名称</th>
                  <th className="text-left py-3 px-4 data-table-header">状态</th>
                  <th className="text-left py-3 px-4 data-table-header">进度</th>
                  <th className="text-left py-3 px-4 data-table-header">创建时间</th>
                  <th className="text-right py-3 px-4 data-table-header">操作</th>
                </tr>
              </thead>
              <tbody>
                {exportTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      暂无导出任务
                    </td>
                  </tr>
                ) : (
                  exportTasks.map((task) => (
                    <tr key={task.id} className="border-b border-dark-border/50">
                      <td className="py-3 px-4 text-sm text-gray-200">{task.name}</td>
                      <td className="py-3 px-4">
                        <span className={exportStatusConfig[task.status].class}>
                          {exportStatusConfig[task.status].label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-700/50 rounded-full h-1.5">
                            <div
                              className="bg-accent-cyan h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{formatTime(task.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        {task.status === 'completed' && task.downloadUrl ? (
                          <button 
                            className="text-accent-cyan text-sm hover:underline flex items-center gap-1 ml-auto"
                            onClick={() => handleDownload(task.downloadUrl!, `${task.name}.xlsx`)}
                          >
                            <Download size={14} />
                            下载
                          </button>
                        ) : (
                          <span className="text-gray-600 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
