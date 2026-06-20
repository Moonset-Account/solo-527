'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { WorkOrder, WorkOrderStatus, Vehicle } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { DataTable, Badge, StatCard } from '@/components/DataTable';
import {
  workOrderStatusLabel,
  workOrderStatusColor,
  formatDate,
} from '@/lib/utils';

const STATUS_OPTIONS: { value: WorkOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待派工' },
  { value: 'assigned', label: '已派工' },
  { value: 'in_progress', label: '维修中' },
  { value: 'quality_check', label: '待质检' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function WorkOrdersPage() {
  const router = useRouter();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    apiGet<WorkOrder[]>('/api/workorders', {
      q: searchValue,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      vehicle_id: vehicleFilter !== 'all' ? vehicleFilter : undefined,
    }).then(setWorkOrders);
  }, [searchValue, statusFilter, vehicleFilter]);

  useEffect(() => {
    apiGet<Vehicle[]>('/api/vehicles').then(setVehicles);
  }, []);

  const stats = useMemo(() => {
    return {
      pending: workOrders.filter((w) => w.status === 'pending').length,
      assigned: workOrders.filter((w) => w.status === 'assigned').length,
      inProgress: workOrders.filter((w) => w.status === 'in_progress').length,
      qualityCheck: workOrders.filter((w) => w.status === 'quality_check').length,
      completed: workOrders.filter((w) => w.status === 'completed').length,
      cancelled: workOrders.filter((w) => w.status === 'cancelled').length,
    };
  }, [workOrders]);

  const columns = [
    {
      key: 'title',
      header: '工单名称',
      render: (r: any) => (
        <div className="font-medium text-slate-900">{r.title}</div>
      ),
    },
    {
      key: 'vehicle',
      header: '车辆信息',
      render: (r: any) => (
        <div>
          <div className="font-medium text-slate-800">{r.vehicle_plate}</div>
          <div className="text-xs text-slate-500">
            {r.vehicle_brand} {r.vehicle_model}
          </div>
        </div>
      ),
    },
    {
      key: 'assignee_name',
      header: '负责人',
      render: (r: any) => r.assignee_name ?? <span className="text-slate-400">未指派</span>,
    },
    {
      key: 'status',
      header: '状态',
      render: (r: any) => (
        <Badge className={workOrderStatusColor[r.status as WorkOrderStatus]}>
          {workOrderStatusLabel[r.status as WorkOrderStatus]}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: '创建时间',
      render: (r: any) => formatDate(r.created_at),
      className: 'text-slate-500',
    },
  ];

  return (
    <div>
      <PageHeader
        title="维修工单"
        description="管理门店的所有维修工单，跟踪工单状态与进度。"
        addHref="/workorders/new"
        addLabel="新增工单"
      />

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="待派工"
          value={stats.pending}
          icon={<Clock className="w-4 h-4" />}
          accent="default"
          onClick={() => setStatusFilter('pending')}
        />
        <StatCard
          label="已派工"
          value={stats.assigned}
          icon={<Wrench className="w-4 h-4" />}
          accent="default"
          onClick={() => setStatusFilter('assigned')}
        />
        <StatCard
          label="维修中"
          value={stats.inProgress}
          icon={<Wrench className="w-4 h-4" />}
          accent="warn"
          onClick={() => setStatusFilter('in_progress')}
        />
        <StatCard
          label="待质检"
          value={stats.qualityCheck}
          icon={<AlertCircle className="w-4 h-4" />}
          accent="warn"
          onClick={() => setStatusFilter('quality_check')}
        />
        <StatCard
          label="已完成"
          value={stats.completed}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="success"
          onClick={() => setStatusFilter('completed')}
        />
        <StatCard
          label="已取消"
          value={stats.cancelled}
          icon={<XCircle className="w-4 h-4" />}
          accent="danger"
          onClick={() => setStatusFilter('cancelled')}
        />
      </section>

      <FilterBar
        searchPlaceholder="搜索工单名称、车牌、品牌、负责人..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      >
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | 'all')}
          className="w-40"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="w-48"
        >
          <option value="all">全部车辆</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate_number} - {v.brand} {v.model}
            </option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        data={workOrders}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/workorders/${r.id}`)}
        columns={columns}
        emptyText="暂无符合条件的工单"
      />
    </div>
  );
}
