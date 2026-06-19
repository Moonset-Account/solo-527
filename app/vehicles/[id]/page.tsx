'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CarFront,
  User,
  Phone,
  CreditCard,
  FileText,
  Package,
  ArrowRight,
  Calendar,
  Clock,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { Badge, DataTable, EmptyState } from '@/components/DataTable';
import {
  formatDate,
  cn,
  workOrderStatusLabel,
  workOrderStatusColor,
  turnoverTypeLabel,
  turnoverTypeColor,
} from '@/lib/utils';
import type { WorkOrder } from '@/lib/types';

function WorkOrderTimeline({ orders }: { orders: WorkOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-slate-400">
        <Inbox className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">暂无工单记录</p>
      </div>
    );
  }

  const sorted = [...orders].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );

  return (
    <div className="relative">
      <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-brand-200 via-slate-200 to-slate-100" />
      <ul className="space-y-4">
        {sorted.map((wo) => {
          const Icon =
            wo.status === 'completed'
              ? CheckCircle2
              : wo.status === 'cancelled'
                ? AlertCircle
                : wo.status === 'in_progress'
                  ? Wrench
                  : Circle;
          const iconColor =
            wo.status === 'completed'
              ? 'text-emerald-500'
              : wo.status === 'cancelled'
                ? 'text-red-500'
                : wo.status === 'in_progress'
                  ? 'text-accent-500'
                  : wo.status === 'quality_check'
                    ? 'text-purple-500'
                    : 'text-slate-400';
          return (
            <li key={wo.id} className="relative pl-12">
              <div
                className={cn(
                  'absolute left-0 top-1 w-9 h-9 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center',
                )}
              >
                <Icon className={cn('w-4 h-4', iconColor)} />
              </div>
              <Link
                href={`/workorders/${wo.id}`}
                className="block card p-4 hover:shadow-card-hover transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800 group-hover:text-brand-700 transition">
                        {wo.title}
                      </span>
                      <Badge className={workOrderStatusColor[wo.status]}>
                        {workOrderStatusLabel[wo.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                      {wo.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        创建：{formatDate(wo.created_at)}
                      </span>
                      {wo.completed_at && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          完成：{formatDate(wo.completed_at)}
                        </span>
                      )}
                      {wo.assignee_name && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {wo.assignee_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition shrink-0 mt-1" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vehicles = useAppStore((s) => s.vehicles);
  const workOrders = useAppStore((s) => s.workOrders);
  const partTurnovers = useAppStore((s) => s.partTurnovers);

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === params.id),
    [vehicles, params.id],
  );

  const vehicleWorkOrders = useMemo(
    () => workOrders.filter((w) => w.vehicle_id === params.id),
    [workOrders, params.id],
  );

  const vehicleTurnovers = useMemo(() => {
    const woIds = new Set(vehicleWorkOrders.map((w) => w.id));
    return partTurnovers.filter(
      (t) => t.workorder_id && woIds.has(t.workorder_id),
    );
  }, [partTurnovers, vehicleWorkOrders]);

  if (!vehicle) {
    return (
      <div>
        <PageHeader
          title="车辆不存在"
          description="未找到该车辆档案。"
          backHref="/vehicles"
        />
        <EmptyState
          title="车辆未找到"
          description="该车辆可能已被删除或不存在。"
          action={
            <button
              onClick={() => router.push('/vehicles')}
              className="btn-primary"
            >
              返回列表
            </button>
          }
        />
      </div>
    );
  }

  const getTurnoverIcon = (type: string) => {
    if (type === 'in') return <ArrowDownLeft className="w-3.5 h-3.5" />;
    if (type === 'out') return <ArrowUpRight className="w-3.5 h-3.5" />;
    return <ArrowLeftRight className="w-3.5 h-3.5" />;
  };

  return (
    <div>
      <PageHeader
        title={vehicle.plate_number}
        description={`${vehicle.brand} ${vehicle.model}`}
        backHref="/vehicles"
        actions={
          <Link href="/vehicles/new" className="btn-secondary">
            <CarFront className="w-4 h-4" />
            新增车辆
          </Link>
        }
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-6 lg:col-span-2 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
              <CarFront className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">
                {vehicle.plate_number}
              </div>
              <div className="text-sm text-slate-500">
                {vehicle.brand} · {vehicle.model}
              </div>
            </div>
            <div className="ml-auto">
              <Badge className="bg-brand-50 text-brand-700">{vehicle.brand}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/60">
              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">VIN码</div>
                <div className="font-mono text-sm text-slate-800 mt-0.5">
                  {vehicle.vin}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/60">
              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                <CarFront className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">品牌车型</div>
                <div className="text-sm text-slate-800 mt-0.5">
                  {vehicle.brand} {vehicle.model}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-50/50">
              <div className="w-8 h-8 rounded-md bg-white border border-accent-200 flex items-center justify-center text-accent-600">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">车主姓名</div>
                <div className="text-sm font-medium text-slate-800 mt-0.5">
                  {vehicle.owner_name}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-50/50">
              <div className="w-8 h-8 rounded-md bg-white border border-accent-200 flex items-center justify-center text-accent-600">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">联系电话</div>
                <div className="text-sm font-medium text-slate-800 mt-0.5">
                  {vehicle.owner_phone}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/60 sm:col-span-2">
              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">登记时间</div>
                <div className="text-sm text-slate-800 mt-0.5">
                  {formatDate(vehicle.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 content-start animate-fade-in-up">
          <div className="card p-5">
            <div className="text-sm text-slate-500">关联工单</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {vehicleWorkOrders.length}
              </span>
              <span className="text-xs text-slate-400">单</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {vehicleWorkOrders
                .filter((w) => w.status !== 'completed' && w.status !== 'cancelled')
                .slice(0, 3)
                .map((w) => (
                  <Badge
                    key={w.id}
                    className={cn(
                      workOrderStatusColor[w.status],
                      '!text-[10px]',
                    )}
                  >
                    {workOrderStatusLabel[w.status]}
                  </Badge>
                ))}
              {vehicleWorkOrders.filter(
                (w) => w.status !== 'completed' && w.status !== 'cancelled',
              ).length === 0 && (
                <span className="text-xs text-slate-400">无进行中</span>
              )}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-slate-500">配件周转</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {vehicleTurnovers.length}
              </span>
              <span className="text-xs text-slate-400">笔</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(() => {
                const total = vehicleTurnovers.reduce(
                  (s, t) => s + (t.type === 'out' ? t.quantity : 0),
                  0,
                );
                return total > 0 ? (
                  <Badge className="bg-brand-50 text-brand-700 !text-[10px]">
                    出库 {total} 件
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-400">暂无出库</span>
                );
              })()}
            </div>
          </div>
          <div className="card p-5 col-span-2">
            <div className="text-sm text-slate-500 mb-2">快捷操作</div>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/workorders?vehicle=${vehicle.id}`)}
                className="w-full btn-secondary !justify-start"
              >
                <FileText className="w-4 h-4" />
                查看全部工单
              </button>
              <button
                onClick={() => router.push(`/workorders/new?vehicle=${vehicle.id}`)}
                className="w-full btn-primary !justify-start"
              >
                <Wrench className="w-4 h-4" />
                创建新工单
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-brand-50 flex items-center justify-center text-brand-600">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-800">关联工单时间线</h2>
            <span className="text-xs text-slate-400">
              共 {vehicleWorkOrders.length} 条记录
            </span>
          </div>
          <WorkOrderTimeline orders={vehicleWorkOrders} />
        </div>

        <div className="lg:col-span-2 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-accent-50 flex items-center justify-center text-accent-600">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-800">关联配件周转</h2>
            <span className="text-xs text-slate-400">
              共 {vehicleTurnovers.length} 条记录
            </span>
          </div>

          {vehicleTurnovers.length === 0 ? (
            <div className="card p-8 flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">暂无配件周转记录</p>
            </div>
          ) : (
            <DataTable
              data={vehicleTurnovers}
              rowKey={(r) => r.id}
              columns={[
                {
                  key: 'part',
                  header: '配件',
                  render: (r) => (
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        {r.part_name}
                      </div>
                      {r.workorder_title && (
                        <div className="text-xs text-slate-400 truncate max-w-[160px]">
                          {r.workorder_title}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'type',
                  header: '类型',
                  render: (r) => (
                    <Badge
                      className={cn(turnoverTypeColor[r.type], 'gap-1')}
                    >
                      {getTurnoverIcon(r.type)}
                      {turnoverTypeLabel[r.type]}
                    </Badge>
                  ),
                },
                {
                  key: 'quantity',
                  header: '数量',
                  render: (r) => (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        r.type === 'in'
                          ? 'text-emerald-600'
                          : r.type === 'out'
                            ? 'text-brand-700'
                            : 'text-purple-600',
                      )}
                    >
                      {r.type === 'in' ? '+' : r.type === 'out' ? '-' : '↔'}
                      {r.quantity}
                    </span>
                  ),
                },
                {
                  key: 'created_at',
                  header: '时间',
                  render: (r) => (
                    <span className="text-xs text-slate-500">
                      {formatDate(r.created_at)}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </div>
      </section>
    </div>
  );
}
