'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CarFront,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  CircleDashed,
  AlertTriangle,
  Package,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import type { WorkOrderStatus } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Badge } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import {
  workOrderStatusLabel,
  workOrderStatusColor,
  nodeStatusLabel,
  nodeStatusColor,
  formatDate,
  overallResultLabel,
  overallResultColor,
  turnoverTypeLabel,
  turnoverTypeColor,
  cn,
} from '@/lib/utils';

const NEXT_STATUS_MAP: Record<WorkOrderStatus, { value: WorkOrderStatus; label: string } | null> = {
  pending: { value: 'assigned', label: '派工' },
  assigned: { value: 'in_progress', label: '开始维修' },
  in_progress: { value: 'quality_check', label: '提交质检' },
  quality_check: { value: 'completed', label: '质检通过' },
  completed: null,
  cancelled: null,
};

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workOrders = useAppStore((s) => s.workOrders);
  const productionNodes = useAppStore((s) => s.productionNodes);
  const partTurnovers = useAppStore((s) => s.partTurnovers);
  const qualityInspections = useAppStore((s) => s.qualityInspections);
  const updateWorkOrderStatus = useAppStore((s) => s.updateWorkOrderStatus);

  const workOrder = workOrders.find((w) => w.id === params.id);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<WorkOrderStatus | null>(null);

  const nodes = useMemo(() => {
    return productionNodes
      .filter((n) => n.workorder_id === params.id)
      .sort((a, b) => a.sequence - b.sequence);
  }, [productionNodes, params.id]);

  const turnovers = useMemo(() => {
    return partTurnovers.filter((t) => t.workorder_id === params.id);
  }, [partTurnovers, params.id]);

  const inspections = useMemo(() => {
    return qualityInspections.filter((q) => q.workorder_id === params.id);
  }, [qualityInspections, params.id]);

  if (!workOrder) {
    return (
      <div>
        <PageHeader
          title="工单不存在"
          description="未找到对应的工单记录。"
          backHref="/workorders"
        />
        <div className="card p-10 text-center text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          工单不存在或已被删除
        </div>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS_MAP[workOrder.status];

  const handleConfirmStatus = () => {
    if (pendingStatus) {
      updateWorkOrderStatus(workOrder.id, pendingStatus);
    }
    setStatusModalOpen(false);
    setPendingStatus(null);
  };

  const handleConfirmCancel = () => {
    updateWorkOrderStatus(workOrder.id, 'cancelled');
    setCancelModalOpen(false);
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
      default:
        return <CircleDashed className="w-5 h-5 text-slate-300" />;
    }
  };

  const turnoverColumns = [
    {
      key: 'part_name',
      header: '配件名称',
      render: (r: any) => <span className="font-medium">{r.part_name}</span>,
    },
    {
      key: 'type',
      header: '类型',
      render: (r: any) => (
        <Badge className={turnoverTypeColor[r.type]}>
          {turnoverTypeLabel[r.type]}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      header: '数量',
      render: (r: any) => (
        <span className={cn(r.type === 'out' ? 'text-brand-600' : 'text-emerald-600', 'font-medium')}>
          {r.type === 'out' ? '-' : '+'}
          {r.quantity}
        </span>
      ),
    },
    {
      key: 'operator_name',
      header: '操作人',
    },
    {
      key: 'created_at',
      header: '时间',
      render: (r: any) => formatDate(r.created_at),
      className: 'text-slate-500',
    },
  ];

  return (
    <div>
      <PageHeader
        title={workOrder.title}
        description={`工单编号：${workOrder.id}`}
        backHref="/workorders"
      >
        {nextStatus && (
          <button
            onClick={() => {
              setPendingStatus(nextStatus.value);
              setStatusModalOpen(true);
            }}
            className="btn-primary inline-flex items-center gap-1.5"
          >
            {nextStatus.label}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
          <button
            onClick={() => setCancelModalOpen(true)}
            className="btn-danger"
          >
            取消工单
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">工单状态</div>
                <Badge className={cn('text-sm px-3 py-1', workOrderStatusColor[workOrder.status])}>
                  {workOrderStatusLabel[workOrder.status]}
                </Badge>
              </div>
              <div className="text-right text-sm text-slate-500 space-y-0.5">
                <div className="flex items-center justify-end gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  创建时间：{formatDate(workOrder.created_at)}
                </div>
                {workOrder.completed_at && (
                  <div className="flex items-center justify-end gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    完成时间：{formatDate(workOrder.completed_at)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <CarFront className="w-4.5 h-4.5 text-slate-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">关联车辆</div>
                  <div className="font-semibold text-slate-900">{workOrder.vehicle_plate}</div>
                  <div className="text-sm text-slate-500">
                    {workOrder.vehicle_brand} {workOrder.vehicle_model}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-4.5 h-4.5 text-slate-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">负责人</div>
                  <div className="font-semibold text-slate-900">
                    {workOrder.assignee_name ?? '未指派'}
                  </div>
                  <div className="text-sm text-slate-500">
                    {workOrder.team_name ? `班组：${workOrder.team_name}` : '暂未分配班组'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 mb-2">工单描述</div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {workOrder.description}
              </p>
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardCheck className="w-5 h-5 text-brand-600" />
              <h2 className="font-semibold text-slate-900">生产节点进度</h2>
            </div>

            {nodes.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">暂无生产节点</div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
                <ul className="space-y-5">
                  {nodes.map((node, idx) => (
                    <li key={node.id} className="relative flex gap-4">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                        {getNodeIcon(node.status)}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="font-medium text-slate-900">
                            {idx + 1}. {node.node_name}
                          </div>
                          <Badge className={nodeStatusColor[node.status]}>
                            {nodeStatusLabel[node.status]}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5">
                          {node.operator_name && (
                            <div>操作人：{node.operator_name}</div>
                          )}
                          {node.started_at && (
                            <div>开始时间：{formatDate(node.started_at)}</div>
                          )}
                          {node.completed_at && (
                            <div>完成时间：{formatDate(node.completed_at)}</div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <h2 className="font-semibold text-slate-900">关联配件周转</h2>
              </div>
              <span className="text-xs text-slate-500">共 {turnovers.length} 条记录</span>
            </div>
            <DataTable
              data={turnovers}
              rowKey={(r) => r.id}
              columns={turnoverColumns}
              emptyText="暂无配件周转记录"
              className="shadow-none border-0"
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-brand-600" />
              <h2 className="font-semibold text-slate-900">质检结果</h2>
            </div>

            {inspections.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">暂无质检记录</div>
            ) : (
              <ul className="space-y-4">
                {inspections.map((qi) => (
                  <li key={qi.id} className="border border-slate-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-slate-500">
                        {formatDate(qi.created_at)}
                      </div>
                      <Badge className={overallResultColor[qi.overall_result]}>
                        {overallResultLabel[qi.overall_result]}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      质检员：{qi.inspector_name}
                    </div>
                    <ul className="space-y-1.5 mb-3">
                      {qi.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {item.result === 'pass' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <span
                              className={cn(
                                item.result === 'pass' ? 'text-slate-700' : 'text-amber-700',
                              )}
                            >
                              {item.name}
                            </span>
                            {item.issue && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                问题：{item.issue}
                              </div>
                            )}
                            {item.rectification && (
                              <div className="text-xs text-slate-500">
                                整改：{item.rectification}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {qi.remark && (
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                        备注：{qi.remark}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <Modal
        open={statusModalOpen}
        title="确认状态变更"
        size="sm"
        onClose={() => {
          setStatusModalOpen(false);
          setPendingStatus(null);
        }}
        footer={
          <>
            <button
              onClick={() => {
                setStatusModalOpen(false);
                setPendingStatus(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleConfirmStatus} className="btn-primary">
              确认
            </button>
          </>
        }
      >
        <div className="text-sm text-slate-600">
          确定要将工单状态变更为
          <span className="mx-1 font-semibold text-slate-900">
            {pendingStatus && workOrderStatusLabel[pendingStatus]}
          </span>
          吗？
        </div>
      </Modal>

      <Modal
        open={cancelModalOpen}
        title="取消工单"
        size="sm"
        onClose={() => setCancelModalOpen(false)}
        footer={
          <>
            <button onClick={() => setCancelModalOpen(false)} className="btn-secondary">
              返回
            </button>
            <button onClick={handleConfirmCancel} className="btn-danger">
              确认取消
            </button>
          </>
        }
      >
        <div className="text-sm text-slate-600">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">此操作不可撤销</span>
          </div>
          确定要取消该工单吗？取消后工单将无法继续处理。
        </div>
      </Modal>
    </div>
  );
}
