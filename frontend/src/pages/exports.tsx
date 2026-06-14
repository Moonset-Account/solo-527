import { useState } from 'react';
import { useApiQuery, apiDownload, apiPost } from '@/lib/hooks';
import { useAuthStore, isAdmin, roleLabels, roleColors } from '@/store/auth';
import { formatDate, formatFileSize, classNames } from '@/lib/format';
import { clsx } from 'clsx';
import { Download, FileSpreadsheet, Clock, User, Search, Filter, FileText, Package, Clock3, Users, AlertTriangle, ChevronDown } from 'lucide-react';

const exportTypeLabels: Record<string, string> = {
  work_orders: '工单数据导出',
  materials: '物料数据导出',
  timeline: '时间线导出',
  rework_records: '返工记录导出',
  full_report: '完整综合报告',
};
const exportTypeIcons: Record<string, any> = {
  work_orders: FileText,
  materials: Package,
  timeline: Clock,
  rework_records: AlertTriangle,
  full_report: FileSpreadsheet,
};
const exportTypeColors: Record<string, string> = {
  work_orders: 'bg-blue-100 text-blue-700',
  materials: 'bg-violet-100 text-violet-700',
  timeline: 'bg-sky-100 text-sky-700',
  rework_records: 'bg-amber-100 text-amber-700',
  full_report: 'bg-brand-100 text-brand-700',
};

export default function ExportsPage() {
  const user = useAuthStore((s) => s.user);
  const [exportType, setExportType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [showNewExport, setShowNewExport] = useState(false);
  const [newExportType, setNewExportType] = useState<'work_orders' | 'timeline' | 'rework_records'>('work_orders');
  const [filterStatus, setFilterStatus] = useState('');

  const listQ = useApiQuery<any>(
    ['exports-list', page, exportType, keyword, filterStatus],
    '/exports',
    { page, pageSize: 20, exportType: exportType || undefined, status: filterStatus || undefined }
  );
  const logsQ = useApiQuery<any>(
    ['logs-list-export', page],
    '/logs',
    { page, pageSize: 20, logType: 'data_export' },
    { enabled: isAdmin(user) }
  );

  const items = listQ.data?.data || [];
  const total = listQ.data?.total || 0;
  const logs = logsQ.data?.data || [];

  const handleQuickExport = async (type: 'work_orders' | 'rework_records') => {
    if (type === 'work_orders') {
      await apiDownload('/exports/work-orders', {});
    } else {
      await apiDownload('/exports/reworks', {});
    }
    listQ.refetch();
  };

  const quickExports = [
    { key: 'work_orders', label: '工单数据', desc: '包含工单、物料、工序信息', icon: FileText, color: 'from-blue-500 to-blue-600' },
    { key: 'timeline', label: '时间线', desc: '需在工单详情页或时间线页选择工单导出', icon: Clock, color: 'from-sky-500 to-sky-600' },
    { key: 'rework_records', label: '返工记录', desc: '所有返工记录及超时审批', icon: AlertTriangle, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Download size={26} className="text-brand-600" /> 数据导出中心
        </h1>
        <p className="text-slate-500 text-sm mt-1">数据回看与批量导出 · 所有导出记录均可追踪发起人、筛选条件与完成时间</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickExports.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="card p-5 group hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                if (item.key === 'timeline') {
                  alert('请前往时间线页面，选择具体工单后点击导出按钮');
                  return;
                }
                handleQuickExport(item.key as any);
              }}>
              <div className="flex items-start gap-4">
                <div className={clsx('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm', item.color)}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                </div>
                <ChevronDown size={20} className="text-slate-300 group-hover:text-brand-500 -rotate-90 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Clock3 size={18} /> 导出记录追踪
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9 w-64" placeholder="搜索文件名或发起人..." value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
            <select className="input w-auto" value={exportType} onChange={e => setExportType(e.target.value)}>
              <option value="">全部类型</option>
              {Object.entries(exportTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="completed">成功</option>
              <option value="failed">失败</option>
              <option value="processing">处理中</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr>
              <th>文件名称</th><th>类型</th><th>筛选条件</th>
              <th>记录数</th><th>文件大小</th><th>发起人</th>
              <th>发起时间</th><th>完成时间</th><th>状态</th>
            </tr></thead>
            <tbody>
              {listQ.isLoading && <tr><td colSpan={9} className="py-8 text-center text-slate-400">加载中...</td></tr>}
              {!listQ.isLoading && items.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-slate-400">暂无导出记录</td></tr>}
              {items.map((rec: any) => {
                const Icon = exportTypeIcons[rec.exportType] || FileSpreadsheet;
                return (
                  <tr key={rec.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-xs', exportTypeColors[rec.exportType] || 'bg-slate-100 text-slate-600')}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{rec.fileName}</div>
                          <div className="text-[11px] text-slate-400">ID: #{rec.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={clsx('badge', exportTypeColors[rec.exportType] || 'bg-slate-100')}>
                      {exportTypeLabels[rec.exportType] || rec.exportType}
                    </span></td>
                    <td>
                      {rec.filterConditions && Object.keys(rec.filterConditions).length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Object.entries(rec.filterConditions).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="badge bg-slate-100 text-slate-600">
                              {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          ))}
                          {Object.keys(rec.filterConditions).length > 3 && (
                            <span className="badge bg-slate-100 text-slate-500">+{Object.keys(rec.filterConditions).length - 3}</span>
                          )}
                        </div>
                      ) : <span className="text-slate-400 text-xs">无筛选条件</span>}
                    </td>
                    <td className="font-medium text-slate-700">{rec.recordCount ?? '-'}</td>
                    <td className="text-slate-600">{formatFileSize(rec.fileSize)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white', roleColors[(rec.requestedByUser as any)?.role || 'planner'])}>
                          {(rec.requestedByUser as any)?.realName?.slice(0, 1) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700">{rec.requestedByName || (rec.requestedByUser as any)?.realName}</div>
                          <div className="text-[11px] text-slate-400">
                            {rec.requestedByUser ? roleLabels[(rec.requestedByUser as any).role] : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(rec.requestedAt)}</td>
                    <td>{formatDate(rec.completedAt)}</td>
                    <td>
                      {rec.status === 'completed' ? <span className="badge bg-brand-100 text-brand-700">成功</span>
                        : rec.status === 'failed' ? <span className="badge bg-red-100 text-red-700">失败</span>
                        : <span className="badge bg-amber-100 text-amber-700">处理中</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="card-header flex items-center justify-between border-t border-slate-200">
            <div className="text-xs text-slate-500">共 {total} 条记录 · 第 {page} / {Math.ceil(total / 20)} 页</div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
              <button className="btn-secondary text-xs py-1.5" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>下一页</button>
            </div>
          </div>
        )}
      </div>

      {isAdmin(user) && (
        <div className="card overflow-hidden">
          <div className="card-header"><h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <User size={18} className="text-slate-600" /> 操作日志：数据导出
          </h2></div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr>
                <th>时间</th><th>操作人</th><th>操作</th><th>详情</th>
              </tr></thead>
              <tbody>
                {logsQ.isLoading && <tr><td colSpan={4} className="py-6 text-center text-slate-400">加载中...</td></tr>}
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>{log.operatorName || log.operator?.realName}</td>
                    <td><span className="badge bg-blue-100 text-blue-700">{log.typeLabel}</span></td>
                    <td className="text-sm text-slate-600 max-w-md truncate">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
