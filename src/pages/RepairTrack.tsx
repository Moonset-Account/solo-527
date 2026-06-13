import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Building2, Wrench, AlertTriangle, FileText, X, ChevronDown, ChevronUp, ShieldCheck, Settings, ArrowRightLeft, ClipboardCheck, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, getRepairTypeLabel, getUrgencyLabel, getStatusLabel, getStepTypeLabel } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import type { StepType, FlowRecord } from '@/types';

const stepIcons: Record<StepType, typeof ShieldCheck> = {
  identity_review: ShieldCheck,
  repair_process: Settings,
  seat_change: ArrowRightLeft,
  status_change: ClipboardCheck,
  quota_check: Clock,
};

function DiffView({ record }: { record: FlowRecord }) {
  const { changedFields, previousValue, newValue } = record;
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
      {changedFields.map((field) => (
        <div key={field} className="text-sm">
          <p className="mb-1 font-medium text-slate-600">{field}</p>
          <div className="flex items-start gap-2">
            <div className="flex-1 rounded bg-red-50 px-2 py-1 text-red-700 line-through">
              {String(previousValue[field] ?? '-')}
            </div>
            <ArrowRightLeft size={14} className="mt-1.5 shrink-0 text-slate-400" />
            <div className="flex-1 rounded bg-green-50 px-2 py-1 text-green-700">
              {String(newValue[field] ?? '-')}
            </div>
          </div>
        </div>
      ))}
      {record.remark && <p className="text-xs text-slate-500 italic">备注: {record.remark}</p>}
    </div>
  );
}

export default function RepairTrack() {
  const { id } = useParams<{ id: string }>();
  const { currentRequest, currentRequestLoading, fetchRequest, flowRecords, flowRecordsLoading, fetchFlowRecords } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRequest(id);
      fetchFlowRecords(id);
    }
  }, [id, fetchRequest, fetchFlowRecords]);

  if (currentRequestLoading) {
    return <div className="py-20 text-center text-slate-400">加载中...</div>;
  }

  if (!currentRequest) {
    return <div className="py-20 text-center text-slate-400">未找到该报修申请</div>;
  }

  const r = currentRequest;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">报修追踪</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">申请信息</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { icon: Building2, label: '楼栋', value: r.building },
                { icon: User, label: '房间号', value: r.roomNumber },
                { icon: Wrench, label: '报修类型', value: getRepairTypeLabel(r.repairType) },
                { icon: AlertTriangle, label: '紧急程度', value: getUrgencyLabel(r.urgency), badge: <UrgencyBadge urgency={r.urgency} /> },
                { icon: FileText, label: '状态', value: getStatusLabel(r.status), badge: <StatusBadge status={r.status} /> },
                { icon: User, label: '申请人', value: r.studentName },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2">
                    <Icon size={16} className="mt-0.5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">{item.label}</p>
                      {item.badge || <p className="text-sm font-medium text-slate-700">{item.value}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">问题描述</p>
              <p className="mt-1 text-sm text-slate-700">{r.description}</p>
            </div>
          </div>

          {r.photos.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">照片</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {r.photos.map((p) => (
                  <img key={p.id} src={p.filePath} alt={p.fileName} onClick={() => setModalSrc(p.filePath)} className="h-24 w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-80" />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">处理进度</h2>
            {flowRecordsLoading ? (
              <div className="py-8 text-center text-slate-400">加载中...</div>
            ) : flowRecords.length === 0 ? (
              <div className="py-8 text-center text-slate-400">暂无处理记录</div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-4">
                  {flowRecords.map((record) => {
                    const Icon = stepIcons[record.stepType] || ClipboardCheck;
                    const isExpanded = expandedId === record.id;
                    return (
                      <div key={record.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                          <button onClick={() => setExpandedId(isExpanded ? null : record.id)} className="flex w-full items-center justify-between text-left">
                            <div className="flex items-center gap-2">
                              <Icon size={16} className="text-blue-600" />
                              <span className="text-sm font-medium text-slate-700">{getStepTypeLabel(record.stepType)}</span>
                              <span className="text-xs text-slate-400">{formatDate(record.createdAt)}</span>
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </button>
                          <p className="mt-1 text-xs text-slate-500">操作人: {record.operatorName}</p>
                          {isExpanded && <DiffView record={record} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">状态</h2>
            <StatusBadge status={r.status} />
            <div className="mt-3 space-y-2 text-sm text-slate-500">
              <p>提交时间: {formatDate(r.createdAt)}</p>
              <p>更新时间: {formatDate(r.updatedAt)}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">申请单号</h2>
            <p className="font-mono text-sm text-slate-700">{r.id}</p>
          </div>
        </div>
      </div>

      {modalSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalSrc(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img src={modalSrc} alt="" className="max-h-[90vh] rounded-lg object-contain" />
            <button onClick={() => setModalSrc(null)} className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
              <X size={18} className="text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
