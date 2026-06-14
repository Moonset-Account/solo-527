import { useState } from 'react';
import { useApiQuery, apiPost } from '@/lib/hooks';
import { useAuthStore, canApproveReworkTimeout, roleLabels } from '@/store/auth';
import { formatDate } from '@/lib/format';
import { clsx } from 'clsx';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, Clock3, UserCheck, Search, Filter, CheckSquare } from 'lucide-react';

export default function ReworksPage() {
  const user = useAuthStore((s) => s.user);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [timeoutOnly, setTimeoutOnly] = useState('');
  const [keyword, setKeyword] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  const listQ = useApiQuery<any>(
    ['reworks-list', unresolvedOnly, timeoutOnly, keyword],
    '/reworks',
    { unresolved: unresolvedOnly ? 'true' : '', isTimeout: timeoutOnly || undefined, keyword, pageSize: 100 }
  );
  const riskQ = useApiQuery<any>('reworks-risk', '/reworks/timeout-risk');

  const items = listQ.data?.data || [];
  const risk = riskQ.data?.data;

  const handleApprove = async (id: number) => {
    if (!approveNote.trim()) return;
    await apiPost(`/reworks/${id}/approve-timeout`, { timeoutApprovalNote: approveNote });
    setApprovingId(null); setApproveNote('');
    listQ.refetch(); riskQ.refetch();
  };
  const handleResolve = async (id: number) => {
    if (!resolveNote.trim()) return;
    await apiPost(`/reworks/${id}/resolve`, { resolutionNote: resolveNote });
    setResolvingId(null); setResolveNote('');
    listQ.refetch(); riskQ.refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert size={26} className="text-amber-600" /> 返工与超时管理
        </h1>
        <p className="text-slate-500 text-sm mt-1">跟踪返工处理进度，超时审批留痕</p>
      </div>

      {risk && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center"><CheckSquare size={22} /></div>
              <div>
                <div className="text-xs text-slate-500">未解决总数</div>
                <div className="text-2xl font-bold text-slate-800 mt-0.5">{risk.summary?.totalUnresolved}</div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><CheckCircle2 size={22} /></div>
              <div>
                <div className="text-xs text-slate-500">处理中（安全）</div>
                <div className="text-2xl font-bold text-brand-700 mt-0.5">{risk.summary?.totalUnresolved - risk.summary?.warningCount - risk.summary?.criticalCount}</div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><Clock3 size={22} /></div>
              <div>
                <div className="text-xs text-slate-500">临近超时（4小时内）</div>
                <div className="text-2xl font-bold text-amber-700 mt-0.5">{risk.summary?.warningCount}</div>
              </div>
            </div>
          </div>
          <div className="card p-5 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle size={22} /></div>
              <div>
                <div className="text-xs text-slate-500">已超时（需审批）</div>
                <div className="text-2xl font-bold text-red-700 mt-0.5">{risk.summary?.criticalCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="card-header flex flex-wrap items-center gap-3 justify-between">
          <h2 className="font-semibold text-slate-800">返工记录列表</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9 w-64" placeholder="搜索工单号/原因..." value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
            <select className="input w-auto" value={timeoutOnly} onChange={e => setTimeoutOnly(e.target.value)}>
              <option value="">超时状态：全部</option>
              <option value="true">已超时</option>
              <option value="false">未超时</option>
            </select>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={unresolvedOnly} onChange={e => setUnresolvedOnly(e.target.checked)} className="rounded text-brand-600" />
              仅显示未解决
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr>
              <th>工单号 / 产品</th><th>工序</th><th>返工次数</th><th>返工类型</th>
              <th>原因</th><th>报告人</th><th>处理人</th><th>截止时间</th>
              <th>剩余时间</th><th>超时状态</th><th>解决状态</th><th>操作</th>
            </tr></thead>
            <tbody>
              {listQ.isLoading && <tr><td colSpan={12} className="py-8 text-center text-slate-400">加载中...</td></tr>}
              {!listQ.isLoading && items.length === 0 && <tr><td colSpan={12} className="py-8 text-center text-slate-400">暂无返工记录</td></tr>}
              {items.map((rw: any) => {
                const isResolved = !!rw.resolvedAt;
                return (
                  <tr key={rw.id} className={clsx(rw.isOverdue && !isResolved && 'bg-red-50/40')}>
                    <td>
                      <div className="font-semibold text-slate-800">{rw.workOrder?.orderNo}</div>
                      <div className="text-xs text-slate-500">{rw.workOrder?.productName}</div>
                    </td>
                    <td>
                      <div className="text-sm">{rw.process?.processName}</div>
                      {rw.process?.sequence !== undefined && <div className="text-xs text-slate-400">工序 #{rw.process.sequence}</div>}
                    </td>
                    <td><span className="badge bg-amber-100 text-amber-700">第 {rw.reworkCount} 次</span></td>
                    <td className="text-slate-600 text-sm">{rw.reworkType || '-'}</td>
                    <td className="max-w-xs text-sm text-slate-700">
                      <div className="truncate" title={rw.reworkReason}>{rw.reworkReason}</div>
                    </td>
                    <td className="text-sm">
                      <div>{rw.reportedByUser?.realName}</div>
                      <div className="text-[11px] text-slate-400">{formatDate(rw.reportedAt)}</div>
                    </td>
                    <td className="text-sm">{rw.assignedToUser?.realName || '-'}</td>
                    <td className="text-sm">{formatDate(rw.deadlineAt)}</td>
                    <td>
                      {isResolved ? <span className="text-slate-400">-</span> :
                        rw.isOverdue ? (
                          <span className="text-red-600 font-semibold text-sm flex items-center gap-1">
                            <AlertTriangle size={14} /> 超时
                          </span>
                        ) : (
                          <span className={clsx(
                            'font-medium text-sm',
                            (rw.hoursLeft ?? 999) < 4 ? 'text-amber-600' : 'text-slate-700'
                          )}>{rw.hoursLeft} 小时</span>
                        )}
                    </td>
                    <td>
                      {rw.isTimeout ? (
                        <span className="badge bg-red-100 text-red-700">已批准超时</span>
                      ) : rw.isOverdue && !isResolved ? (
                        <span className="badge bg-red-50 text-red-600 border border-red-200">待审批</span>
                      ) : (
                        <span className="badge bg-brand-100 text-brand-700">正常</span>
                      )}
                    </td>
                    <td>
                      {isResolved ? (
                        <div>
                          <span className="badge bg-brand-100 text-brand-700">已解决</span>
                          <div className="text-[11px] text-slate-400 mt-1">{formatDate(rw.resolvedAt)}</div>
                        </div>
                      ) : (
                        <span className="badge bg-amber-100 text-amber-700">处理中</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {!isResolved && rw.isOverdue && !rw.isTimeout && canApproveReworkTimeout(user) && (
                          <button className="btn-warning text-xs py-1.5" onClick={() => { setApprovingId(rw.id); setApproveNote(''); }}>
                            <Clock size={12} /> 批准超时
                          </button>
                        )}
                        {!isResolved && (
                          <button className="btn-primary text-xs py-1.5" onClick={() => { setResolvingId(rw.id); setResolveNote(''); }}>
                            <CheckCircle2 size={12} /> 标记解决
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {approvingId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setApprovingId(null)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Clock3 size={20} className="text-amber-600" /> 返工超时审批</h3>
            <p className="text-sm text-slate-500 mt-1">此操作将记入操作日志，请填写审批原因</p>
            <div className="mt-4">
              <label className="label">超时审批备注 <span className="text-red-500">*</span></label>
              <textarea rows={4} className="input" value={approveNote} onChange={e => setApproveNote(e.target.value)} placeholder="请详细说明超时原因及后续处理方案..." />
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button className="btn-secondary" onClick={() => setApprovingId(null)}>取消</button>
              <button className="btn-warning" disabled={!approveNote.trim()} onClick={() => handleApprove(approvingId)}>
                <UserCheck size={14} /> 确认批准
              </button>
            </div>
          </div>
        </div>
      )}

      {resolvingId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setResolvingId(null)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><CheckCircle2 size={20} className="text-brand-600" /> 返工完成标记</h3>
            <p className="text-sm text-slate-500 mt-1">请填写解决说明</p>
            <div className="mt-4">
              <label className="label">解决说明 <span className="text-red-500">*</span></label>
              <textarea rows={4} className="input" value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="请描述返工处理过程与结果..." />
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button className="btn-secondary" onClick={() => setResolvingId(null)}>取消</button>
              <button className="btn-primary" disabled={!resolveNote.trim()} onClick={() => handleResolve(resolvingId)}>
                <CheckCircle2 size={14} /> 确认解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
