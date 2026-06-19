'use client';

import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { StatCard, Badge } from '@/components/DataTable';
import type { OverallResult, QualityInspection } from '@/lib/types';
import {
  overallResultLabel,
  overallResultColor,
  formatDate,
  cn,
} from '@/lib/utils';

const RESULT_OPTIONS: { value: OverallResult | 'all'; label: string }[] = [
  { value: 'all', label: '全部结果' },
  { value: 'pass', label: '通过' },
  { value: 'fail', label: '不通过' },
  { value: 'rework', label: '需返工' },
];

export default function QualityPage() {
  const inspections = useAppStore((s) => s.qualityInspections);
  const workOrders = useAppStore((s) => s.workOrders);
  const users = useAppStore((s) => s.users);

  const inspectors = users.filter((u) => u.role === 'inspector');

  const [resultFilter, setResultFilter] = useState<OverallResult | 'all'>('all');
  const [workorderFilter, setWorkorderFilter] = useState<string>('all');
  const [inspectorFilter, setInspectorFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredInspections = useMemo(() => {
    return inspections.filter((qi) => {
      if (resultFilter !== 'all' && qi.overall_result !== resultFilter) return false;
      if (workorderFilter !== 'all' && qi.workorder_id !== workorderFilter) return false;
      if (inspectorFilter !== 'all' && qi.inspector_id !== inspectorFilter) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (new Date(qi.created_at) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(qi.created_at) > to) return false;
      }
      return true;
    });
  }, [inspections, resultFilter, workorderFilter, inspectorFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = inspections.length;
    const pass = inspections.filter((i) => i.overall_result === 'pass').length;
    const rework = inspections.filter((i) => i.overall_result === 'rework').length;
    const fail = inspections.filter((i) => i.overall_result === 'fail').length;
    const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
    return { total, pass, rework, fail, passRate };
  }, [inspections]);

  return (
    <div>
      <PageHeader
        title="质检中心"
        description="管理所有质检记录，追溯质检明细与整改情况。"
        addHref="/quality/new"
        addLabel="新增质检"
      />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="总质检次数"
          value={stats.total}
          icon={<ClipboardCheck className="w-5 h-5" />}
          accent="default"
        />
        <StatCard
          label="通过率"
          value={`${stats.passRate}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="success"
        />
        <StatCard
          label="需返工"
          value={stats.rework}
          icon={<AlertCircle className="w-5 h-5" />}
          accent="warn"
        />
        <StatCard
          label="不通过"
          value={stats.fail}
          icon={<XCircle className="w-5 h-5" />}
          accent="danger"
        />
      </section>

      <FilterBar>
        <Select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value as OverallResult | 'all')}
          className="w-36"
        >
          {RESULT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={workorderFilter}
          onChange={(e) => setWorkorderFilter(e.target.value)}
          className="w-56"
        >
          <option value="all">全部工单</option>
          {workOrders.map((wo) => (
            <option key={wo.id} value={wo.id}>
              {wo.vehicle_plate} - {wo.title}
            </option>
          ))}
        </Select>
        <Select
          value={inspectorFilter}
          onChange={(e) => setInspectorFilter(e.target.value)}
          className="w-40"
        >
          <option value="all">全部质检员</option>
          {inspectors.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input w-36 text-sm"
          />
          <span className="text-slate-400 text-sm">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input w-36 text-sm"
          />
        </div>
      </FilterBar>

      <div className="card overflow-hidden">
        {filteredInspections.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-slate-400">
            <ClipboardCheck className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无符合条件的质检记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="th w-10"></th>
                  <th className="th">工单信息</th>
                  <th className="th">质检员</th>
                  <th className="th">质检项数</th>
                  <th className="th">总体结果</th>
                  <th className="th">备注</th>
                  <th className="th">质检时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredInspections.map((row, idx) => {
                  const expanded = expandedId === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => setExpandedId(expanded ? null : row.id)}
                        className={cn(
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                          'cursor-pointer hover:bg-brand-50/40 transition-colors',
                        )}
                      >
                        <td className="td w-10">
                          {expanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                        <td className="td">
                          <div className="font-medium text-slate-900">{row.workorder_title}</div>
                          <div className="text-xs text-slate-500">{row.workorder_id}</div>
                        </td>
                        <td className="td">{row.inspector_name}</td>
                        <td className="td">{row.items.length} 项</td>
                        <td className="td">
                          <Badge className={overallResultColor[row.overall_result]}>
                            {overallResultLabel[row.overall_result]}
                          </Badge>
                        </td>
                        <td className="td text-slate-600 max-w-xs truncate">
                          {row.remark || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="td text-slate-500">{formatDate(row.created_at)}</td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                                <div className="text-sm font-medium text-slate-700">质检项明细</div>
                              </div>
                              <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[40%]">
                                      质检项名称
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                                      结果
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      问题描述
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      整改建议
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {row.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 text-sm text-slate-800">
                                        {item.name}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge
                                          className={
                                            item.result === 'pass'
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-red-50 text-red-700'
                                          }
                                        >
                                          {item.result === 'pass' ? '通过' : '不通过'}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {item.issue || <span className="text-slate-400">—</span>}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {item.rectification || (
                                          <span className="text-slate-400">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
