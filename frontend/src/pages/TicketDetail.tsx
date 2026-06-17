import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Phone,
  Package,
  Send,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Timer,
} from 'lucide-react';
import { ticketApi } from '@/api/ticketApi';
import type { TicketDetail as TicketDetailType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { TextArea } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { TICKET_PRIORITY_OPTIONS } from '@/utils/constants';
import { formatTime, formatDuration, formatRelativeTime } from '@/utils/formatTime';

const agentOptions = [
  { value: '1', label: '张三' },
  { value: '2', label: '李四' },
  { value: '3', label: '王五' },
];

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateLevel, setEscalateLevel] = useState('2');
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await ticketApi.getTicket(id);
      if (response.success) {
        setTicket(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;
    try {
      const response = await ticketApi.addNote(id, noteContent, isInternal);
      if (response.success) {
        setNoteContent('');
        fetchTicket();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleAssign = async () => {
    if (!id || !selectedAgent) return;
    try {
      const response = await ticketApi.assignTicket(id, selectedAgent);
      if (response.success) {
        setShowAssignModal(false);
        setSelectedAgent('');
        fetchTicket();
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const handleEscalate = async () => {
    if (!id || !escalateReason) return;
    try {
      const response = await ticketApi.escalateTicket(id, escalateReason, parseInt(escalateLevel));
      if (response.success) {
        setShowEscalateModal(false);
        setEscalateReason('');
        setEscalateLevel('2');
        fetchTicket();
      }
    } catch (error) {
      console.error('Failed to escalate ticket:', error);
    }
  };

  const handleResolve = async () => {
    if (!id || !resolution) return;
    try {
      const response = await ticketApi.resolveTicket(id, resolution);
      if (response.success) {
        setShowResolveModal(false);
        setResolution('');
        fetchTicket();
      }
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900"
            onClick={() => navigate('/tickets')}
          >
            <ArrowLeft className="h-5 w-5" />
            返回工单列表
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-6 w-48 skeleton rounded mb-4" />
                <div className="h-4 skeleton rounded mb-2" />
                <div className="h-4 w-3/4 skeleton rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-5 w-24 skeleton rounded mb-4" />
                <div className="h-4 skeleton rounded mb-2" />
                <div className="h-4 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">工单不存在</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/tickets')}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
            onClick={() => navigate('/tickets')}
          >
            <ArrowLeft className="h-5 w-5" />
            返回工单列表
          </button>
          <div className="h-6 w-px bg-zinc-200" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900">{ticket.title}</h1>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              工单号：<span className="font-mono">{ticket.id}</span> ·
              创建于 {formatTime(ticket.createdAt)} ·
              {formatRelativeTime(ticket.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowAssignModal(true)}
          >
            分派
          </Button>
          <Button
            variant="secondary"
            leftIcon={<AlertTriangle className="h-4 w-4" />}
            onClick={() => setShowEscalateModal(true)}
          >
            升级
          </Button>
          <Button
            leftIcon={<CheckCircle className="h-4 w-4" />}
            onClick={() => setShowResolveModal(true)}
          >
            填写处理结果
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                    <User className="h-4 w-4" />
                    客户信息
                  </div>
                  <div className="font-medium text-zinc-900">{ticket.customerName}</div>
                  <div className="text-sm text-zinc-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {ticket.customerPhone}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                    <Package className="h-4 w-4" />
                    订单信息
                  </div>
                  <div className="font-medium text-zinc-900 font-mono">{ticket.orderNo}</div>
                  <div className="text-sm text-zinc-500">¥{ticket.orderAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">工单类型</div>
                  <Badge variant="primary">{ticket.category}</Badge>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">处理人</div>
                  <div className="font-medium text-zinc-900">
                    {ticket.assignee?.name || '未分派'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>工单描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {ticket.isEscalated && (
            <Card className="border-warning-300 bg-warning-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning-600" />
                  升级处理
                </CardTitle>
                <Badge variant="warning">已升级 · Lv.{ticket.escalationLevel}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-warning-800">
                  <span className="font-medium">升级原因：</span>
                  {ticket.escalationReason}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>处理记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {ticket.timeline.map((item, index) => (
                  <div key={item.id} className="relative pl-8 pb-6 last:pb-0">
                    {index !== ticket.timeline.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-zinc-200" />
                    )}
                    <div className="absolute left-0 top-1 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-600 rounded-full" />
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{item.action}</span>
                          <span className="text-sm text-zinc-500">
                            {item.user?.name || '系统'}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>添加备注</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TextArea
                  placeholder="输入备注内容..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-zinc-300 rounded"
                    />
                    <span className="text-sm text-zinc-600">内部备注（客户不可见）</span>
                  </label>
                  <Button
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={handleAddNote}
                    disabled={!noteContent.trim()}
                  >
                    提交备注
                  </Button>
                </div>
              </div>

              {ticket.notes.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <h4 className="text-sm font-medium text-zinc-700 mb-4">历史备注</h4>
                  <div className="space-y-4">
                    {ticket.notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-4 rounded-lg ${
                          note.isInternal ? 'bg-zinc-100' : 'bg-primary-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-zinc-900">
                              {note.user?.name || '系统'}
                            </span>
                            {note.isInternal && (
                              <Badge variant="secondary">内部</Badge>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400">
                            {formatTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary-600" />
                时长统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <div>
                  <p className="text-sm text-zinc-500">首次响应时长</p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {ticket.firstResponseTime ? formatDuration(ticket.firstResponseTime) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <div>
                  <p className="text-sm text-zinc-500">总耗时</p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {ticket.totalDuration ? formatDuration(ticket.totalDuration) : '-'}
                  </p>
                </div>
              </div>
              {ticket.nodeDurations?.map((node) => (
                <div key={node.node} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{node.node}</span>
                  <span className="text-sm font-medium text-zinc-700">
                    {formatDuration(node.duration)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="分派工单"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              取消
            </Button>
            <Button onClick={handleAssign} disabled={!selectedAgent}>
              确认分派
            </Button>
          </>
        }
      >
        <div>
          <p className="text-sm text-zinc-600 mb-4">选择处理客服：</p>
          <Select
            options={agentOptions}
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            placeholder="请选择客服"
            className="w-full"
          />
        </div>
      </Modal>

      <Modal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        title="升级工单"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEscalateModal(false)}>
              取消
            </Button>
            <Button onClick={handleEscalate} disabled={!escalateReason}>
              确认升级
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">升级级别</label>
            <Select
              options={[
                { value: '2', label: '二级 - 主管' },
                { value: '3', label: '三级 - 经理' },
              ]}
              value={escalateLevel}
              onChange={(e) => setEscalateLevel(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">升级原因</label>
            <TextArea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="请说明升级原因..."
              rows={4}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="填写处理结果"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
              取消
            </Button>
            <Button onClick={handleResolve} disabled={!resolution}>
              确认解决
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">处理结果</label>
          <TextArea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="请详细描述处理过程和结果..."
            rows={6}
          />
        </div>
      </Modal>
    </div>
  );
}
