import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Settings,
  ArrowRightLeft,
  ClipboardCheck,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, getStepTypeLabel } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import type { StepType, FlowRecord } from '@/types';

const stepTypeStyles: Record<StepType, { text: string; ring: string }> = {
  identity_review: { text: 'text-blue-600', ring: 'ring-blue-600' },
  repair_process: { text: 'text-green-600', ring: 'ring-green-600' },
  seat_change: { text: 'text-purple-600', ring: 'ring-purple-600' },
  status_change: { text: 'text-orange-600', ring: 'ring-orange-600' },
  quota_check: { text: 'text-cyan-600', ring: 'ring-cyan-600' },
};

const stepIcons: Record<StepType, typeof ShieldCheck> = {
  identity_review: ShieldCheck,
  repair_process: Settings,
  seat_change: ArrowRightLeft,
  status_change: ClipboardCheck,
  quota_check: Clock,
};

function RecordDetail({ record }: { record: FlowRecord }) {
  switch (record.stepType) {
    case 'identity_review':
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="py-1 text-left font-medium">字段</th>
              <th className="py-1 text-left font-medium">变更前</th>
              <th className="py-1 text-left font-medium">变更后</th>
            </tr>
          </thead>
          <tbody>
            {record.changedFields.map((field) => (
              <tr key={field} className="border-t border-slate-100">
                <td className="py-1.5 font-medium text-slate-600">{field}</td>
                <td className="py-1.5 text-red-600 line-through">
                  {String(record.previousValue[field] ?? '-')}
                </td>
                <td className="py-1.5 text-green-600">
                  {String(record.newValue[field] ?? '-')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'status_change':
      return (
        <div className="flex items-center gap-2 text-sm">
          {record.previousValue.status && (
            <StatusBadge status={record.previousValue.status} />
          )}
          <span className="text-slate-400">→</span>
          {record.newValue.status && (
            <StatusBadge status={record.newValue.status} />
          )}
        </div>
      );
    case 'seat_change':
      return (
        <div className="space-y-1 text-sm">
          {record.changedFields.map((field) => (
            <div key={field} className="flex items-center gap-2">
              <span className="text-slate-500">{field}:</span>
              <span className="text-red-500 line-through">
                {String(record.previousValue[field] ?? '-')}
              </span>
              <span className="text-slate-400">→</span>
              <span className="text-green-600">
                {String(record.newValue[field] ?? '-')}
              </span>
            </div>
          ))}
        </div>
      );
    case 'repair_process':
      return (
        <div className="space-y-1 text-sm text-slate-600">
          {record.changedFields.map((field) => (
            <p key={field}>
              {field}: {String(record.newValue[field] ?? '-')}
            </p>
          ))}
        </div>
      );
    case 'quota_check':
      return (
        <div className="text-sm">
          {record.newValue.available !== undefined && (
            <span
              className={
                record.newValue.available ? 'text-green-600' : 'text-red-600'
              }
            >
              {record.newValue.available ? '名额可用' : '名额已满'}
            </span>
          )}
          {record.newValue.used !== undefined && (
            <span className="ml-2 text-slate-500">
              ({record.newValue.used}/{record.newValue.max})
            </span>
          )}
        </div>
      );
    default:
      return null;
  }
}

export default function FlowRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    currentRequest,
    currentRequestLoading,
    fetchRequest,
    flowRecords,
    flowRecordsLoading,
    fetchFlowRecords,
  } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    return (
      <div className="py-20 text-center text-slate-400">
        未找到该报修申请
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/review/${id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          返回审核详情
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">流程记录</h1>
        <StatusBadge status={currentRequest.status} />
        <span className="text-sm text-slate-500">
          {currentRequest.studentName}
        </span>
        <span className="font-mono text-xs text-slate-400">
          {currentRequest.id}
        </span>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        {flowRecordsLoading ? (
          <div className="py-8 text-center text-slate-400">加载中...</div>
        ) : flowRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-400">暂无处理记录</div>
        ) : (
          <div className="relative">
            <div className="absolute bottom-0 left-5 top-0 w-0.5 bg-slate-200" />
            <div className="space-y-6">
              {flowRecords.map((record) => {
                const Icon = stepIcons[record.stepType] || ClipboardCheck;
                const styles = stepTypeStyles[record.stepType];
                const isExpanded = expandedId === record.id;
                return (
                  <div key={record.id} className="relative pl-12">
                    <div
                      className={`absolute left-3 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ${styles.ring}`}
                    >
                      <Icon size={12} className={styles.text} />
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : record.id)
                        }
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${styles.text}`}
                          >
                            {getStepTypeLabel(record.stepType)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(record.createdAt)}
                          </span>
                          <span className="text-xs text-slate-500">
                            操作人: {record.operatorName}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </button>
                      {record.changedFields.length > 0 && !isExpanded && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {record.changedFields.map((f) => (
                            <span
                              key={f}
                              className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                      {isExpanded && (
                        <div className="mt-3">
                          <RecordDetail record={record} />
                          {record.remark && (
                            <p className="mt-2 text-xs italic text-slate-500">
                              备注: {record.remark}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
