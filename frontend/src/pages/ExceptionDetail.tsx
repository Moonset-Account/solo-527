import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import {
  formatDate, formatMoney, ExceptionStatusText, ExceptionTypeText, RefundStatusText, UserRole, userRoleText,
} from '../utils/constants';

export default function ExceptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [showConclusion, setShowConclusion] = useState(false);
  const [conclusionForm, setConclusionForm] = useState({ handlerConclusion: '', processingNotes: '' });
  const [showClose, setShowClose] = useState(false);
  const [closeForm, setCloseForm] = useState({
    closingExplanation: '', refundStatus: '', refundApprovedAmount: 0, refundActualAmount: 0,
  });
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [showRefund, setShowRefund] = useState(false);
  const [refundForm, setRefundForm] = useState({
    refundStatus: '', refundApprovedAmount: 0, refundActualAmount: 0, refundReason: '', refundEvidence: '',
  });
  const [showStatus, setShowStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const res: any = await api.get(`/exceptions/${id}`);
      setData(res);
    } catch (e) {}
  };

  const handleSubmitConclusion = async () => {
    if (!conclusionForm.handlerConclusion) { alert('请填写处理结论'); return; }
    try {
      await api.put(`/exceptions/${id}/conclusion`, conclusionForm);
      setShowConclusion(false);
      setConclusionForm({ handlerConclusion: '', processingNotes: '' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleClose = async () => {
    if (!closeForm.closingExplanation) { alert('关闭前请填写补充说明'); return; }
    try {
      await api.put(`/exceptions/${id}/close`, closeForm);
      setShowClose(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleFollowUp = async () => {
    if (!followUpNote) { alert('请输入追加备注'); return; }
    try {
      await api.post(`/exceptions/${id}/follow-up`, { note: followUpNote });
      setShowFollowUp(false);
      setFollowUpNote('');
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateRefund = async () => {
    try {
      await api.put(`/exceptions/${id}/refund`, refundForm);
      setShowRefund(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      await api.put(`/exceptions/${id}/status`, { status: newStatus });
      setShowStatus(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  if (!data) return <div className="py-20 text-center text-slate-400">加载中...</div>;

  const isHandler = data.handlerId === user?.id || user?.role === UserRole.ADMIN;
  const canWriteConclusion = isHandler && ['assigned', 'processing'].includes(data.status);
  const canClose = user?.role === UserRole.ADMIN && ['pending_review', 'resolved'].includes(data.status);
  const canFollowUp = isHandler && !['closed'].includes(data.status);
  const canUpdateRefund = data.type === 'refund' && user?.role === UserRole.ADMIN;
  const canUpdateStatus = isHandler && !['closed', 'resolved'].includes(data.status);

  const priorityMap: Record<string, { label: string; color: string }> = {
    low: { label: '低', color: 'bg-slate-100 text-slate-600' },
    medium: { label: '中', color: 'bg-blue-100 text-blue-700' },
    high: { label: '高', color: 'bg-orange-100 text-orange-700' },
    critical: { label: '紧急', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-primary-600">← 返回</button>
          <h2 className="text-xl font-semibold">异常详情 <span className="font-mono text-sm text-slate-500 ml-2">{data.exceptionNo}</span></h2>
          <span className={`px-3 py-1 rounded-lg text-xs ${priorityMap[data.priority]?.color}`}>
            {priorityMap[data.priority]?.label}
          </span>
        </div>
        <div className="flex gap-2">
          {canFollowUp && (
            <button onClick={() => setShowFollowUp(true)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">追加备注</button>
          )}
          {canWriteConclusion && (
            <button onClick={() => setShowConclusion(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">提交处理结论</button>
          )}
          {canUpdateStatus && (
            <button onClick={() => setShowStatus(true)}
              className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50">更新状态</button>
          )}
          {canUpdateRefund && (
            <button onClick={() => { setRefundForm({ refundStatus: data.refundStatus, refundApprovedAmount: data.refundApprovedAmount, refundActualAmount: data.refundActualAmount, refundReason: data.refundReason || '', refundEvidence: data.refundEvidence || '' }); setShowRefund(true); }}
              className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm hover:bg-orange-50">更新退款</button>
          )}
          {canClose && (
            <button onClick={() => setShowClose(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">关闭异常</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-400 mb-1">异常类型</div>
          <div className="text-lg font-bold text-slate-800">{ExceptionTypeText[data.type]}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-400 mb-1">当前状态</div>
          <div className="text-lg font-bold text-blue-600">{ExceptionStatusText[data.status]}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-400 mb-1">退款状态</div>
          <div className={`text-lg font-bold ${data.type === 'refund' ? 'text-orange-600' : 'text-slate-400'}`}>
            {data.type === 'refund' ? RefundStatusText[data.refundStatus] : '非退款类型'}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-400 mb-1">跟进次数</div>
          <div className="text-lg font-bold text-slate-800">{data.followUpCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-slate-800 mb-4">异常描述</h3>
            <h4 className="text-lg font-medium text-slate-800 mb-2">{data.title}</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>
          </div>

          {data.type === 'refund' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-slate-800 mb-4">退款信息</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">申请退款金额</div>
                  <div className="text-lg font-bold text-red-600">¥{formatMoney(data.refundRequestedAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">批准退款金额</div>
                  <div className="text-lg font-bold text-orange-600">¥{formatMoney(data.refundApprovedAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">实际退款金额</div>
                  <div className="text-lg font-bold text-green-600">¥{formatMoney(data.refundActualAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">退款状态</div>
                  <div className="text-lg font-bold text-slate-800">{RefundStatusText[data.refundStatus]}</div>
                </div>
              </div>
              {data.refundReason && (
                <div className="mt-4 bg-red-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-slate-700 mb-1">退款原因:</div>
                  <p className="text-sm text-slate-600">{data.refundReason}</p>
                </div>
              )}
              {data.refundEvidence && (
                <div className="mt-3 bg-amber-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-slate-700 mb-1">退款证据:</div>
                  <p className="text-sm text-slate-600">{data.refundEvidence}</p>
                </div>
              )}
            </div>
          )}

          {data.handlerConclusion && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-slate-800 mb-4">处理结论</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.handlerConclusion}</p>
              </div>
              {data.processingNotes && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-slate-700 mb-1">处理过程说明:</div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{data.processingNotes}</p>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span>处理人: {data.handler?.name || '-'}</span>
                <span>·</span>
                <span>{userRoleText(data.handler?.role)}</span>
                <span>·</span>
                <span>{data.resolvedAt ? formatDate(data.resolvedAt) : '-'}</span>
              </div>
            </div>
          )}

          {data.closingExplanation && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-slate-800 mb-4">关闭补充说明</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.closingExplanation}</p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span>关闭人: {data.closedBy || '-'}</span>
                <span>·</span>
                <span>{data.closedAt ? formatDate(data.closedAt) : '-'}</span>
              </div>
            </div>
          )}

          {data.attachments?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">关键附件 ({data.attachments.length})</h3>
              </div>
              <div className="space-y-2">
                {data.attachments.map((a: any) => (
                  <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border">
                    <span className="text-xl">
                      {a.category === 'image' ? '🖼️' : a.category === 'document' ? '📄' : '📎'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-700 truncate">{a.originalName}</div>
                      <div className="text-xs text-slate-400">{a.mimetype} · {(a.size / 1024).toFixed(1)}KB</div>
                    </div>
                    {a.isKey && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">关键</span>}
                    {a.remark && <span className="text-xs text-slate-400 truncate max-w-32">{a.remark}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 mb-4">基本信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">报告人</span>
                <span>{data.reporter?.name || data.reporterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">处理人</span>
                <span>{data.handler ? (
                  <span className="flex items-center gap-1">
                    <span>{data.handler.name}</span>
                    <span className="text-xs text-slate-400">({userRoleText(data.handler.role)})</span>
                  </span>
                ) : '未分配'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">关联订单</span>
                {data.order ? (
                  <Link to={`/orders/${data.orderId}`} className="text-primary-600 hover:underline">{data.order.orderNo}</Link>
                ) : <span>-</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">创建时间</span>
                <span>{formatDate(data.createdAt)}</span>
              </div>
              {data.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">分配时间</span>
                  <span>{formatDate(data.assignedAt)}</span>
                </div>
              )}
              {data.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">解决时间</span>
                  <span>{formatDate(data.resolvedAt)}</span>
                </div>
              )}
              {data.closedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">关闭时间</span>
                  <span>{formatDate(data.closedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 mb-4">处理时间线</h3>
            <div className="relative pl-4">
              {[
                { label: '创建', time: data.createdAt, person: data.reporter?.name || data.reporterName },
                data.assignedAt && { label: '分配', time: data.assignedAt, person: data.handler?.name },
                data.resolvedAt && { label: '解决', time: data.resolvedAt, person: data.handler?.name },
                data.closedAt && { label: '关闭', time: data.closedAt, person: '-' },
              ].filter(Boolean).map((item: any, i: number) => (
                <div key={i} className="relative pl-6 pb-4 timeline-line">
                  <div className="timeline-item">
                    <div className="text-sm font-medium text-slate-700">{item.label}</div>
                    <div className="text-xs text-slate-400">
                      <span>{item.person}</span>
                      <span className="mx-1">·</span>
                      <span>{formatDate(item.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showConclusion && (
        <Modal title="提交处理结论" onClose={() => setShowConclusion(false)} onConfirm={handleSubmitConclusion} confirmText="提交结论">
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-700">
              💡 知识博主处理完毕后必须填写结论，请详细说明处理结果和依据
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">处理结论 *</label>
              <textarea value={conclusionForm.handlerConclusion}
                onChange={(e) => setConclusionForm({ ...conclusionForm, handlerConclusion: e.target.value })}
                rows={5} className="w-full px-3 py-2 border rounded-lg outline-none resize-none"
                placeholder="请详细描述处理结果、判定依据、后续建议等..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">处理过程说明（选填）</label>
              <textarea value={conclusionForm.processingNotes}
                onChange={(e) => setConclusionForm({ ...conclusionForm, processingNotes: e.target.value })}
                rows={3} className="w-full px-3 py-2 border rounded-lg outline-none resize-none"
                placeholder="补充处理过程中的关键步骤..." />
            </div>
          </div>
        </Modal>
      )}

      {showClose && (
        <Modal title="关闭异常" onClose={() => setShowClose(false)} onConfirm={handleClose} confirmText="确认关闭">
          <div className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg text-xs text-red-700">
              ⚠️ 关闭前请填写补充说明，确保处理过程完整可追溯
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">关闭补充说明 *</label>
              <textarea value={closeForm.closingExplanation}
                onChange={(e) => setCloseForm({ ...closeForm, closingExplanation: e.target.value })}
                rows={4} className="w-full px-3 py-2 border rounded-lg outline-none resize-none"
                placeholder="请说明关闭原因、最终处理方案等..." />
            </div>
            {data.type === 'refund' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">退款最终状态</label>
                  <select value={closeForm.refundStatus}
                    onChange={(e) => setCloseForm({ ...closeForm, refundStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-none">
                    <option value="">不修改</option>
                    {Object.entries(RefundStatusText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">批准金额 ¥</label>
                    <input type="number" value={closeForm.refundApprovedAmount}
                      onChange={(e) => setCloseForm({ ...closeForm, refundApprovedAmount: +e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">实退金额 ¥</label>
                    <input type="number" value={closeForm.refundActualAmount}
                      onChange={(e) => setCloseForm({ ...closeForm, refundActualAmount: +e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg outline-none" />
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {showFollowUp && (
        <Modal title="追加备注" onClose={() => setShowFollowUp(false)} onConfirm={handleFollowUp} confirmText="添加">
          <div>
            <label className="block text-sm font-medium mb-1">备注内容 *</label>
            <textarea value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              rows={4} className="w-full px-3 py-2 border rounded-lg outline-none resize-none"
              placeholder="请输入追加的备注说明..." />
          </div>
        </Modal>
      )}

      {showRefund && (
        <Modal title="更新退款信息" onClose={() => setShowRefund(false)} onConfirm={handleUpdateRefund} confirmText="更新">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">退款状态</label>
              <select value={refundForm.refundStatus}
                onChange={(e) => setRefundForm({ ...refundForm, refundStatus: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none">
                {Object.entries(RefundStatusText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">批准金额 ¥</label>
                <input type="number" value={refundForm.refundApprovedAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundApprovedAmount: +e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">实际退款 ¥</label>
                <input type="number" value={refundForm.refundActualAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundActualAmount: +e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">退款原因</label>
              <textarea value={refundForm.refundReason}
                onChange={(e) => setRefundForm({ ...refundForm, refundReason: e.target.value })}
                rows={2} className="w-full px-3 py-2 border rounded-lg outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">退款证据</label>
              <textarea value={refundForm.refundEvidence}
                onChange={(e) => setRefundForm({ ...refundForm, refundEvidence: e.target.value })}
                rows={2} className="w-full px-3 py-2 border rounded-lg outline-none resize-none" />
            </div>
          </div>
        </Modal>
      )}

      {showStatus && (
        <Modal title="更新异常状态" onClose={() => setShowStatus(false)} onConfirm={handleUpdateStatus} confirmText="更新">
          <div>
            <label className="block text-sm font-medium mb-1">选择新状态</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg outline-none">
              <option value="">请选择</option>
              {Object.entries(ExceptionStatusText).filter(([k]) => k !== data.status).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, onConfirm, confirmText = '确认' }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
        <div className="p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-5 py-2 border rounded-lg hover:bg-slate-50">取消</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
