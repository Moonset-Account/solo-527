import { useState, useEffect } from 'react';
import { X, Play, Trash2, Power, Download, Calendar, Clock, BarChart3, ChevronDown, ChevronUp, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { ScheduledReport, ReportHistory, FilterState } from '@/types';
import * as XLSX from 'xlsx';
import { filterRecords } from '@/utils/dataUtils';

const FREQ_LABELS: Record<string, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月'
};

function formatFilterSummary(filterState: FilterState): string {
  const parts: string[] = [];
  if (filterState.months.length > 0) parts.push(`${filterState.months.length}个月`);
  if (filterState.districts.length > 0) parts.push(`${filterState.districts.length}个区域`);
  if (filterState.communities.length > 0) parts.push(`${filterState.communities.length}个小区`);
  if (filterState.layouts.length > 0) parts.push(`${filterState.layouts.length}种户型`);
  if (filterState.excludeAnomaly) parts.push('排除异常');
  return parts.length > 0 ? parts.join(' · ') : '全部数据';
}

export default function ScheduledReportModal() {
  const {
    showScheduledReportModal,
    setShowScheduledReportModal,
    scheduledReports,
    addScheduledReport,
    toggleScheduledReport,
    deleteScheduledReport,
    runReportNow,
    filterState,
    allRecords
  } = useAppStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newReport, setNewReport] = useState({
    name: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    email: ''
  });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCreateReport = () => {
    if (!newReport.name.trim()) return;
    addScheduledReport({
      name: newReport.name,
      frequency: newReport.frequency,
      filterState: { ...filterState },
      email: newReport.email,
      enabled: true
    });
    setNewReport({ name: '', frequency: 'weekly', email: '' });
    setShowCreateForm(false);
  };

  const handleRunNow = async (reportId: string, reportName: string) => {
    setGeneratingReportId(reportId);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = runReportNow(reportId);
    setGeneratingReportId(null);
    if (result) {
      setExpandedReportId(reportId);
      setSuccessMessage(`「${reportName}」报表生成成功！样本量: ${result.sampleCount}，均价: ${result.avgRent}元/月`);
    }
  };

  const handleExportHistory = (report: ScheduledReport, history: ReportHistory) => {
    const filteredRecords = filterRecords(allRecords, report.filterState);

    const exportData = filteredRecords.map(r => ({
      '房源ID': r.id,
      '小区': r.community,
      '区域': r.district,
      '户型': r.layout,
      '面积(㎡)': r.area,
      '租金(元/月)': r.rent,
      '单位租金(元/㎡)': Math.round(r.rent / r.area),
      '楼龄(年)': r.buildingAge,
      '地铁距离(m)': r.subwayDistance,
      '挂牌来源': r.sourcePlatforms.join(', '),
      '挂牌日期': r.listingDate,
      '成交日期': r.dealDate || '',
      '成交周期(天)': r.dealCycle || '',
      '是否异常': r.isAnomaly ? '是' : '否',
      '异常原因': r.anomalyReason || '',
      '人工注释': r.annotation || ''
    }));

    const metadata = [
      ['租赁房源价格定时报表'],
      ['报表名称', report.name],
      ['生成时间', new Date(history.generatedAt).toLocaleString('zh-CN')],
      ['数据更新时间', new Date(history.dataUpdateTime).toLocaleString('zh-CN')],
      ['报表频率', FREQ_LABELS[report.frequency]],
      [],
      ['筛选条件:'],
      ['  月份', report.filterState.months.length > 0 ? report.filterState.months.join(', ') : '全部'],
      ['  区域', report.filterState.districts.length > 0 ? report.filterState.districts.join(', ') : '全部'],
      ['  小区', report.filterState.communities.length > 0 ? report.filterState.communities.join(', ') : '全部'],
      ['  户型', report.filterState.layouts.length > 0 ? report.filterState.layouts.join(', ') : '全部'],
      ['  来源', report.filterState.sources.length > 0 ? report.filterState.sources.join(', ') : '全部'],
      ['  租金范围', `${report.filterState.rentRange[0]} - ${report.filterState.rentRange[1]} 元/月`],
      ['  面积范围', `${report.filterState.areaRange[0]} - ${report.filterState.areaRange[1]} ㎡`],
      ['  楼龄范围', `${report.filterState.buildingAgeRange[0]} - ${report.filterState.buildingAgeRange[1]} 年`],
      ['  地铁距离', `${report.filterState.subwayDistanceRange[0]} - ${report.filterState.subwayDistanceRange[1]} m`],
      ['  成交周期', `${report.filterState.dealCycleRange[0]} - ${report.filterState.dealCycleRange[1]} 天`],
      ['  排除异常样本', report.filterState.excludeAnomaly ? '是' : '否'],
      ['  IQR阈值', report.filterState.iqrThreshold + '×'],
      [],
      ['数据统计:'],
      ['  样本量', history.sampleCount],
      ['  异常样本数', history.anomalyCount],
      ['  租金均价', history.avgRent + ' 元/月'],
      ['  租金中位数', history.medianRent + ' 元/月'],
      [],
      ['指标口径说明:'],
      ['  租金均价 = 有效样本租金之和 / 样本量'],
      ['  租金中位数 = 样本租金排序后第50百分位数'],
      ['  单位面积租金 = 租金 / 房屋面积'],
      ['  成交周期 = 成交日期 - 挂牌日期'],
      ['  样本不足 = 样本量 < 30'],
      [],
      ['数据明细']
    ];

    const ws = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.sheet_add_json(ws, exportData, { origin: metadata.length + 1 });
    ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 30 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '报表数据');
    XLSX.writeFile(wb, `${report.name}_${history.generatedAt.split('T')[0]}.xlsx`);
  };

  if (!showScheduledReportModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-workbench-surface border border-workbench-border rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-workbench-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-workbench-text">定时报表管理</h2>
              <p className="text-xs text-workbench-text-muted mt-0.5">创建和管理定时数据报表订阅</p>
            </div>
          </div>
          <button
            onClick={() => setShowScheduledReportModal(false)}
            className="p-2 rounded-lg hover:bg-workbench-bg text-workbench-text-muted hover:text-workbench-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-workbench-text">我的报表订阅</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              新建报表
            </button>
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {showCreateForm && (
            <div className="bg-workbench-bg rounded-lg p-4 space-y-3 border border-workbench-border">
              <div className="text-xs font-medium text-workbench-text">创建定时报表</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-workbench-text-muted mb-1">报表名称</label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={e => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="例如：朝阳区每周租金报告"
                    className="w-full px-3 py-2 bg-workbench-surface border border-workbench-border rounded-lg text-xs text-workbench-text placeholder-workbench-text-muted focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-workbench-text-muted mb-1">报表频率</label>
                  <select
                    value={newReport.frequency}
                    onChange={e => setNewReport({ ...newReport, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-workbench-surface border border-workbench-border rounded-lg text-xs text-workbench-text focus:outline-none focus:border-cyan-500"
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-workbench-text-muted mb-1">接收邮箱（可选）</label>
                <input
                  type="email"
                  value={newReport.email}
                  onChange={e => setNewReport({ ...newReport, email: e.target.value })}
                  placeholder="report@example.com"
                  className="w-full px-3 py-2 bg-workbench-surface border border-workbench-border rounded-lg text-xs text-workbench-text placeholder-workbench-text-muted focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="text-xs text-workbench-text-muted bg-workbench-surface/50 px-3 py-2 rounded-lg">
                <span className="text-cyan-400">💡</span> 将自动保存当前筛选条件作为报表数据范围
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 text-xs text-workbench-text-muted hover:text-workbench-text transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateReport}
                  disabled={!newReport.name.trim()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
                >
                  创建报表
                </button>
              </div>
            </div>
          )}

          {scheduledReports.length === 0 ? (
            <div className="text-center py-12 text-workbench-text-muted">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无定时报表</p>
              <p className="text-xs mt-1">点击「新建报表」开始创建</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledReports.map(report => (
                <div
                  key={report.id}
                  className="bg-workbench-bg rounded-lg border border-workbench-border overflow-hidden"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${report.enabled ? 'bg-cyan-600/20' : 'bg-workbench-border/50'}`}>
                        <BarChart3 className={`w-4 h-4 ${report.enabled ? 'text-cyan-400' : 'text-workbench-text-muted'}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-workbench-text">{report.name}</div>
                        <div className="text-xs text-workbench-text-muted mt-0.5 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {FREQ_LABELS[report.frequency]}
                          </span>
                          <span>{formatFilterSummary(report.filterState)}</span>
                        </div>
                        {report.lastRunAt && (
                          <div className="text-xs text-workbench-text-muted mt-1">
                            上次运行: {new Date(report.lastRunAt).toLocaleString('zh-CN')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRunNow(report.id, report.name)}
                        disabled={generatingReportId === report.id}
                        className="p-2 rounded-lg hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="立即生成"
                      >
                        {generatingReportId === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleScheduledReport(report.id)}
                        className={`p-2 rounded-lg transition-colors ${report.enabled ? 'text-green-400 hover:bg-green-500/20' : 'text-workbench-text-muted hover:bg-workbench-border/50'}`}
                        title={report.enabled ? '暂停' : '启用'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                        className="p-2 rounded-lg hover:bg-workbench-border/50 text-workbench-text-muted hover:text-workbench-text transition-colors"
                        title={expandedReportId === report.id ? '收起历史' : '查看历史'}
                      >
                        {expandedReportId === report.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteScheduledReport(report.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-workbench-text-muted hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedReportId === report.id && (
                    <div className="border-t border-workbench-border bg-workbench-surface/50">
                      <div className="p-3 border-b border-workbench-border/50">
                        <div className="text-xs font-medium text-workbench-text">生成历史</div>
                      </div>
                      {report.history.length === 0 ? (
                        <div className="p-6 text-center text-xs text-workbench-text-muted">
                          暂无生成记录，点击「立即生成」按钮生成报表
                        </div>
                      ) : (
                        <div className="divide-y divide-workbench-border/50">
                          {report.history.map((item, idx) => (
                            <div key={item.id} className={`px-4 py-3 flex items-center justify-between transition-colors ${idx === 0 ? 'bg-cyan-500/5' : 'hover:bg-workbench-surface/50'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${idx === 0 ? 'bg-cyan-500 text-white' : 'bg-cyan-600/20 text-cyan-400'}`}>
                                  #{report.history.length - idx}
                                </div>
                                <div>
                                  <div className="text-xs text-workbench-text font-medium flex items-center gap-2">
                                    {new Date(item.generatedAt).toLocaleString('zh-CN')}
                                    {idx === 0 && (
                                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded">最新</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-workbench-text-muted mt-0.5 flex items-center gap-3">
                                    <span>样本: <span className="text-cyan-400 font-medium">{item.sampleCount}</span></span>
                                    <span>异常: <span className="text-orange-400 font-medium">{item.anomalyCount}</span></span>
                                    <span>均价: <span className="text-green-400 font-medium">{item.avgRent}</span>元/月</span>
                                    <span>中位数: <span className="text-blue-400 font-medium">{item.medianRent}</span>元/月</span>
                                    <span className="text-workbench-text-muted">
                                      数据更新: {new Date(item.dataUpdateTime).toLocaleDateString('zh-CN')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleExportHistory(report, item)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                导出Excel
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
