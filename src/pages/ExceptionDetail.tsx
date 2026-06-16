import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useExceptionStore } from '@/stores/exceptionStore';

const typeLabels: Record<string, string> = {
  room_conflict: '预约冲突',
  system_error: '系统错误',
  payment_failed: '支付失败',
  message_failed: '消息失败',
};

export default function ExceptionDetail() {
  const { id } = useParams();
  const { currentException, detailLoading, resolveLoading, fetchException, resolveException, clearCurrentException } = useExceptionStore();
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (id) {
      fetchException(Number(id));
    }
    return () => {
      clearCurrentException();
    };
  }, [id, fetchException, clearCurrentException]);

  const handleResolve = async () => {
    if (!id || !resolutionNote.trim()) return;
    const success = await resolveException(Number(id), resolutionNote);
    if (success) {
      fetchException(Number(id));
    }
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[#F97316]" />
      </div>
    );
  }

  if (!currentException) {
    return (
      <div className="space-y-4">
        <Link to="/exceptions" className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F97316]">
          <ArrowLeft size={16} /> 返回异常列表
        </Link>
        <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155] text-center text-[#64748B]">
          未找到异常单
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/exceptions" className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F97316]">
        <ArrowLeft size={16} /> 返回异常列表
      </Link>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#F1F5F9]">异常单详情 #{id}</h2>
          <StatusBadge status={currentException.status} pulse={currentException.status === 'open'} />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <span className="text-sm text-[#94A3B8]">异常类型</span>
            <p className="text-[#F1F5F9] mt-0.5 flex items-center gap-1">
              <AlertTriangle size={14} className="text-rose-400" />
              {typeLabels[currentException.type]}
            </p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">来源</span>
            <p className="text-[#F1F5F9] mt-0.5">{currentException.sourceType}#{currentException.sourceId}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">创建时间</span>
            <p className="text-[#F1F5F9] mt-0.5">{currentException.createdAt.replace('T', ' ')}</p>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-sm text-[#94A3B8]">异常描述</span>
          <div className="mt-2 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <p className="text-sm text-rose-300 leading-relaxed">{currentException.description}</p>
          </div>
        </div>

        {currentException.status === 'resolved' && (
          <div className="mb-4">
            <span className="text-sm text-[#94A3B8]">处理结果</span>
            <p className="text-[#F1F5F9] mt-1">{currentException.resolutionNote}</p>
            <p className="text-xs text-[#64748B] mt-1">处理人：{currentException.handlerName || '-'} | 解决时间：{currentException.resolvedAt?.replace('T', ' ') || '-'}</p>
          </div>
        )}

        {currentException.status !== 'resolved' && (
          <>
            <div className="mb-4">
              <label className="block text-sm text-[#94A3B8] mb-1">
                处理备注 <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none resize-none h-24"
                placeholder="请输入处理备注（必填）"
              />
            </div>
            <button
              onClick={handleResolve}
              disabled={!resolutionNote.trim() || resolveLoading}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex items-center gap-1"
            >
              {resolveLoading && <Loader2 size={16} className="animate-spin" />}
              标记为已解决
            </button>
          </>
        )}
      </div>
    </div>
  );
}
