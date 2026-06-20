'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Package } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { DataTable, Badge, StatCard } from '@/components/DataTable';
import {
  turnoverTypeLabel,
  turnoverTypeColor,
  formatDate,
} from '@/lib/utils';
import { apiGet } from '@/lib/api';
import type { TurnoverType, PartTurnover, Part } from '@/lib/types';

export default function PartTurnoverPage() {
  const [turnovers, setTurnovers] = useState<PartTurnover[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<string>('');
  const [partId, setPartId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ts, ps] = await Promise.all([
          apiGet<PartTurnover[]>('/api/parts/turnovers', {
            type,
            part_id: partId,
            from: startDate,
            to: endDate,
          }),
          apiGet<Part[]>('/api/parts'),
        ]);
        setTurnovers(ts);
        setParts(ps);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, partId, startDate, endDate]);

  const filteredTurnovers = useMemo(() => {
    return turnovers.filter((t) => {
      if (type && t.type !== type) return false;
      if (partId && t.part_id !== partId) return false;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(t.created_at) < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(t.created_at) > end) return false;
      }
      return true;
    });
  }, [turnovers, type, partId, startDate, endDate]);

  const totalIn = useMemo(
    () =>
      filteredTurnovers
        .filter((t) => t.type === 'in')
        .reduce((s, t) => s + t.quantity, 0),
    [filteredTurnovers],
  );

  const totalOut = useMemo(
    () =>
      filteredTurnovers
        .filter((t) => t.type === 'out')
        .reduce((s, t) => s + t.quantity, 0),
    [filteredTurnovers],
  );

  const netChange = totalIn - totalOut;

  if (loading) {
    return (
      <div>
        <PageHeader
          title="配件周转明细"
          description="查询配件出入库及调拨记录，掌握库存变动情况。"
          backHref="/parts"
        />
        <div className="card p-8 flex items-center justify-center text-slate-500">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="配件周转明细"
        description="查询配件出入库及调拨记录，掌握库存变动情况。"
        backHref="/parts"
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="总入库"
          value={totalIn}
          icon={<ArrowDownToLine className="w-5 h-5" />}
          accent="success"
        />
        <StatCard
          label="总出库"
          value={totalOut}
          icon={<ArrowUpFromLine className="w-5 h-5" />}
          accent="default"
        />
        <StatCard
          label="净变动"
          value={netChange >= 0 ? `+${netChange}` : netChange}
          trend={netChange >= 0 ? '库存增加' : '库存减少'}
          trendUp={netChange >= 0}
          icon={<ArrowLeftRight className="w-5 h-5" />}
          accent={netChange >= 0 ? 'success' : 'warn'}
        />
      </section>

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-32"
          >
            <option value="">全部类型</option>
            <option value="in">入库</option>
            <option value="out">出库</option>
            <option value="transfer">调拨</option>
          </Select>

          <Select
            value={partId}
            onChange={(e) => setPartId(e.target.value)}
            className="w-56"
          >
            <option value="">全部配件</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.part_code} - {p.name}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-auto"
            />
          </div>

          {(type || partId || startDate || endDate) && (
            <button
              onClick={() => {
                setType('');
                setPartId('');
                setStartDate('');
                setEndDate('');
              }}
              className="btn-secondary text-xs"
            >
              重置筛选
            </button>
          )}
        </div>
      </FilterBar>

      <DataTable
        data={filteredTurnovers}
        rowKey={(r) => r.id}
        columns={[
          {
            key: 'created_at',
            header: '日期',
            render: (r) => formatDate(r.created_at),
          },
          {
            key: 'part_name',
            header: '配件',
            render: (r) => (
              <div>
                <div className="font-medium">{r.part_name ?? '—'}</div>
                <div className="text-xs text-slate-400">
                  {parts.find((p) => p.id === r.part_id)?.part_code ?? ''}
                </div>
              </div>
            ),
          },
          {
            key: 'type',
            header: '类型',
            render: (r) => (
              <Badge className={turnoverTypeColor[r.type as TurnoverType]}>
                {turnoverTypeLabel[r.type as TurnoverType]}
              </Badge>
            ),
          },
          {
            key: 'quantity',
            header: '数量',
            render: (r) => {
              const sign = r.type === 'in' ? '+' : r.type === 'out' ? '-' : '±';
              return (
                <span
                  className={
                    r.type === 'in'
                      ? 'text-emerald-600 font-semibold'
                      : r.type === 'out'
                        ? 'text-brand-600 font-semibold'
                        : 'text-purple-600 font-semibold'
                  }
                >
                  {sign}
                  {r.quantity}
                </span>
              );
            },
          },
          {
            key: 'workorder_title',
            header: '关联工单',
            render: (r) => r.workorder_title ?? '—',
          },
          {
            key: 'operator_name',
            header: '操作人',
            render: (r) => r.operator_name ?? '—',
          },
          {
            key: 'remark',
            header: '备注',
            render: (r) => r.remark ?? '—',
          },
        ]}
      />
    </div>
  );
}
