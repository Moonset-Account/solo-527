import { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, Settings, ArrowRightLeft, ClipboardCheck, Clock } from 'lucide-react';
import type { StepType, FlowRecord } from '@/types';
import { formatDate, getStepTypeLabel } from '@/utils/format';

const stepIcons: Record<StepType, typeof ShieldCheck> = {
  identity_review: ShieldCheck,
  repair_process: Settings,
  seat_change: ArrowRightLeft,
  status_change: ClipboardCheck,
  quota_check: Clock,
};

function DiffView({ record }: { record: FlowRecord }) {
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
      {record.changedFields.map((field) => (
        <div key={field} className="text-sm">
          <p className="mb-1 font-medium text-slate-600">{field}</p>
          <div className="flex items-start gap-2">
            <div className="flex-1 rounded bg-red-50 px-2 py-1 text-red-700 line-through">
              {String(record.previousValue[field] ?? '-')}
            </div>
            <ArrowRightLeft size={14} className="mt-1.5 shrink-0 text-slate-400" />
            <div className="flex-1 rounded bg-green-50 px-2 py-1 text-green-700">
              {String(record.newValue[field] ?? '-')}
            </div>
          </div>
        </div>
      ))}
      {record.remark && (
        <p className="text-xs italic text-slate-500">备注: {record.remark}</p>
      )}
    </div>
  );
}

export default function FlowTimeline({
  records,
  loading,
}: {
  records: FlowRecord[];
  loading: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return <div className="py-8 text-center text-slate-400">加载中...</div>;
  }
  if (records.length === 0) {
    return <div className="py-8 text-center text-slate-400">暂无处理记录</div>;
  }

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-slate-200" />
      <div className="space-y-4">
        {records.map((record) => {
          const Icon = stepIcons[record.stepType] || ClipboardCheck;
          const isExpanded = expandedId === record.id;
          return (
            <div key={record.id} className="relative pl-10">
              <div className="absolute left-2.5 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {getStepTypeLabel(record.stepType)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(record.createdAt)}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </button>
                <p className="mt-1 text-xs text-slate-500">
                  操作人: {record.operatorName}
                </p>
                {isExpanded && <DiffView record={record} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
