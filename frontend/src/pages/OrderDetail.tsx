import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import {
  formatMoney, formatDate, OrderStatusText, OrderStatusColor, UserRole,
  DeliveryTypeText, DeliveryStatusText, TimelineEventTypeText, userRoleText,
  SettlementStatusText,
} from '../utils/constants';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'timeline' | 'deliveries' | 'settlements' | 'exceptions'>('overview');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDelivery, setShowDelivery] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ deliveryNote: '', type: 'initial' });
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [satisfaction, setSatisfaction] = useState({ level: 5, feedback: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [showException, setShowException] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    type: 'refund', title: '', description: '', refundRequestedAmount: 0, refundReason: '',
  });

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const [o, d, t]: any = await Promise.all([
        api.get(`/orders/${id}`),
        api.get('/deliveries', { params: { orderId: id, pageSize: 100 } }),
        api.get(`/timelines/order/${id}`),
      ]);
      setData(o);
      setDeliveries(d.list || []);
      setTimelines(t);
      setSettlements(o.settlements || []);
      setExceptions(o.exceptions || []);
      setSelectedItems((o.items || []).filter((x: any) => x.isSelected).map((x: any) => x.id));
    } catch (e) {}
  };

  const handlePay = async () => {
    try { await api.put(`/orders/${id}/pay`, { paymentMethod }); setShowPayment(false); load(); }
    catch (e: any) { alert(e.message); }
  };

  const handleConfirmSelection = async () => {
    if (selectedItems.length === 0) { alert('请至少选择一张'); return; }
    try { await api.put(`/orders/${id}/confirm-selection`, { selectedItemIds: selectedItems }); load(); }
    catch (e: any) { alert(e.message); }
  };

  const handleDownload = async (items: any[]) => {
    const ids = items.filter((x) => x.isSelected).map((x) => x.id);
    if (ids.length === 0) { alert('没有可下载的项目'); return; }
    try {
      const res: any = await api.put(`/orders/${id}/download`, { itemIds: ids });
      (res.items || []).forEach((item: any) => {
        if (item.attachments && item.attachments.length > 0) {
          item.attachments.forEach((att: any) => {
            const link = document.createElement('a');
            link.href = att.fileUrl;
            link.download = att.originalName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
        } else if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank');
        }
      });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleSubmitDelivery = async () => {
    try {
      await api.post('/deliveries', { orderId: id, ...deliveryForm });
      setShowDelivery(false);
      setDeliveryForm({ deliveryNote: '', type: 'initial' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleReview = async (deliveryId: string, accepted: boolean) => {
    const feedback = prompt(accepted ? '验收通过备注（选填）：' : '请说明退回原因：') || '';
    try {
      await api.put(`/deliveries/${deliveryId}/review`, {
        status: accepted ? 'accepted' : 'rejected',
        clientFeedback: feedback,
      });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleSatisfaction = async () => {
    try {
      await api.put(`/orders/${id}/satisfaction`, satisfaction);
      setShowSatisfaction(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleException = async () => {
    try {
      await api.post('/exceptions', { orderId: id, ...exceptionForm });
      setShowException(false);
      setExceptionForm({ type: 'refund', title: '', description: '', refundRequestedAmount: 0, refundReason: '' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  if (!data) return <div className="py-20 text-center text-slate-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-primary-600">← 返回</button>
          <h2 className="text-xl font-semibold">订单详情 <span className="font-mono text-sm text-slate-500 ml-2">{data.orderNo}</span></h2>
          <span className={`px-3 py-1 rounded-lg text-xs ${OrderStatusColor[data.status] || ''}`}>
            {OrderStatusText[data.status]}
          </span>
        </div>
        <div className="flex gap-2">
          {data.status === 'pending_payment' && user?.role === UserRole.CLIENT && (
            <button onClick={() => setShowPayment(true)} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm">立即付款</button>
          )}
          {['paid', 'selecting'].includes(data.status) && user?.role === UserRole.CLIENT && (
            <button onClick={handleConfirmSelection} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">确认选片</button>
          )}
          {['selected_confirmed', 'revising', 'delivering'].includes(data.status) && (user?.role === UserRole.PHOTOGRAPHER || user?.role === UserRole.ADMIN) && (
            <button onClick={() => setShowDelivery(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">提交交付</button>
          )}
          {['delivered', 'revising', 'completed'].includes(data.status) && user?.role === UserRole.CLIENT && !data.satisfactionLevel && (
            <button onClick={() => setShowSatisfaction(true)} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm">评价订单</button>
          )}
          {user?.role !== UserRole.BLOGGER && (
            <button onClick={() => setShowException(true)} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">提交异常</button>
          )}
          {data.status !== 'completed' && (['delivered'].includes(data.status) || data.satisfactionLevel) && user?.role === UserRole.ADMIN && (
            <button onClick={async () => { if (confirm('确认完成订单？')) { await api.put(`/orders/${id}/status`, { status: 'completed' }); load(); } }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">标记完成</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-400 mb-1">订单金额</div>
          <div className="text-2xl font-bold text-amber-600">¥{formatMoney(data.finalAmount)}</div>
          <div className="text-xs text-slate-500 mt-1">摄影师收入 ¥{formatMoney(data.photographerIncome)} · 平台收入 ¥{formatMoney(data.platformIncome)}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-400 mb-1">修改进度</div>
          <div className="text-2xl font-bold text-primary-600">{data.currentRevisionRound || 0} / {data.maxRevisionRounds}</div>
          <div className="text-xs text-slate-500 mt-1">当前轮次 / 最大轮次</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-400 mb-1">满意度</div>
          <div className="text-2xl font-bold text-amber-500">
            {data.satisfactionLevel ? '⭐'.repeat(Number(data.satisfactionLevel)) : '未评价'}
          </div>
          {data.satisfactionFeedback && <div className="text-xs text-slate-500 mt-1 line-clamp-1">{data.satisfactionFeedback}</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="flex border-b overflow-x-auto">
          {[
            { k: 'overview', l: '订单概览' },
            { k: 'deliveries', l: `交付记录 (${deliveries.length})` },
            { k: 'timeline', l: '时间线' },
            { k: 'settlements', l: `结算 (${settlements.length})` },
            { k: 'exceptions', l: `异常 (${exceptions.length})` },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`px-5 py-3 text-sm whitespace-nowrap transition ${
                tab === t.k ? 'border-b-2 border-primary-600 text-primary-600 font-medium' : 'text-slate-500 hover:text-slate-800'
              }`}>{t.l}</button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-slate-700">订单信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex"><span className="text-slate-500 w-24">订单号:</span><span className="font-mono">{data.orderNo}</span></div>
                    <div className="flex"><span className="text-slate-500 w-24">客户:</span><span>{data.client?.name}</span></div>
                    <div className="flex"><span className="text-slate-500 w-24">摄影师:</span><span>{data.photographer?.name}</span></div>
                    <div className="flex"><span className="text-slate-500 w-24">创建时间:</span><span>{formatDate(data.createdAt)}</span></div>
                    <div className="flex"><span className="text-slate-500 w-24">支付方式:</span><span>{data.paymentMethod || '待支付'}</span></div>
                    <div className="flex"><span className="text-slate-500 w-24">支付时间:</span><span>{data.paidAt ? formatDate(data.paidAt) : '-'}</span></div>
                    <div className="flex"><span className="text-slate-500 w-24">完成时间:</span><span>{data.completedAt ? formatDate(data.completedAt) : '-'}</span></div>
                    {data.remark && <div className="flex"><span className="text-slate-500 w-24">备注:</span><span>{data.remark}</span></div>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-slate-700">金额明细</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">订单总额</span><span>¥{formatMoney(data.totalAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">优惠金额</span><span className="text-green-600">- ¥{formatMoney(data.discountAmount)}</span></div>
                    <div className="flex justify-between border-t pt-2 font-semibold"><span>实付金额</span><span className="text-amber-600">¥{formatMoney(data.finalAmount)}</span></div>
                    <div className="flex justify-between pt-2"><span className="text-slate-500">分成比例</span><span>摄影师 {((data.photographerIncome / (data.finalAmount || 1)) * 100).toFixed(0)}% · 平台 {((data.platformIncome / (data.finalAmount || 1)) * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-700">选片清单</h4>
                  {['paid', 'selecting'].includes(data.status) && user?.role === UserRole.CLIENT && (
                    <span className="text-xs text-slate-400">共 {data.items?.length || 0} 张 · 已选 {selectedItems.length} 张</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {data.items?.map((item: any) => (
                    <label key={item.id} className={`relative rounded-lg border-2 p-2 cursor-pointer transition ${
                      item.isSelected || selectedItems.includes(item.id) ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300'
                    } ${['paid', 'selecting'].includes(data.status) && user?.role === UserRole.CLIENT ? '' : 'cursor-default'}`}>
                      {['paid', 'selecting'].includes(data.status) && user?.role === UserRole.CLIENT && (
                        <input type="checkbox" className="absolute top-3 right-3 w-4 h-4 z-10"
                          checked={item.isSelected || selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedItems([...selectedItems, item.id]);
                            else setSelectedItems(selectedItems.filter((x) => x !== item.id));
                          }} />
                      )}
                      <div className="aspect-square rounded-md bg-slate-100 overflow-hidden mb-2">
                        <img src={item.materialCoverUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=photo&image_size=square'}
                          alt={item.materialTitle} className="w-full h-full object-cover"
                          onError={(e: any) => { e.target.style.opacity = 0.2; }} />
                      </div>
                      <div className="text-sm truncate">{item.materialTitle}</div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{item.licenseType}</span>
                        <span>¥{formatMoney(item.subtotal)}</span>
                      </div>
                      {item.downloaded && <span className="absolute bottom-2 left-2 text-xs bg-green-100 text-green-700 px-2 rounded">已下载</span>}
                    </label>
                  ))}
                </div>
                {user?.role === UserRole.CLIENT && ['delivered', 'completed', 'revising'].includes(data.status) && (
                  <div className="mt-4 text-right">
                    <button onClick={() => handleDownload(data.items)}
                      className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                      下载已选成片 ({data.items?.filter((x: any) => x.isSelected).length || 0})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'deliveries' && (
            <div className="space-y-4">
              {deliveries.length === 0 && <div className="text-center text-slate-400 py-12">暂无交付记录</div>}
              {deliveries.map((d) => (
                <div key={d.id} className="border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                        {DeliveryTypeText[d.type]} · 第{d.revisionRound}轮
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        d.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{DeliveryStatusText[d.status]}</span>
                      <span className="text-sm text-slate-500">提交人: {d.submitter?.name}</span>
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(d.submittedAt || d.createdAt, 'MM-DD HH:mm')}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 mb-3 text-sm">
                    <div className="font-medium text-slate-700 mb-1">交付说明:</div>
                    <p className="text-slate-600">{d.deliveryNote}</p>
                  </div>
                  {d.clientFeedback && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm">
                      <div className="font-medium text-slate-700 mb-1">客户反馈 ({d.reviewer?.name}):</div>
                      <p className="text-slate-600">{d.clientFeedback}</p>
                    </div>
                  )}
                  {d.attachments?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-500 mb-2">附件:</div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {d.attachments.map((a: any) => (
                          <a key={a.id} href={a.fileUrl} target="_blank"
                            className="aspect-square bg-slate-100 rounded overflow-hidden">
                            <img src={a.fileUrl} alt={a.originalName} className="w-full h-full object-cover"
                              onError={(e: any) => { e.target.style.display = 'none'; }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {d.status === 'submitted' && user?.role === UserRole.CLIENT && data.clientId === user.id && (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleReview(d.id, false)}
                        className="px-4 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm">退回修改</button>
                      <button onClick={() => handleReview(d.id, true)}
                        className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm">验收通过</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'timeline' && (
            <div className="relative pl-5">
              {timelines.length === 0 && deliveries.length === 0 && settlements.length === 0 && (
                <div className="text-center text-slate-400 py-12 -ml-5">暂无时间线记录</div>
              )}
              {[
                ...timelines.map((t) => ({
                  id: t.id,
                  type: 'timeline' as const,
                  eventType: t.eventType,
                  title: t.title,
                  description: t.description,
                  operatorName: t.operatorName,
                  operatorRole: t.operatorRole,
                  createdAt: t.createdAt,
                  metadata: t.metadata,
                  relatedEntityType: t.relatedEntityType,
                  relatedEntityId: t.relatedEntityId,
                })),
                ...deliveries.map((d) => ({
                  id: d.id,
                  type: 'delivery' as const,
                  eventType: d.type === 'revision' ? 'revision_started' : d.status === 'accepted' ? 'delivery_accepted' : 'delivery_submitted',
                  title: `${DeliveryTypeText[d.type]}交付 · 第${d.revisionRound}轮`,
                  description: d.deliveryNote,
                  operatorName: d.submitter?.name || '-',
                  operatorRole: d.submitter?.role || 'photographer',
                  createdAt: d.submittedAt || d.createdAt,
                  metadata: {
                    revisionRound: d.revisionRound,
                    deliveryType: d.type,
                    deliveryStatus: d.status,
                    clientFeedback: d.clientFeedback,
                    reviewerName: d.reviewer?.name,
                    attachments: d.attachments,
                    attachmentCount: d.attachments?.length || 0,
                    remark: d.deliveryNote,
                  },
                  relatedEntityType: 'delivery',
                  relatedEntityId: d.id,
                })),
                ...settlements.map((s) => ({
                  id: s.id,
                  type: 'settlement' as const,
                  eventType: s.status === 'paid' ? 'settlement_paid' : 'settlement_created',
                  title: `结算${s.status === 'paid' ? '已付款' : '已创建'}`,
                  description: `${s.settlementNo} · 周期${s.settlementPeriod} · 净收入¥${formatMoney(s.netAmount)}`,
                  operatorName: s.status === 'paid' ? (s.paidBy ? '系统' : '-') : (s.confirmedBy ? '系统' : '-'),
                  operatorRole: 'admin',
                  createdAt: s.status === 'paid' ? s.paidAt : s.confirmedAt || s.createdAt,
                  metadata: { settlementNo: s.settlementNo, netAmount: s.netAmount, status: s.status },
                  relatedEntityType: 'settlement',
                  relatedEntityId: s.id,
                })),
              ]
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((item) => {
                  const isDelivery = item.type === 'delivery';
                  const isSettlement = item.type === 'settlement';
                  const dotColor = isSettlement
                    ? 'bg-amber-500 border-amber-200'
                    : isDelivery
                      ? 'bg-green-500 border-green-200'
                      : 'bg-primary-500 border-primary-200';
                  const badgeColor = isSettlement
                    ? 'bg-amber-100 text-amber-700'
                    : isDelivery
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500';

                  return (
                    <div key={`${item.type}-${item.id}`} className="relative pl-6 pb-6 timeline-line">
                      <div className="timeline-item" style={{ '--dot-color': dotColor } as any}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-slate-800">{item.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${badgeColor}`}>
                                {isSettlement ? '💰 结算' : isDelivery ? '📦 交付' : TimelineEventTypeText[item.eventType] || item.eventType}
                              </span>
                            </div>
                            {item.description && <p className="text-sm text-slate-600 mb-2">{item.description}</p>}
                            {item.metadata?.remark && item.metadata.remark !== item.description && (
                              <div className="text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded mb-2">
                                📝 备注: {item.metadata.remark}
                              </div>
                            )}
                            {isDelivery && item.metadata?.clientFeedback && (
                              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded mb-2">
                                客户反馈: {item.metadata.clientFeedback} — {item.metadata.reviewerName || ''}
                              </div>
                            )}
                            {isSettlement && item.metadata && (
                              <div className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded mb-2">
                                净收入: ¥{formatMoney(item.metadata.netAmount)} · 状态: {SettlementStatusText[item.metadata.status]}
                              </div>
                            )}
                            {item.metadata?.attachments && item.metadata.attachments.length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs text-slate-500 mb-1">📎 附件 ({item.metadata.attachments.length})</div>
                                <div className="space-y-1">
                                  {item.metadata.attachments.map((att: any, idx: number) => (
                                    <div key={att.id || idx} className="flex items-center gap-2 text-xs">
                                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-primary-600 hover:underline truncate">
                                        {att.originalName || `附件${idx + 1}`}
                                      </a>
                                      {att.size && <span className="text-slate-400">{(att.size / 1024).toFixed(1)} KB</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="font-medium text-slate-500">{item.operatorName}</span>
                              <span>·</span>
                              <span>{userRoleText(item.operatorRole)}</span>
                              <span>·</span>
                              <span>{formatDate(item.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {tab === 'settlements' && (
            <div>
              {settlements.length === 0 ? <div className="text-center text-slate-400 py-12">暂无结算记录</div> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="pb-2 font-medium">结算单号</th>
                      <th className="pb-2 font-medium">周期</th>
                      <th className="pb-2 font-medium">订单金额</th>
                      <th className="pb-2 font-medium">净收入</th>
                      <th className="pb-2 font-medium">状态</th>
                      <th className="pb-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="py-3 font-mono text-xs">{s.settlementNo}</td>
                        <td className="py-3">{s.settlementPeriod}</td>
                        <td className="py-3">¥{formatMoney(s.orderAmount)}</td>
                        <td className="py-3 font-medium text-green-600">¥{formatMoney(s.netAmount)}</td>
                        <td className="py-3"><span className="text-xs">{SettlementStatusText[s.status]}</span></td>
                        <td className="py-3">
                          <Link to="/settlements" className="text-primary-600 hover:underline text-xs">查看</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'exceptions' && (
            <div>
              {exceptions.length === 0 ? <div className="text-center text-slate-400 py-12">暂无异常记录</div> : (
                <div className="space-y-3">
                  {exceptions.map((e) => (
                    <Link key={e.id} to={`/exceptions/${e.id}`}
                      className="block p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{e.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{e.exceptionNo} · {formatDate(e.createdAt)}</div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">
                          {e.type === 'refund' ? `退款·${e.refundStatus}` : e.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{e.description}</p>
                      {e.handler && <div className="text-xs text-slate-400 mt-2">处理人: {e.handler.name}</div>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <Modal title="订单支付" onClose={() => setShowPayment(false)} onConfirm={handlePay} confirmText="确认支付">
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-xs text-slate-500">应付金额</div>
              <div className="text-3xl font-bold text-amber-600 mt-1">¥{formatMoney(data.finalAmount)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">支付方式</label>
              <div className="grid grid-cols-4 gap-3">
                {[{ k: 'wechat', l: '微信', i: '💚' }, { k: 'alipay', l: '支付宝', i: '💙' },
                  { k: 'bank', l: '银行卡', i: '🏦' }, { k: 'credit', l: '信用', i: '💳' }].map((p) => (
                  <button key={p.k} onClick={() => setPaymentMethod(p.k)}
                    className={`p-4 border-2 rounded-xl text-center transition ${
                      paymentMethod === p.k ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300'
                    }`}>
                    <div className="text-2xl mb-1">{p.i}</div>
                    <div className="text-sm">{p.l}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDelivery && (
        <Modal title="提交交付" onClose={() => setShowDelivery(false)} onConfirm={handleSubmitDelivery} confirmText="提交">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">交付类型</label>
              <select value={deliveryForm.type} onChange={(e) => setDeliveryForm({ ...deliveryForm, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="initial">初版交付</option>
                <option value="revision">修改版（轮次+1）</option>
                <option value="supplement">补充材料</option>
                <option value="final">终版</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">交付说明 *</label>
              <textarea value={deliveryForm.deliveryNote}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryNote: e.target.value })}
                rows={5} className="w-full px-3 py-2 border rounded-lg outline-none resize-none"
                placeholder="请说明本次交付内容、修改点等详情..." />
            </div>
            <div className="text-xs text-slate-400 bg-blue-50 p-3 rounded-lg">
              💡 提示：附件可以通过接口 /attachments/upload-multiple 上传后，将 attachmentIds 传入创建交付接口
            </div>
          </div>
        </Modal>
      )}

      {showSatisfaction && (
        <Modal title="订单评价" onClose={() => setShowSatisfaction(false)} onConfirm={handleSatisfaction} confirmText="提交评价">
          <div className="space-y-5">
            <div>
              <div className="text-sm font-medium mb-2">请打分</div>
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setSatisfaction({ ...satisfaction, level: n })}
                    className={`text-5xl transition ${satisfaction.level >= n ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>
                    ★
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-slate-500 mt-1">
                {['', '很不满意', '不满意', '一般', '满意', '非常满意'][satisfaction.level]}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">评价内容（选填）</label>
              <textarea value={satisfaction.feedback}
                onChange={(e) => setSatisfaction({ ...satisfaction, feedback: e.target.value })}
                rows={4} className="w-full px-3 py-2 border rounded-lg outline-none resize-none"
                placeholder="分享您的体验..." />
            </div>
          </div>
        </Modal>
      )}

      {showException && (
        <Modal title="提交异常" onClose={() => setShowException(false)} onConfirm={handleException} confirmText="提交">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">异常类型</label>
              <select value={exceptionForm.type} onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="refund">退款异常</option>
                <option value="delivery_delay">交付延迟</option>
                <option value="quality_dispute">质量纠纷</option>
                <option value="copyright">版权问题</option>
                <option value="license_dispute">授权纠纷</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">标题 *</label>
              <input value={exceptionForm.title}
                onChange={(e) => setExceptionForm({ ...exceptionForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="简要描述问题" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">详细描述 *</label>
              <textarea value={exceptionForm.description}
                onChange={(e) => setExceptionForm({ ...exceptionForm, description: e.target.value })}
                rows={4} className="w-full px-3 py-2 border rounded-lg outline-none resize-none" />
            </div>
            {exceptionForm.type === 'refund' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">申请退款金额 ¥</label>
                  <input type="number" value={exceptionForm.refundRequestedAmount}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, refundRequestedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg outline-none" max={data.finalAmount} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">退款原因</label>
                  <textarea value={exceptionForm.refundReason}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, refundReason: e.target.value })}
                    rows={2} className="w-full px-3 py-2 border rounded-lg outline-none resize-none" />
                </div>
              </>
            )}
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
