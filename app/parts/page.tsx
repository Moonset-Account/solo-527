'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { DataTable, Badge, StatCard } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { formatCurrency, cn } from '@/lib/utils';
import { apiGet, apiPost } from '@/lib/api';
import type { Part, WorkOrder, PartTurnover } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const turnoverSchema = z.object({
  quantity: z.coerce.number().min(1, '数量必须大于 0'),
  workorder_id: z.string().optional(),
  remark: z.string().optional(),
});

type TurnoverFormValues = z.infer<typeof turnoverSchema>;

type TurnoverType = 'in' | 'out';

export default function PartsPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [parts, setParts] = useState<Part[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TurnoverType>('in');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ps, ws] = await Promise.all([
          apiGet<Part[]>('/api/parts', { q: search, category }),
          apiGet<WorkOrder[]>('/api/workorders'),
        ]);
        setParts(ps);
        setWorkOrders(ws);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, category]);

  const categories = useMemo(() => {
    const set = new Set(parts.map((p) => p.category));
    return Array.from(set);
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter((p) => {
      if (category && p.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.part_code.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [parts, search, category]);

  const lowStockCount = parts.filter((p) => p.stock <= p.min_stock).length;
  const totalStockValue = parts.reduce((s, p) => s + p.stock * p.unit_price, 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TurnoverFormValues>({
    resolver: zodResolver(turnoverSchema),
    defaultValues: { quantity: 1, remark: '', workorder_id: '' },
  });

  const openModal = (type: TurnoverType, part: Part) => {
    setModalType(type);
    setSelectedPart(part);
    reset({ quantity: 1, remark: '', workorder_id: '' });
    setModalOpen(true);
  };

  const refreshParts = async () => {
    const ps = await apiGet<Part[]>('/api/parts', { q: search, category });
    setParts(ps);
  };

  const onSubmit = async (values: TurnoverFormValues) => {
    if (!selectedPart) return;
    setSubmitting(true);
    try {
      await apiPost<PartTurnover>('/api/parts/turnovers', {
        part_id: selectedPart.id,
        type: modalType,
        quantity: values.quantity,
        workorder_id: values.workorder_id || undefined,
        remark: values.remark,
        operator_id: currentUser?.id ?? '',
      });
      setModalOpen(false);
      await refreshParts();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="配件管理"
          description="管理库存配件，查看库存预警，登记出入库操作。"
          addHref="/parts/new"
          addLabel="新增配件"
          actions={
            <Link href="/parts/turnover" className="btn-secondary">
              <Package className="w-4 h-4" />
              周转明细
            </Link>
          }
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
        title="配件管理"
        description="管理库存配件，查看库存预警，登记出入库操作。"
        addHref="/parts/new"
        addLabel="新增配件"
        actions={
          <Link href="/parts/turnover" className="btn-secondary">
            <Package className="w-4 h-4" />
            周转明细
          </Link>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="配件种类"
          value={parts.length}
          icon={<Package className="w-5 h-5" />}
          accent="default"
        />
        <StatCard
          label="库存总价值"
          value={formatCurrency(totalStockValue)}
          icon={<Package className="w-5 h-5" />}
          accent="success"
        />
        <StatCard
          label="库存预警"
          value={lowStockCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="danger"
        />
        <StatCard
          label="筛选结果"
          value={filteredParts.length}
          icon={<Package className="w-5 h-5" />}
          accent="warn"
        />
      </section>

      <FilterBar
        searchPlaceholder="搜索配件编号或名称..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-40"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        data={filteredParts}
        rowKey={(r) => r.id}
        columns={[
          { key: 'part_code', header: '配件编号' },
          { key: 'name', header: '名称' },
          { key: 'category', header: '分类' },
          {
            key: 'stock',
            header: '库存',
            render: (r) => {
              const isLow = r.stock <= r.min_stock;
              return (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-semibold',
                      isLow ? 'text-red-600' : 'text-slate-900',
                    )}
                  >
                    {r.stock}
                  </span>
                  <span className="text-xs text-slate-400">{r.unit}</span>
                  {isLow && (
                    <Badge className="bg-red-50 text-red-700">
                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                      预警
                    </Badge>
                  )}
                </div>
              );
            },
            className: cn(
              filteredParts.some((p) => p.stock <= p.min_stock) && '',
            ),
          },
          {
            key: 'unit_price',
            header: '单价',
            render: (r) => formatCurrency(r.unit_price),
          },
          { key: 'unit', header: '单位' },
          {
            key: 'actions',
            header: '操作',
            render: (r) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal('in', r)}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition inline-flex items-center gap-1"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  入库
                </button>
                <button
                  onClick={() => openModal('out', r)}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-brand-50 text-brand-700 hover:bg-brand-100 transition inline-flex items-center gap-1"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  出库
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          selectedPart
            ? `${modalType === 'in' ? '登记入库' : '登记出库'} - ${selectedPart.name}`
            : ''
        }
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
              disabled={isSubmitting || submitting}
            >
              取消
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              className={cn(
                'btn-primary',
                modalType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : '',
              )}
              disabled={isSubmitting || submitting}
            >
              {modalType === 'in' ? '确认入库' : '确认出库'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              数量 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              className="input"
              placeholder="请输入数量"
              {...register('quantity')}
            />
            {errors.quantity && (
              <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>
            )}
          </div>
          {modalType === 'out' && (
            <div>
              <label className="label">关联工单</label>
              <Select {...register('workorder_id')}>
                <option value="">不关联工单</option>
                {workOrders
                  .filter((w) => w.status !== 'completed' && w.status !== 'cancelled')
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title}（{w.vehicle_plate}）
                    </option>
                  ))}
              </Select>
            </div>
          )}
          <div>
            <label className="label">备注</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="可选，填写备注说明"
              {...register('remark')}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
