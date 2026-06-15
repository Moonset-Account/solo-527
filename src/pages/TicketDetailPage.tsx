import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Bug,
  Settings,
  ArrowRight,
  MessageSquare,
  Plus,
  UserPlus,
  CheckCircle,
  XCircle,
  Server,
} from 'lucide-react';
import { useTicketStore } from '@/store/ticket.store';
import { useAuthStore } from '@/store/auth.store';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import TimelineNode from '@/components/TimelineNode';

const eventTypeOptions = [
  { value: 'Rollback', label: '回滚', icon: <RotateCcw className="w-4 h-4" /> },
  { value: 'VulnerabilityFix', label: '漏洞修复', icon: <Bug className="w-4 h-4" /> },
  { value: 'ConfigChange', label: '配置变更', icon: <Settings className="w-4 h-4" /> },
  { value: 'StatusChange', label: '状态变更', icon: <ArrowRight className="w-4 h-4" /> },
  { value: 'Comment', label: '评论', icon: <MessageSquare className="w-4 h-4" /> },
];

const eventIconMap: Record<string, React.ReactNode> = {
  Rollback: <RotateCcw className="w-4 h-4" />,
  VulnerabilityFix: <Bug className="w-4 h-4" />,
  ConfigChange: <Settings className="w-4 h-4" />,
  StatusChange: <ArrowRight className="w-4 h-4" />,
  Comment: <MessageSquare className="w-4 h-4" />,
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTicket, loading, fetchTicket, assignTicket, approveTicket, rejectTicket } = useTicketStore();
  const { user } = useAuthStore();

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [newEventType, setNewEventType] = useState('Comment');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventResult, setNewEventResult] = useState('success');
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => {
    if (id) fetchTicket(Number(id));
  }, [id, fetchTicket]);

  if (loading || !currentTicket) {
    return <div className="text-center py-20 text-[var(--color-text-secondary)]">加载中...</div>;
  }

  const ticket = currentTicket;
  const userRole = user?.role || '';
  const canAssign = ['admin', 'manager', 'engineer'].includes(userRole) && ticket.status === 'pending';
  const canApprove = ['admin', 'manager'].includes(userRole) && ticket.status === 'in-progress';
  const canReject = ['admin', 'manager'].includes(userRole) && ['in-progress', 'assigned'].includes(ticket.status);

  const handleAssign = async () => {
    if (!user) return;
    await assignTicket(ticket.id, user.id);
    fetchTicket(ticket.id);
  };

  const handleApprove = async () => {
    await approveTicket(ticket.id);
    fetchTicket(ticket.id);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectTicket(ticket.id, rejectReason);
    setShowRejectInput(false);
    setRejectReason('');
    fetchTicket(ticket.id);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{ticket.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {ticket.type === 'request' ? '申请' : '故障'}
                  </span>
                </div>
              </div>
              <span className="text-sm text-[var(--color-text-secondary)]">#{ticket.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-[var(--color-text-secondary)]">创建人：</span>
                <span>{ticket.creatorName}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">处理人：</span>
                <span>{ticket.assigneeName || '未分配'}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">创建时间：</span>
                <span>{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">更新时间：</span>
                <span>{new Date(ticket.updatedAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-4">
              <h4 className="text-sm font-semibold mb-2">描述</h4>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                {ticket.description || '暂无描述'}
              </p>
            </div>

            <div className="flex gap-3 mt-5 pt-4 border-t border-[var(--color-border)]">
              {canAssign && (
                <button onClick={handleAssign} className="btn-primary flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  分配给我
                </button>
              )}
              {canApprove && (
                <button onClick={handleApprove} className="btn-primary flex items-center gap-2 bg-[var(--color-success)] hover:bg-green-600">
                  <CheckCircle className="w-4 h-4" />
                  审批通过
                </button>
              )}
              {canReject && (
                <button onClick={() => setShowRejectInput(!showRejectInput)} className="btn-danger flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  驳回
                </button>
              )}
            </div>

            {showRejectInput && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">驳回原因</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入驳回原因..."
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleReject} className="btn-danger text-sm">确认驳回</button>
                  <button onClick={() => setShowRejectInput(false)} className="btn-secondary text-sm">取消</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {ticket.assetIds?.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Server className="w-4 h-4" />
                关联资产
              </h3>
              <div className="space-y-2">
                {ticket.assetIds.map((aid) => (
                  <div
                    key={aid}
                    className="text-sm text-[var(--color-primary)] cursor-pointer hover:underline"
                    onClick={() => navigate(`/assets/${aid}`)}
                  >
                    资产 #{aid}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>变更时间线</h3>
          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            添加事件
          </button>
        </div>

        {showEventForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-[var(--color-border)]">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">事件类型</label>
                <select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="select-field">
                  {eventTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">标题</label>
                <input className="input-field" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="事件标题" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">结果</label>
                <select value={newEventResult} onChange={(e) => setNewEventResult(e.target.value)} className="select-field">
                  <option value="success">成功</option>
                  <option value="failed">失败</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea className="input-field" value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} placeholder="事件描述..." />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-sm">添加</button>
              <button onClick={() => setShowEventForm(false)} className="btn-secondary text-sm">取消</button>
            </div>
          </div>
        )}

        {ticket.timeline && ticket.timeline.length > 0 ? (
          <div>
            {ticket.timeline.map((event, idx) => (
              <TimelineNode
                key={event.id}
                icon={eventIconMap[event.eventType] || <ArrowRight className="w-4 h-4" />}
                title={event.title}
                description={event.description}
                operatorName={event.operatorName}
                timestamp={event.createdAt}
                result={event.result === 'success' ? 'success' : event.result === 'failed' ? 'failed' : null}
                isLast={idx === ticket.timeline.length - 1}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] py-4">暂无变更记录</p>
        )}
      </div>

      {ticket.slaDetails && ticket.slaDetails.length > 0 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-6">
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>SLA 详情</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">阶段</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">开始时间</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">完成时间</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">耗时(分钟)</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">是否超时</th>
              </tr>
            </thead>
            <tbody>
              {ticket.slaDetails.map((sla) => (
                <tr key={sla.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">{sla.stage}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {sla.startedAt ? new Date(sla.startedAt).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {sla.completedAt ? new Date(sla.completedAt).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">{sla.durationMinutes ?? '-'}</td>
                  <td className="px-4 py-3">
                    {sla.isOverdue ? (
                      <span className="badge badge-danger">超时</span>
                    ) : (
                      <span className="badge badge-success">正常</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
