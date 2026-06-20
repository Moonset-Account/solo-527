'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CarFront,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { DataTable, Badge, EmptyState } from '@/components/DataTable';
import { formatDate, cn } from '@/lib/utils';
import { apiGet } from '@/lib/api';
import type { Vehicle, WorkOrder } from '@/lib/types';

const PAGE_SIZE = 5;

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [vs, ws] = await Promise.all([
          apiGet<Vehicle[]>('/api/vehicles', { q: search, brand }),
          apiGet<WorkOrder[]>('/api/workorders'),
        ]);
        setVehicles(vs);
        setWorkOrders(ws);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, brand]);

  const brandOptions = useMemo(() => {
    const set = new Set(vehicles.map((v) => v.brand));
    return Array.from(set);
  }, [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        !search ||
        v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
        v.brand.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.owner_name.includes(search) ||
        v.owner_phone.includes(search) ||
        v.vin.toLowerCase().includes(search.toLowerCase());
      const matchBrand = !brand || v.brand === brand;
      return matchSearch && matchBrand;
    });
  }, [vehicles, search, brand]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const getWorkOrderCount = (vehicleId: string) =>
    workOrders.filter((w) => w.vehicle_id === vehicleId).length;

  if (loading) {
    return (
      <div>
        <PageHeader
          title="车辆管理"
          description="管理门店登记的所有车辆信息，快速查询车辆档案。"
          addHref="/vehicles/new"
          addLabel="登记车辆"
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
        title="车辆管理"
        description="管理门店登记的所有车辆信息，快速查询车辆档案。"
        addHref="/vehicles/new"
        addLabel="登记车辆"
      />

      <FilterBar
        searchPlaceholder="搜索车牌号、品牌、车型、车主、VIN..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
      >
        <Select
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setPage(1);
          }}
          className="w-40"
        >
          <option value="">全部品牌</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CarFront className="w-8 h-8" />}
          title="暂无车辆数据"
          description={
            search || brand
              ? '没有找到匹配的车辆，请调整搜索条件。'
              : '点击右上角「登记车辆」添加第一辆车。'
          }
        />
      ) : (
        <>
          <DataTable
            data={paged}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/vehicles/${r.id}`)}
            columns={[
              {
                key: 'plate_number',
                header: '车牌号',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-50 to-accent-100 flex items-center justify-center text-brand-600">
                      <CarFront className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {r.plate_number}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.brand} {r.model}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'vin',
                header: 'VIN码',
                render: (r) => (
                  <span className="font-mono text-xs text-slate-500">
                    {r.vin}
                  </span>
                ),
              },
              {
                key: 'brand',
                header: '品牌',
                render: (r) => (
                  <Badge className="bg-brand-50 text-brand-700">{r.brand}</Badge>
                ),
              },
              {
                key: 'owner',
                header: '车主信息',
                render: (r) => (
                  <div>
                    <div className="flex items-center gap-1 text-sm text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {r.owner_name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {r.owner_phone}
                    </div>
                  </div>
                ),
              },
              {
                key: 'workOrders',
                header: '工单数',
                render: (r) => {
                  const count = getWorkOrderCount(r.id);
                  return (
                    <Badge
                      className={cn(
                        count > 0
                          ? 'bg-accent-50 text-accent-700'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {count} 单
                    </Badge>
                  );
                },
              },
              {
                key: 'created_at',
                header: '登记时间',
                render: (r) => (
                  <span className="text-sm text-slate-500">
                    {formatDate(r.created_at)}
                  </span>
                ),
              },
            ]}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                共 {filtered.length} 条 · 第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost !px-2 !py-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'btn !px-3 !py-1.5',
                      p === currentPage
                        ? 'btn-primary'
                        : 'btn-ghost',
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-ghost !px-2 !py-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
