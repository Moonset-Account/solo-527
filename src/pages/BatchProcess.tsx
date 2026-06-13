import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, ArrowLeft, Play } from 'lucide-react';
import { useAppStore } from '@/store';

export default function BatchProcess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { batchResult, batchLoading, processBatch, retryFailed } = useAppStore();

  const stateIds: string[] = (location.state as { selectedIds?: string[] })?.selectedIds || [];
  const [requestIds, setRequestIds] = useState<string[]>(stateIds);
  const [idInput, setIdInput] = useState(stateIds.join(', '));
  const [operation, setOperation] = useState<'approve' | 'reject'>('approve');
  const [remark, setRemark] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const handleIdChange = (val: string) => {
    setIdInput(val);
    const ids = val.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
    setRequestIds(ids);
  };

  const execute = async () => {
    await processBatch(operation, requestIds);
    setShowConfirm(false);
  };

  const handleRetry = async (requestId: string) => {
    setRetryingIds((prev) => new Set(prev).add(requestId));
    await retryFailed(requestId);
    setRetryingIds((prev) => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/review')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> 返回列表
        </button>
        <h1 className="text-2xl font-bold text-slate-800">批量处理</h1>
      </div>

      {!batchResult && (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">选择申请单</h3>
            <textarea
              value={idInput}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="输入申请单ID，多个ID用逗号或空格分隔"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
            <p className="mt-2 text-xs text-slate-400">已识别 {requestIds.length} 个申请单</p>
            {requestIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {requestIds.map((id) => (
                  <span key={id} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {id.length > 12 ? id.slice(0, 12) + '...' : id}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">操作类型</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="operation" checked={operation === 'approve'} onChange={() => setOperation('approve')} className="accent-green-600" />
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-sm font-medium text-slate-700">批量通过</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="operation" checked={operation === 'reject'} onChange={() => setOperation('reject')} className="accent-red-600" />
                <XCircle size={18} className="text-red-600" />
                <span className="text-sm font-medium text-slate-700">批量驳回</span>
              </label>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">备注</h3>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="输入批量操作备注（选填）"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={requestIds.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Play size={16} /> 执行批量操作
          </button>
        </div>
      )}

      {batchResult && (
        <div className="space-y-6">
          <div className={`rounded-lg p-4 ${batchResult.failCount === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className={batchResult.failCount === 0 ? 'text-green-600' : 'text-yellow-600'} />
              <span className="text-sm font-medium text-slate-800">
                成功处理 {batchResult.successCount} 条{batchResult.failCount > 0 && `，失败 ${batchResult.failCount} 条`}
              </span>
            </div>
          </div>

          {batchResult.successIds.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-green-700 flex items-center gap-1">
                <CheckCircle size={14} /> 成功列表
              </h3>
              <div className="flex flex-wrap gap-2">
                {batchResult.successIds.map((id) => (
                  <span key={id} className="inline-flex items-center rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200">
                    {id.length > 12 ? id.slice(0, 12) + '...' : id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {batchResult.failures.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-red-700 flex items-center gap-1">
                <XCircle size={14} /> 失败列表
              </h3>
              <div className="space-y-2">
                {batchResult.failures.map((f) => (
                  <div key={f.requestId} className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <XCircle size={16} className="text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          {f.requestId.length > 16 ? f.requestId.slice(0, 16) + '...' : f.requestId}
                        </p>
                        <p className="text-xs text-red-600">{f.reason}</p>
                      </div>
                    </div>
                    {f.retryable && (
                      <button
                        onClick={() => handleRetry(f.requestId)}
                        disabled={retryingIds.has(f.requestId)}
                        className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={retryingIds.has(f.requestId) ? 'animate-spin' : ''} />
                        重试
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/review')}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={14} /> 返回列表
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={24} className="text-yellow-500" />
              <h3 className="text-lg font-semibold text-slate-800">确认批量操作</h3>
            </div>
            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm font-medium text-yellow-800">
                确认批量{operation === 'approve' ? '通过' : '驳回'} {requestIds.length} 条申请？
              </p>
              <p className="mt-1 text-xs text-yellow-600">此操作不可撤销，请确认无误后执行</p>
            </div>
            <div className="mb-4 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3">
              <p className="mb-2 text-xs text-slate-500">涉及申请单：</p>
              <div className="flex flex-wrap gap-1">
                {requestIds.map((id) => (
                  <span key={id} className="inline-flex rounded bg-white px-2 py-0.5 text-xs text-slate-600 border border-slate-200">
                    {id.length > 12 ? id.slice(0, 12) + '...' : id}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={execute} disabled={batchLoading} className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                <AlertTriangle size={14} /> 确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
