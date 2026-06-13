import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Building2,
  Wrench,
  AlertTriangle,
  FileText,
  X,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  formatDate,
  getRepairTypeLabel,
} from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import FlowTimeline from '@/components/FlowTimeline';

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    currentRequest: r,
    currentRequestLoading,
    fetchRequest,
    flowRecords,
    flowRecordsLoading,
    fetchFlowRecords,
    updateStatus,
    quotas,
    fetchQuotas,
  } = useAppStore();
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [quotaResult, setQuotaResult] = useState<{
    available: boolean;
    used: number;
    max: number;
  } | null>(null);
  const [handlerName, setHandlerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequest(id);
      fetchFlowRecords(id);
    }
  }, [id, fetchRequest, fetchFlowRecords]);

  if (currentRequestLoading) {
    return <div className="py-20 text-center text-slate-400">加载中...</div>;
  }
  if (!r) {
    return <div className="py-20 text-center text-slate-400">未找到该报修申请</div>;
  }

  const handleIdentityApprove = async () => {
    setSubmitting(true);
    try {
      await updateStatus(r.id, 'quota_checking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIdentityReject = async () => {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    try {
      await updateStatus(r.id, 'rejected');
    } finally {
      setSubmitting(false);
      setShowReject(false);
    }
  };

  const handleQuotaCheck = async () => {
    await fetchQuotas();
    const match = quotas.find(
      (q) => q.building === r.building && q.repairType === r.repairType,
    );
    if (match) {
      setQuotaResult({
        available: match.currentUsed < match.maxQuota,
        used: match.currentUsed,
        max: match.maxQuota,
      });
    } else {
      setQuotaResult({ available: true, used: 0, max: 0 });
    }
  };

  const handleAssign = async () => {
    if (!handlerName.trim()) return;
    setSubmitting(true);
    try {
      await updateStatus(r.id, 'assigned');
    } finally {
      setSubmitting(false);
      setHandlerName('');
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await updateStatus(r.id, 'completed');
    } finally {
      setSubmitting(false);
    }
  };

  const identityRecords = flowRecords.filter(
    (f) => f.stepType === 'identity_review',
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/review"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">审核详情</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              申请信息
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { icon: FileText, label: '申请单号', value: r.id },
                { icon: Building2, label: '楼栋', value: r.building },
                { icon: Building2, label: '房间号', value: r.roomNumber },
                {
                  icon: Wrench,
                  label: '报修类型',
                  value: getRepairTypeLabel(r.repairType),
                },
                {
                  icon: AlertTriangle,
                  label: '紧急程度',
                  value: <UrgencyBadge urgency={r.urgency} />,
                },
                {
                  icon: FileText,
                  label: '状态',
                  value: <StatusBadge status={r.status} />,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2">
                    <Icon size={16} className="mt-0.5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">{item.label}</p>
                      {typeof item.value === 'string' ? (
                        <p className="text-sm font-medium text-slate-700">
                          {item.value}
                        </p>
                      ) : (
                        item.value
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">问题描述</p>
              <p className="mt-1 text-sm text-slate-700">{r.description}</p>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span>提交时间: {formatDate(r.createdAt)}</span>
              <span>更新时间: {formatDate(r.updatedAt)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              学生信息
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <User size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">姓名</p>
                  <p className="text-sm font-medium text-slate-700">
                    {r.studentName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">学号</p>
                  <p className="text-sm font-medium text-slate-700">
                    {r.studentId}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">楼栋房间</p>
                  <p className="text-sm font-medium text-slate-700">
                    {r.building} {r.roomNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {r.photos.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                照片
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {r.photos.map((p) => (
                  <img
                    key={p.id}
                    src={p.filePath}
                    alt={p.fileName}
                    onClick={() => setModalSrc(p.filePath)}
                    className="h-24 w-full cursor-pointer rounded-lg object-cover hover:opacity-80"
                  />
                ))}
              </div>
            </div>
          )}

          {identityRecords.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                身份审核变更
              </h2>
              {identityRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="mb-4 rounded-lg border border-slate-200 p-4"
                >
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(rec.createdAt)} - {rec.operatorName}
                  </p>
                  {rec.changedFields.map((field) => (
                    <div key={field} className="mt-2 text-sm">
                      <p className="font-medium text-slate-600">{field}</p>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 rounded bg-red-50 px-2 py-1 text-red-700 line-through">
                          {String(rec.previousValue[field] ?? '-')}
                        </div>
                        <div className="flex-1 rounded bg-green-50 px-2 py-1 text-green-700">
                          {String(rec.newValue[field] ?? '-')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              处理进度
            </h2>
            <FlowTimeline records={flowRecords} loading={flowRecordsLoading} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              审核操作
            </h2>

            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                <ShieldCheck size={16} />
                身份审核
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleIdentityApprove}
                  disabled={submitting}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  通过
                </button>
                <button
                  onClick={() => setShowReject(!showReject)}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                >
                  <XCircle size={14} />
                  驳回
                </button>
              </div>
              {showReject && (
                <div className="mt-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请输入驳回原因"
                    className="w-full rounded-md border border-slate-300 p-2 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleIdentityReject}
                    disabled={submitting || !rejectReason.trim()}
                    className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    确认驳回
                  </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                <Clock size={16} />
                名额检查
              </h3>
              <button
                onClick={handleQuotaCheck}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                检查名额
              </button>
              {quotaResult && (
                <div
                  className={`mt-2 rounded-lg p-3 text-sm ${
                    quotaResult.available
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {quotaResult.available
                    ? `名额可用 (${quotaResult.used}/${quotaResult.max})`
                    : `名额已满 (${quotaResult.used}/${quotaResult.max})`}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                <UserCheck size={16} />
                分配处理人
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={handlerName}
                  onChange={(e) => setHandlerName(e.target.value)}
                  placeholder="处理人姓名"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                <button
                  onClick={handleAssign}
                  disabled={submitting || !handlerName.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  分配
                </button>
              </div>
            </div>

            {r.status === 'processing' && (
              <div>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                  <Check size={16} />
                  完成维修
                </h3>
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  标记完成
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setModalSrc(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={modalSrc}
              alt=""
              className="max-h-[90vh] rounded-lg object-contain"
            />
            <button
              onClick={() => setModalSrc(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <X size={18} className="text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
