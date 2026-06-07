import { useState } from 'react';
import { Search, Eye, Download, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import ChartCard from '../components/charts/ChartCard';
import { exportToCSV } from '../utils/export';
import { formatDate } from '../utils/format';

const statusLabels: Record<string, { label: string; className: string }> = {
  in_progress: { label: '进行中', className: 'bg-blue-100 text-blue-700' },
  hired: { label: '已入职', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
  offer_declined: { label: 'Offer拒绝', className: 'bg-orange-100 text-orange-700' },
};

export default function RecordsPage() {
  const { filteredCandidates, selectedCandidate, setSelectedCandidate } = useStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = filteredCandidates.filter(c =>
    c.name.includes(search) ||
    c.positionName.includes(search) ||
    c.departmentName.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pagedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCSV = () => {
    exportToCSV(filtered, '候选人原始记录');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">原始记录</h1>
          <p className="mt-1 text-sm text-slate-500">候选人全流程记录明细，共 {filtered.length} 条记录</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          <Download size={16} />
          导出CSV
        </button>
      </div>

      <ChartCard
        title="候选人列表"
        subtitle="点击查看候选人详细信息"
      >
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索候选人姓名、职位、部门..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-3 font-medium text-slate-600">候选人</th>
                <th className="pb-3 font-medium text-slate-600">职位</th>
                <th className="pb-3 font-medium text-slate-600">部门</th>
                <th className="pb-3 font-medium text-slate-600">渠道</th>
                <th className="pb-3 font-medium text-slate-600">招聘官</th>
                <th className="pb-3 font-medium text-slate-600">当前阶段</th>
                <th className="pb-3 font-medium text-slate-600">状态</th>
                <th className="pb-3 font-medium text-slate-600">申请日期</th>
                <th className="pb-3 font-medium text-slate-600">异常</th>
                <th className="pb-3 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.map(c => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-700">{c.positionName}</td>
                  <td className="py-3 text-slate-700">{c.departmentName}</td>
                  <td className="py-3 text-slate-700">{c.channelName}</td>
                  <td className="py-3 text-slate-700">{c.recruiterName}</td>
                  <td className="py-3 text-slate-700">{c.currentStageName}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusLabels[c.status].className}`}>
                      {statusLabels[c.status].label}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{formatDate(c.applyDate)}</td>
                  <td className="py-3">
                    {c.stages.some(s => s.isAnomaly) ? (
                      <span className="inline-flex items-center gap-1 text-orange-600">
                        <AlertTriangle size={14} />
                        <span className="text-xs">有异常</span>
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-xs">正常</span>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setSelectedCandidate(c)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} 条，共 {filtered.length} 条
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-sm transition-colors ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </ChartCard>

    </div>
  );
}
