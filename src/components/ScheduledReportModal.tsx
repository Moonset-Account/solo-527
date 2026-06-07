import { useState } from 'react';
import { X, Calendar, Clock, Mail, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { ScheduledReport } from '@/types';

export default function ScheduledReportModal() {
  const {
    showScheduledReportModal,
    setShowScheduledReportModal,
    scheduledReports,
    addScheduledReport,
    toggleScheduledReport,
    deleteScheduledReport,
    filterState
  } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    frequency: 'weekly' as ScheduledReport['frequency'],
    email: ''
  });

  if (!showScheduledReportModal) return null;

  const handleCreateReport = () => {
    if (!newReport.name || !newReport.email) return;
    addScheduledReport({
      name: newReport.name,
      frequency: newReport.frequency,
      filterState: { ...filterState },
      email: newReport.email,
      enabled: true
    });
    setNewReport({ name: '', frequency: 'weekly', email: '' });
    setShowAddForm(false);
  };

  const frequencyLabel: Record<ScheduledReport['frequency'], string> = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 drawer-overlay"
        onClick={() => setShowScheduledReportModal(false)}
      />

      <div className="relative w-[500px] max-h-[80vh] bg-workbench-surface border border-workbench-border rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-workbench-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-workbench-text">定时报表订阅</h2>
          </div>
          <button
            onClick={() => setShowScheduledReportModal(false)}
            className="p-1.5 hover:bg-workbench-border rounded transition-colors"
          >
            <X className="w-5 h-5 text-workbench-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-workbench-border rounded-lg text-workbench-text-muted hover:text-cyan-400 hover:border-cyan-500 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              创建新的定时报表
            </button>
          )}

          {showAddForm && (
            <div className="mb-4 p-4 bg-workbench-bg rounded-lg border border-workbench-border">
              <h3 className="text-sm font-medium text-workbench-text mb-3">新建定时报表</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-workbench-text-muted block mb-1">报表名称</label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={e => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="例如：朝阳区每周租金报告"
                    className="w-full px-3 py-2 text-sm bg-workbench-surface border border-workbench-border rounded text-workbench-text placeholder-workbench-text-muted focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-workbench-text-muted block mb-1">推送频率</label>
                  <div className="flex gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setNewReport({ ...newReport, frequency: f })}
                        className={`flex-1 py-2 text-xs rounded transition-colors ${
                          newReport.frequency === f
                            ? 'bg-cyan-600 text-white'
                            : 'bg-workbench-surface text-workbench-text-muted hover:bg-workbench-border'
                        }`}
                      >
                        {frequencyLabel[f]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-workbench-text-muted block mb-1">接收邮箱</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-workbench-text-muted" />
                    <input
                      type="email"
                      value={newReport.email}
                      onChange={e => setNewReport({ ...newReport, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-workbench-surface border border-workbench-border rounded text-workbench-text placeholder-workbench-text-muted focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-workbench-text-muted">
                  将使用当前筛选条件生成报表
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 text-sm text-workbench-text-muted hover:text-workbench-text transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateReport}
                    disabled={!newReport.name || !newReport.email}
                    className="flex-1 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 disabled:bg-workbench-border disabled:text-workbench-text-muted text-white rounded transition-colors"
                  >
                    创建
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {scheduledReports.length === 0 ? (
              <div className="text-center py-8 text-workbench-text-muted text-sm">
                暂无定时报表
              </div>
            ) : (
              scheduledReports.map(report => (
                <div
                  key={report.id}
                  className="p-3 bg-workbench-bg rounded-lg border border-workbench-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-workbench-text">{report.name}</h4>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                          report.enabled ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {report.enabled ? '运行中' : '已暂停'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[10px] text-workbench-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          频率: {frequencyLabel[report.frequency]}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          邮箱: {report.email}
                        </div>
                        {report.lastRunAt && (
                          <div>
                            上次运行: {new Date(report.lastRunAt).toLocaleString('zh-CN')}
                          </div>
                        )}
                        <div>
                          筛选条件: {report.filterState.districts.length > 0
                            ? report.filterState.districts.join(', ')
                            : '全部区域'}
                          {report.filterState.months.length > 0 && ` · ${report.filterState.months.length}个月`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => toggleScheduledReport(report.id)}
                        className="p-1.5 hover:bg-workbench-border rounded transition-colors"
                        title={report.enabled ? '暂停' : '启用'}
                      >
                        {report.enabled ? (
                          <ToggleRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-workbench-text-muted" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteScheduledReport(report.id)}
                        className="p-1.5 hover:bg-red-900/30 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-3 border-t border-workbench-border text-[10px] text-workbench-text-muted">
          报表将自动按设定频率发送，包含数据更新时间、筛选条件和样本量信息
        </div>
      </div>
    </div>
  );
}
