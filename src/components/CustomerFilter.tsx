'use client';

import { WorkOrder } from '@/lib/types';
import { getCustomers } from '@/lib/mock-data';
import { Filter, Search } from 'lucide-react';
import { useState } from 'react';

interface CustomerFilterProps {
  workOrders: WorkOrder[];
  selectedCustomer: string | null;
  onCustomerChange: (customer: string | null) => void;
  onOrderSelect: (orderId: string) => void;
  selectedOrderId: string | null;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
}

const statusOptions = [
  { value: null, label: '全部' },
  { value: 'delayed', label: '已延期', color: 'bg-red-500' },
  { value: 'in_progress', label: '进行中', color: 'bg-blue-500' },
  { value: 'planned', label: '待排产', color: 'bg-slate-500' },
  { value: 'completed', label: '已完成', color: 'bg-emerald-500' },
];

export default function CustomerFilter({
  workOrders,
  selectedCustomer,
  onCustomerChange,
  onOrderSelect,
  selectedOrderId,
  statusFilter,
  onStatusFilterChange,
}: CustomerFilterProps) {
  const customers = getCustomers();
  const [searchText, setSearchText] = useState('');

  let filtered = workOrders;
  if (selectedCustomer) filtered = filtered.filter((wo) => wo.customer === selectedCustomer);
  if (statusFilter) filtered = filtered.filter((wo) => wo.status === statusFilter);
  if (searchText) {
    const lower = searchText.toLowerCase();
    filtered = filtered.filter(
      (wo) => wo.orderNo.toLowerCase().includes(lower) || wo.customer.toLowerCase().includes(lower) || wo.product.toLowerCase().includes(lower)
    );
  }

  const delayedCount = workOrders.filter((wo) => wo.status === 'delayed').length;
  const inProgressCount = workOrders.filter((wo) => wo.status === 'in_progress').length;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-indigo-400" />
        <h3 className="text-white font-semibold text-base">客户维度筛选</h3>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center">
          <div className="text-red-400 text-xl font-bold">{delayedCount}</div>
          <div className="text-red-400/70 text-[10px]">延期工单</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-center">
          <div className="text-blue-400 text-xl font-bold">{inProgressCount}</div>
          <div className="text-blue-400/70 text-[10px]">进行中</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
          <div className="text-amber-400 text-xl font-bold">{workOrders.reduce((s, wo) => s + wo.totalDelayHours, 0)}</div>
          <div className="text-amber-400/70 text-[10px]">总延期(h)</div>
        </div>
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-2.5 text-center">
          <div className="text-pink-400 text-xl font-bold">{workOrders.filter((wo) => wo.rushOrders.length > 0).length}</div>
          <div className="text-pink-400/70 text-[10px]">插单数</div>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="搜索工单号/客户/产品..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-600/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => onCustomerChange(null)}
          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
            selectedCustomer === null ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          全部客户
        </button>
        {customers.map((c) => (
          <button
            key={c}
            onClick={() => onCustomerChange(selectedCustomer === c ? null : c)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              selectedCustomer === c ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-3">
        {statusOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onStatusFilterChange(opt.value)}
            className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              statusFilter === opt.value ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {opt.color && <span className={`w-1.5 h-1.5 rounded-full ${opt.color}`} />}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
        {filtered.map((wo) => (
          <button
            key={wo.id}
            onClick={() => onOrderSelect(wo.id)}
            className={`w-full text-left bg-slate-800/40 rounded-lg px-3 py-2 border transition-colors ${
              selectedOrderId === wo.id ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-transparent hover:border-slate-600/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-200 text-xs font-mono">{wo.orderNo}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                wo.status === 'delayed' ? 'bg-red-500' : wo.status === 'in_progress' ? 'bg-blue-500' : wo.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-600'
              }`}>
                {wo.status === 'delayed' ? '延期' : wo.status === 'in_progress' ? '进行中' : wo.status === 'completed' ? '完成' : '待排'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-400 text-[10px]">{wo.customer} · {wo.product}</span>
              <span className="text-slate-500 text-[10px]">P{wo.priority}</span>
            </div>
            {wo.totalDelayHours > 0 && (
              <div className="text-red-400 text-[10px] mt-0.5">延期 {wo.totalDelayHours}h · 交期 {wo.deliveryDate}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
