import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Download,
  Plus,
  Calendar,
  FileCheck,
  Target,
  Edit3,
  MoreHorizontal,
  Search,
  Filter,
} from 'lucide-react';
import { operationApi } from '@/api/operationApi';
import type { Ticket, QualityCheck, Improvement, TicketStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
  TableSkeleton,
} from '@/components/common/Table';
import { Select } from '@/components/common/Select';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { TextArea, Input } from '@/components/common/Input';
import { formatTime, formatDateShort } from '@/utils/formatTime';
import { TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from '@/utils/constants';

const agentOptions = [
  { value: '1', label: '张三' },
  { value: '2', label: '李四' },
  { value: '3', label: '王五' },
];

const resultOptions = [
  { value: 'resolved', label: '已解决' },
  { value: 'escalated', label: '已升级' },
  { value: 'closed', label: '已关闭' },
];

const qualityStatusOptions = [
  { value: 'excellent', label: '优秀' },
  { value: 'good', label: '良好' },
  { value: 'average', label: '一般' },
  { value: 'poor', label: '较差' },
];

interface OperationsProps {
  activeTab: 'service' | 'quality' | 'improvement';
}

export default function Operations({ activeTab }: OperationsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<'service' | 'quality' | 'improvement'>(activeTab);

  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (newTab: 'service' | 'quality' | 'improvement') => {
    navigate(`/operations/${newTab}`);
  };

  const tabs = [
    { key: 'service' as const, label: '客服工单', icon: <Users className="h-4 w-4" /> },
    { key: 'quality' as const, label: '会话质检', icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: 'improvement' as const, label: '改进动作', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">运营管理</h1>
        <p className="text-zinc-500 mt-1">管理客服工单、质检和改进动作</p>
      </div>

      <div className="border-b border-zinc-200">
        <nav className="flex gap-8">
          {tabs.map((item) => (
            <button
              key={item.key}
              className={
                `flex items-center gap-2 pb-4 border-b-2 text-sm font-medium transition-colors ${
                  tab === item.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`
              }
              onClick={() => handleTabChange(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'service' && <ServiceTicketsTab />}
      {tab === 'quality' && <QualityCheckTab />}
      {tab === 'improvement' && <ImprovementTab />}
    </div>
  );
}

function ServiceTicketsTab() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    agentId: string;
    startDate: string;
    endDate: string;
    status: TicketStatus | '';
    result: string;
    page: number;
    pageSize: number;
  }>({
    agentId: '',
    startDate: '',
    endDate: '',
    status: '',
    result: '',
    page: 1,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<[string, string]>(['', '']);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        ...filters,
        status: filters.status || undefined,
      };
      const response = await operationApi.getServiceTickets(apiFilters);
      if (response.success) {
        setTickets(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch service tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportDateRange[0] || !exportDateRange[1]) return;
    try {
      const checkResponse = await operationApi.checkDuplicateExport({
        type: 'service_tickets',
        filters: { agentId: filters.agentId, status: filters.status },
        startDate: exportDateRange[0],
        endDate: exportDateRange[1],
      });
      if (checkResponse.data.exists) {
        await operationApi.downloadExport(checkResponse.data.exportId!);
      } else {
        await operationApi.createExport({
          type: 'service_tickets',
          filters: { agentId: filters.agentId, status: filters.status },
          startDate: exportDateRange[0],
          endDate: exportDateRange[1],
        });
      }
      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <label className="block text-sm font-medium text-zinc-700 mb-1">客服</label>
              <Select
                options={agentOptions}
                value={filters.agentId}
                onChange={(e) => setFilters({ ...filters, agentId: e.target.value, page: 1 })}
                placeholder="全部客服"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-zinc-700 mb-1">状态</label>
              <Select
                options={TICKET_STATUS_OPTIONS}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as TicketStatus | '', page: 1 })}
                placeholder="全部状态"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-zinc-700 mb-1">处理结果</label>
              <Select
                options={resultOptions}
                value={filters.result}
                onChange={(e) => setFilters({ ...filters, result: e.target.value, page: 1 })}
                placeholder="全部结果"
              />
            </div>
            <div className="w-72">
              <label className="block text-sm font-medium text-zinc-700 mb-1">处理时间</label>
              <DateRangePicker
                value={[filters.startDate, filters.endDate]}
                onChange={(range) => setFilters({ ...filters, startDate: range[0], endDate: range[1], page: 1 })}
              />
            </div>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setShowExportModal(true)}
            >
              导出
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>工单号</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>处理客服</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>处理时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  selectable
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <TableCell className="font-mono text-sm text-primary-600">{ticket.id}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>{ticket.assignee?.name || '-'}</TableCell>
                  <TableCell>{formatDateShort(ticket.createdAt)}</TableCell>
                  <TableCell>{ticket.updatedAt ? formatDateShort(ticket.updatedAt) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <TablePagination
              currentPage={filters.page}
              totalPages={totalPages}
              total={total}
              pageSize={filters.pageSize}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出工单数据"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              取消
            </Button>
            <Button onClick={handleExport} disabled={!exportDateRange[0] || !exportDateRange[1]}>
              确认导出
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">导出时间范围</label>
            <DateRangePicker
              value={exportDateRange}
              onChange={setExportDateRange}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function QualityCheckTab() {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{ id: string; title: string } | null>(null);
  const [score, setScore] = useState(0);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchQualityChecks();
  }, [page]);

  const fetchQualityChecks = async () => {
    setLoading(true);
    try {
      const response = await operationApi.getQualityChecks(page, 10);
      if (response.success) {
        setChecks(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch quality checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheck = async () => {
    if (!selectedTicket || score <= 0) return;
    try {
      const response = await operationApi.createQualityCheck({
        ticketId: selectedTicket.id,
        score,
        comments,
        criteria: [
          { name: '服务态度', score, maxScore: 100 },
        ],
      });
      if (response.success) {
        setShowCheckModal(false);
        setSelectedTicket(null);
        setScore(0);
        setComments('');
        fetchQualityChecks();
      }
    } catch (error) {
      console.error('Failed to create quality check:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 70) return 'text-primary-600';
    if (score >= 60) return 'text-warning-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          leftIcon={<FileCheck className="h-4 w-4" />}
          onClick={() => setShowCheckModal(true)}
        >
          新增质检
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>质检编号</TableHead>
                <TableHead>关联工单</TableHead>
                <TableHead>质检人</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>评价</TableHead>
                <TableHead>质检时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.id}>
                  <TableCell className="font-mono text-sm">{check.id}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {check.ticket?.title || check.ticketId}
                  </TableCell>
                  <TableCell>{check.checker?.name || '-'}</TableCell>
                  <TableCell>
                    <span className={`text-lg font-bold ${getScoreColor(check.score)}`}>
                      {check.score}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={check.score >= 90 ? 'success' : check.score >= 70 ? 'primary' : 'warning'}>
                      {check.score >= 90 ? '优秀' : check.score >= 70 ? '良好' : check.score >= 60 ? '一般' : '较差'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateShort(check.createdAt)}</TableCell>
                  <TableCell>
                    <button className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={10}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        title="新增质检"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCheckModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateCheck} disabled={!selectedTicket || score <= 0}>
              确认提交
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">关联工单</label>
            <Input
              placeholder="输入工单号搜索"
              value={selectedTicket?.title || ''}
              onChange={(e) => setSelectedTicket({ id: e.target.value, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              评分：<span className={getScoreColor(score)}>{score}分</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">评价意见</label>
            <TextArea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="请输入评价意见..."
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ImprovementTab() {
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigneeId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchImprovements();
  }, [page]);

  const fetchImprovements = async () => {
    setLoading(true);
    try {
      const response = await operationApi.getImprovements(page, 10);
      if (response.success) {
        setImprovements(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch improvements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    try {
      const response = await operationApi.createImprovement(formData);
      if (response.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          assigneeId: '',
          startDate: '',
          endDate: '',
        });
        fetchImprovements();
      }
    } catch (error) {
      console.error('Failed to create improvement:', error);
    }
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    try {
      await operationApi.updateImprovement(id, { progress });
      fetchImprovements();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'pending': return '待开始';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          新建改进项
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>改进项</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {improvements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium text-zinc-900">{item.title}</div>
                      <div className="text-sm text-zinc-500 truncate">{item.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'secondary'}>
                      {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.assignee?.name || '-'}</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.progress >= 100 ? 'bg-success-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-600 w-10">{item.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status) as 'success' | 'primary' | 'warning' | 'secondary'}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.endDate || '-'}</TableCell>
                  <TableCell>
                    <button
                      className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
                      onClick={() => {
                        const newProgress = Math.min(item.progress + 10, 100);
                        handleUpdateProgress(item.id, newProgress);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={10}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建改进项"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title.trim()}>
              确认创建
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">改进项名称</label>
            <Input
              placeholder="请输入改进项名称"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">描述</label>
            <TextArea
              placeholder="请输入改进项描述..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">优先级</label>
              <Select
                options={[
                  { value: 'high', label: '高' },
                  { value: 'medium', label: '中' },
                  { value: 'low', label: '低' },
                ]}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">负责人</label>
              <Select
                options={agentOptions}
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                placeholder="请选择负责人"
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">开始日期</label>
              <input
                type="date"
                className="input w-full"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">截止日期</label>
              <input
                type="date"
                className="input w-full"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
