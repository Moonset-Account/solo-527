import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import type { ExceptionOrder } from '@/types';

const mockException: ExceptionOrder = {
  id: 1, type: 'room_conflict', sourceId: 1, sourceType: 'appointment',
  description: '望京SOHO-A1201 预约时间冲突：同一时段(2026-06-17 09:00)存在多个预约记录，租客张先生和赵女士的预约时间重叠。',
  status: 'open', handlerId: 0, handlerName: '', resolutionNote: '',
  createdAt: '2026-06-16T08:00:00', resolvedAt: '',
};

const typeLabels: Record<string, string> = {
  room_conflict: '预约冲突',
  system_error: '系统错误',
  payment_failed: '支付失败',
  message_failed: '消息失败',
};

export default function ExceptionDetail() {
  const { id } = useParams();
  const [exception] = useState(mockException);
  const [resolutionNote, setResolutionNote] = useState('');

  return (
    <div className="space-y-4">
      <Link to="/exceptions" className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F97316]">
        <ArrowLeft size={16} /> 返回异常列表
      </Link>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#F1F5F9]">异常单详情 #{id}</h2>
          <StatusBadge status={exception.status} pulse={exception.status === 'open'} />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <span className="text-sm text-[#94A3B8]">异常类型</span>
            <p className="text-[#F1F5F9] mt-0.5 flex items-center gap-1">
              <AlertTriangle size={14} className="text-rose-400" />
              {typeLabels[exception.type]}
            </p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">来源</span>
            <p className="text-[#F1F5F9] mt-0.5">{exception.sourceType}#{exception.sourceId}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">创建时间</span>
            <p className="text-[#F1F5F9] mt-0.5">{exception.createdAt.replace('T', ' ')}</p>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-sm text-[#94A3B8]">异常描述</span>
          <div className="mt-2 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <p className="text-sm text-rose-300 leading-relaxed">{exception.description}</p>
          </div>
        </div>

        {exception.status === 'resolved' && (
          <div className="mb-4">
            <span className="text-sm text-[#94A3B8]">处理结果</span>
            <p className="text-[#F1F5F9] mt-1">{exception.resolutionNote}</p>
            <p className="text-xs text-[#64748B] mt-1">处理人：{exception.handlerName} | 解决时间：{exception.resolvedAt.replace('T', ' ')}</p>
          </div>
        )}

        {exception.status !== 'resolved' && (
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
              disabled={!resolutionNote.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              标记为已解决
            </button>
          </>
        )}
      </div>
    </div>
  );
}
