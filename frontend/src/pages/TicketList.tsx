import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Users,
  ChevronDown,
  ArrowUpDown,
  MoreHorizontal,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { ticketApi } from '@/api/ticketApi';
import type { Ticket, TicketFilterParams, TicketStatus, TicketPriority, TicketCategory } from '@/types';
import { Card, CardContent } from '@/components/common/Card';
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
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Select } from '@/components/common/Select';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Modal } from '@/components/common/Modal';
import {
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  TICKET_CATEGORY_OPTIONS,
} from '@/utils/constants';
import { formatTime, formatRelativeTime } from '@/utils/formatTime';
import { Badge } from '@/components/common/Badge';

const agentOptions = [
  { value: '1', label: '张三' },
  { value: '2', label: '李四' },
  { value: '3', label: '王五' },
];

export default function TicketList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'assign' | 'priority' | 'export'>('assign');

  const [filters, setFilters] = useState<TicketFilterParams>({
    page: 1,
    pageSize: 10,
    status: (searchParams.get('status') as TicketStatus) || undefined,
    priority: undefined,
    category: undefined,
    assigneeId: undefined,
    search: searchParams.get('search') || undefined,
  });

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketApi.getTickets(filters);
      if (response.success) {
        setTickets(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tickets.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleFilterChange = (key: keyof TicketFilterParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDateRangeChange = (range: [string, string]) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      status: undefined,
      priority: undefined,
      category: undefined,
      assigneeId: undefined,
      search: undefined,
    });
    setSelectedIds([]);
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">工单管理</h1>
            <p className="text-zinc-500 mt-1">查看和管理所有售后工单</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">工单管理</h1>
          <p className="text-zinc-500 mt-1">查看和管理所有售后工单，共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              setBatchAction('export');
              setShowBatchModal(true);
            }}
          >
            批量导出
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tickets/create')}>
            创建工单
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-700 mb-1">关键词搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="搜索工单号、标题、客户..."
                  className="input pl-10"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-zinc-700 mb-1">工单状态</label>
              <Select
                options={TICKET_STATUS_OPTIONS}
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                placeholder="全部状态"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-zinc-700 mb-1">优先级</label>
              <Select
                options={TICKET_PRIORITY_OPTIONS}
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                placeholder="全部优先级"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-zinc-700 mb-1">工单类型</label>
              <Select
                options={TICKET_CATEGORY_OPTIONS}
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                placeholder="全部类型"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-zinc-700 mb-1">处理客服</label>
              <Select
                options={agentOptions}
                value={filters.assigneeId || ''}
                onChange={(e) => handleFilterChange('assigneeId', e.target.value || undefined)}
                placeholder="全部客服"
              />
            </div>
            <div className="w-72">
              <label className="block text-sm font-medium text-zinc-700 mb-1">创建时间</label>
              <DateRangePicker onChange={handleDateRangeChange} />
            </div>
            <Button variant="secondary" onClick={handleResetFilters}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary-600" />
            <span className="text-sm text-primary-700">
              已选择 <span className="font-semibold">{selectedIds.length}</span> 条工单
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => {
                setBatchAction('assign');
                setShowBatchModal(true);
              }}
            >
              批量分派
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<ArrowUpDown className="h-4 w-4" />}
              onClick={() => {
                setBatchAction('priority');
                setShowBatchModal(true);
              }}
            >
              调整优先级
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              取消选择
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-zinc-300 rounded"
                    checked={selectedIds.length === tickets.length && tickets.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>工单号</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>处理人</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-zinc-500">
                    暂无工单数据
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    selectable
                    selected={selectedIds.includes(ticket.id)}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 border-zinc-300 rounded"
                        checked={selectedIds.includes(ticket.id)}
                        onChange={(e) => handleSelect(ticket.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary-600">{ticket.id}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{ticket.title}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                            <Users className="h-3 w-3 text-primary-600" />
                          </div>
                          <span className="text-sm">{ticket.assignee.name}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary">未分派</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-600">{formatTime(ticket.createdAt)}</div>
                      <div className="text-xs text-zinc-400">{formatRelativeTime(ticket.createdAt)}</div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <TablePagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              total={total}
              pageSize={filters.pageSize || 10}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title={
          batchAction === 'assign'
            ? '批量分派'
            : batchAction === 'priority'
            ? '批量调整优先级'
            : '批量导出'
        }
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowBatchModal(false)}>
              取消
            </Button>
            <Button onClick={() => setShowBatchModal(false)}>确定</Button>
          </>
        }
      >
        {batchAction === 'assign' && (
          <div>
            <p className="text-sm text-zinc-600 mb-4">
              将选中的 {selectedIds.length} 条工单分派给：
            </p>
            <Select
              options={agentOptions}
              placeholder="选择客服"
              className="w-full"
            />
          </div>
        )}
        {batchAction === 'priority' && (
          <div>
            <p className="text-sm text-zinc-600 mb-4">
              将选中的 {selectedIds.length} 条工单优先级调整为：
            </p>
            <Select
              options={TICKET_PRIORITY_OPTIONS}
              placeholder="选择优先级"
              className="w-full"
            />
          </div>
        )}
        {batchAction === 'export' && (
          <div>
            <p className="text-sm text-zinc-600 mb-4">
              确定导出选中的 {selectedIds.length} 条工单吗？
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
