import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import {
  formatDate,
  getRepairTypeLabel,
  getStatusLabel,
  getUrgencyLabel,
} from '@/utils/format';
import type { RequestStatus, RepairType, Urgency } from '@/types';

const buildings = Array.from({ length: 10 }, (_, i) => `${i + 1}号楼`);
const repairTypes: RepairType[] = [
  'plumbing',
  'electrical',
  'furniture',
  'door_window',
  'network',
  'other',
];
const urgencyLevels: Urgency[] = ['low', 'medium', 'high', 'critical'];
const statusList: RequestStatus[] = [
  'pending',
  'identity_verifying',
  'quota_checking',
  'assigned',
  'processing',
  'completed',
  'rejected',
  'waitlisted',
];

export default function ReviewList() {
  const navigate = useNavigate();
  const { repairs, repairsLoading, fetchRepairs } = useAppStore();
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [building, setBuilding] = useState('');
  const [repairType, setRepairType] = useState<RepairType | ''>('');
  const [urgency, setUrgency] = useState<Urgency | ''>('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadRepairs = useCallback(() => {
    fetchRepairs({
      status: status || undefined,
      building: building || undefined,
      repairType: repairType || undefined,
      page,
      pageSize,
    });
  }, [status, building, repairType, page, pageSize, fetchRepairs]);

  useEffect(() => {
    loadRepairs();
  }, [loadRepairs]);

  const filteredRepairs = repairs.filter((r) => {
    if (urgency && r.urgency !== urgency) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      if (
        !r.studentName.toLowerCase().includes(kw) &&
        !r.description.toLowerCase().includes(kw)
      )
        return false;
    }
    return true;
  });

  const pagedRepairs = filteredRepairs.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const totalPages = Math.max(1, Math.ceil(filteredRepairs.length / pageSize));

  const resetFilters = () => {
    setStatus('');
    setBuilding('');
    setRepairType('');
    setUrgency('');
    setKeyword('');
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    const pageIds = pagedRepairs.map((r) => r.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleBatch = (operation: string) => {
    navigate('/batch', { state: { selectedIds, operation } });
  };

  const pageIds = pagedRepairs.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">审核管理</h1>

      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="mb-1 block text-xs text-slate-500">状态筛选</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as RequestStatus | '');
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">全部状态</option>
              {statusList.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs text-slate-500">楼栋筛选</label>
            <select
              value={building}
              onChange={(e) => {
                setBuilding(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">全部楼栋</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs text-slate-500">报修类型</label>
            <select
              value={repairType}
              onChange={(e) => {
                setRepairType(e.target.value as RepairType | '');
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">全部类型</option>
              {repairTypes.map((t) => (
                <option key={t} value={t}>
                  {getRepairTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs text-slate-500">紧急度</label>
            <select
              value={urgency}
              onChange={(e) => {
                setUrgency(e.target.value as Urgency | '');
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">全部</option>
              {urgencyLevels.map((u) => (
                <option key={u} value={u}>
                  {getUrgencyLabel(u)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="mb-1 block text-xs text-slate-500">关键词搜索</label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="姓名/描述"
                className="w-full rounded-md border border-slate-300 py-1.5 pl-7 pr-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} />
            重置
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {repairsLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3">申请单号</th>
                <th className="px-4 py-3">申请人</th>
                <th className="px-4 py-3">楼栋+房间</th>
                <th className="px-4 py-3">报修类型</th>
                <th className="px-4 py-3">紧急度</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">提交时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRepairs.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {r.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.studentName}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.building} {r.roomNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {getRepairTypeLabel(r.repairType)}
                  </td>
                  <td className="px-4 py-3">
                    <UrgencyBadge urgency={r.urgency} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/review/${r.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      审核详情
                    </button>
                  </td>
                </tr>
              ))}
              {pagedRepairs.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-slate-400"
                  >
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          每页
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          条
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (n) => Math.abs(n - page) <= 2 || n === 1 || n === totalPages,
            )
            .map((n, i, arr) => (
              <span key={n}>
                {i > 0 && arr[i - 1] !== n - 1 && (
                  <span className="px-1 text-slate-400">...</span>
                )}
                <button
                  onClick={() => setPage(n)}
                  className={`min-w-[32px] rounded-md border px-2 py-1 text-sm ${
                    n === page
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {n}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-xl bg-slate-800 px-6 py-3 text-white shadow-xl">
          <span className="text-sm">已选择 {selectedIds.length} 项</span>
          <button
            onClick={() => handleBatch('approve')}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium hover:bg-green-700"
          >
            批量通过
          </button>
          <button
            onClick={() => handleBatch('reject')}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium hover:bg-red-700"
          >
            批量驳回
          </button>
        </div>
      )}
    </div>
  );
}
