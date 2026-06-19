import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type Exception } from '../lib/api';
import { formatDate } from '../lib/utils';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';

export const Route = createFileRoute('/exceptions')({
  component: ExceptionsPage,
});

function ExceptionsPage() {
  const [filter, setFilter] = useState<string>('');

  const { data: exceptions } = useQuery({
    queryKey: ['exceptions', filter],
    queryFn: () => api.exceptions.list(filter ? { status: filter } : undefined),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">异常处理清单</h2>

      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: '全部' },
          { value: 'open', label: '待处理' },
          { value: 'processing', label: '处理中' },
          { value: 'closed', label: '已关闭' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === tab.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {exceptions?.data.map((ex) => (
          <ExceptionCard key={ex.id} exception={ex} />
        ))}
        {exceptions?.data.length === 0 && (
          <div className="text-center py-12 text-slate-400">暂无异常记录</div>
        )}
      </div>
    </div>
  );
}

function ExceptionCard({ exception: ex }: { exception: Exception }) {
  const [showClose, setShowClose] = useState(false);
  const [closeExplanation, setCloseExplanation] = useState('');
  const [handler, setHandler] = useState('');
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { status: string; handler?: string; closeExplanation?: string }) =>
      api.exceptions.update(ex.id, data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      setShowClose(false);
    },
  });

  const statusConfig: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
    open: { icon: <AlertTriangle size={16} />, bg: 'bg-red-50', text: 'text-red-700', label: '待处理' },
    processing: { icon: <Clock size={16} />, bg: 'bg-amber-50', text: 'text-amber-700', label: '处理中' },
    closed: { icon: <CheckCircle size={16} />, bg: 'bg-green-50', text: 'text-green-700', label: '已关闭' },
  };

  const config = statusConfig[ex.status] || statusConfig.open;

  const handleProcessing = () => {
    updateMutation.mutate({ status: 'processing', handler: handler || undefined });
  };

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeExplanation.trim()) return;
    updateMutation.mutate({
      status: 'closed',
      handler: handler || undefined,
      closeExplanation: closeExplanation.trim(),
    });
  };

  return (
    <div className={`bg-white border rounded-xl p-5 ${ex.status === 'open' ? 'border-red-200' : ex.status === 'processing' ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full ${config.bg} ${config.text}`}>
              {config.icon}
              {config.label}
            </span>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{ex.type}</span>
          </div>
          <h3 className="font-semibold text-slate-900">{ex.description || ex.type}</h3>
          <div className="text-sm text-slate-500 mt-1">
            关联排期：{ex.scheduleTitle || '-'} · 平台：{ex.platform || '-'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            创建人：{ex.createdBy || '-'} · 创建时间：{formatDate(ex.createdAt)}
            {ex.handler && <span className="ml-3">处理人：{ex.handler}</span>}
            {ex.handledAt && <span className="ml-3">处理时间：{formatDate(ex.handledAt)}</span>}
          </div>
          {ex.closeExplanation && (
            <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800">关闭说明：</p>
              <p className="text-sm text-green-700 mt-0.5">{ex.closeExplanation}</p>
            </div>
          )}
        </div>

        {ex.status !== 'closed' && (
          <div className="flex items-center gap-2 ml-4">
            {ex.status === 'open' && (
              <button
                onClick={handleProcessing}
                className="text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
              >
                开始处理
              </button>
            )}
            <button
              onClick={() => setShowClose(true)}
              className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>

      {showClose && (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900">关闭异常</h4>
            <button onClick={() => setShowClose(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-slate-600 mb-1">处理人</label>
            <input
              type="text"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              placeholder="品牌内容负责人姓名"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-slate-600 mb-1">
              关闭说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={closeExplanation}
              onChange={(e) => setCloseExplanation(e.target.value)}
              placeholder="品牌内容负责人关闭时必须填写说明..."
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-red-500 mt-1">
              品牌内容负责人关闭异常时必须补充说明原因
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              disabled={!closeExplanation.trim() || updateMutation.isPending}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? '提交中...' : '确认关闭'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
