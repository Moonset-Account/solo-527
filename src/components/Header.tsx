import React, { useState } from 'react';
import {
  BarChart3,
  Save,
  FolderOpen,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  BookOpen,
  Settings,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { etlStatus, metricConfigs } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const Header: React.FC = () => {
  const { savedViews, saveView, loadView, deleteView, fetchData, isLoading } = useAnalyticsStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [viewName, setViewName] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [exporting, setExporting] = useState(false);

  const handleSaveView = () => {
    if (viewName.trim()) {
      saveView(viewName.trim());
      setViewName('');
      setShowSaveModal(false);
    }
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setShowExportModal(false);
    }, 2000);
  };

  const statusConfig = {
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: '已更新' },
    running: { icon: Loader2, color: 'text-blue-500 animate-spin', bg: 'bg-blue-50', label: '更新中' },
    failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: '更新失败' },
  };

  const status = statusConfig[etlStatus.status];
  const StatusIcon = status.icon;

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">SaaS 留存分析看板</h1>
                <p className="text-xs text-gray-500">增长运营数据日会专用</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMetricsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              指标口径
            </button>

            <div
              className={`flex items-center gap-2 px-3 py-2 ${status.bg} rounded-lg cursor-pointer hover:opacity-80 transition-opacity`}
              title={`下次更新: ${etlStatus.nextRun}`}
            >
              <StatusIcon className={`w-4 h-4 ${status.color}`} />
              <div className="text-left">
                <div className="text-xs font-medium text-gray-700">{status.label}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(etlStatus.lastUpdated), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchData()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新数据
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={() => setShowViewsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              已保存视图
              {savedViews.length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                  {savedViews.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              保存视图
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
              <ChevronDown className="w-3 h-3" />
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-medium cursor-pointer">
              运
            </div>
          </div>
        </div>
      </header>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">保存当前视图</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="输入视图名称..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
            />
            <p className="text-xs text-gray-500 mb-4">
              将保存当前的筛选条件、日期范围和选中的分析视图
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveView}
                disabled={!viewName.trim()}
                className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">已保存的视图</h3>
              <button
                onClick={() => setShowViewsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {savedViews.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无保存的视图</p>
                <p className="text-sm text-gray-400 mt-1">调整筛选条件后点击"保存视图"创建</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {savedViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => { loadView(view.id); setShowViewsModal(false); }}>
                      <div className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                        {view.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(view.createdAt).toLocaleString('zh-CN')} · {view.filters.channels.length > 0 ? `${view.filters.channels.length} 个渠道` : '全部渠道'}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteView(view.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">导出数据</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">选择导出格式，将导出当前筛选条件下的所有数据</p>
            <div className="space-y-2 mb-6">
              {[
                { id: 'csv', label: 'CSV 表格', desc: '适合 Excel、Numbers 等表格软件' },
                { id: 'xlsx', label: 'Excel (.xlsx)', desc: '包含多个工作表的完整报表' },
                { id: 'pdf', label: 'PDF 文档', desc: '适合打印和分享的报告格式' },
              ].map((format) => (
                <label
                  key={format.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    exportFormat === format.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={exportFormat === format.id}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{format.label}</div>
                    <div className="text-xs text-gray-500">{format.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    开始导出
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMetricsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[600px] shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">指标口径说明</h3>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto flex-1">
              {metricConfigs.map((metric) => (
                <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-800 mb-1">{metric.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{metric.definition}</div>
                  <div className="text-xs text-gray-500 bg-white px-3 py-2 rounded border border-gray-200">
                    <span className="font-medium text-gray-600">计算公式: </span>
                    {metric.calculation}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                * 所有指标均已按照统一口径计算，不同渠道的注册定义已标准化处理
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
