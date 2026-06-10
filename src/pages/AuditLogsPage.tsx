import { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Calendar,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  ArrowRight,
  Clock,
  Tag,
  Info,
  X,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { auditLogs } from '@/data/mockData';
import { AuditLog } from '@/types';
import { cn } from '@/lib/utils';

type OperationType = '新增' | '修改' | '删除' | '状态变更' | '登录' | string;

function getOperationIcon(type: OperationType) {
  switch (type) {
    case '新增':
      return <Plus className="w-4 h-4" />;
    case '修改':
      return <Edit3 className="w-4 h-4" />;
    case '删除':
      return <Trash2 className="w-4 h-4" />;
    case '状态变更':
      return <RefreshCw className="w-4 h-4" />;
    case '登录':
      return <User className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

function getOperationColor(type: OperationType): 'info' | 'warning' | 'danger' | 'success' | 'primary' {
  switch (type) {
    case '新增':
      return 'info';
    case '修改':
      return 'warning';
    case '删除':
      return 'danger';
    case '状态变更':
      return 'success';
    case '登录':
      return 'primary';
    default:
      return 'primary';
  }
}

function getOperationBgColor(type: OperationType): string {
  switch (type) {
    case '新增':
      return 'bg-blue-500';
    case '修改':
      return 'bg-accent-500';
    case '删除':
      return 'bg-red-500';
    case '状态变更':
      return 'bg-green-500';
    case '登录':
      return 'bg-primary-500';
    default:
      return 'bg-gray-500';
  }
}

function getOperationRingColor(type: OperationType): string {
  switch (type) {
    case '新增':
      return 'bg-blue-100';
    case '修改':
      return 'bg-accent-100';
    case '删除':
      return 'bg-red-100';
    case '状态变更':
      return 'bg-green-100';
    case '登录':
      return 'bg-primary-100';
    default:
      return 'bg-gray-100';
  }
}

interface LogItemProps {
  log: AuditLog;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

function LogItem({ log, isExpanded, onToggle, isLast }: LogItemProps) {
  const opType = log.operationType || '修改';
  const opColor = getOperationColor(opType);
  const opBgColor = getOperationBgColor(opType);
  const opRingColor = getOperationRingColor(opType);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDate(log.createdAt);

  const oldData = log.oldValue ? safeParseJson(log.oldValue) : null;
  const newData = log.newValue ? safeParseJson(log.newValue) : null;

  return (
    <div className="relative flex gap-4">
      {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />}

      <div
        className={cn(
          'relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 mt-0.5',
          opRingColor
        )}
      >
        <div
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-white',
            opBgColor
          )}
        >
          {getOperationIcon(opType)}
        </div>
      </div>

      <div className="flex-1 pb-6">
        <div
          className={cn(
            'bg-white rounded-xl shadow-card p-4 cursor-pointer transition-all hover:shadow-card-hover',
            isExpanded && 'ring-2 ring-primary-200'
          )}
          onClick={onToggle}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-900">
                  {log.operation}
                </h4>
                <StatusBadge status={opColor} text={opType} />
                <span className="text-xs text-gray-400">
                  {log.moduleName || '系统'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{log.description}</p>

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{log.userName}</span>
                  <span className="text-xs text-gray-400">
                    ({log.userRole})
                  </span>
                </div>
                {log.entityName && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {log.entityName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {log.durationMs?.toFixed(0)}ms
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-gray-400">{date}</p>
                <p className="text-sm font-medium text-gray-600">{time}</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oldData && Object.keys(oldData).length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      旧值
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(oldData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {newData && Object.keys(newData).length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      新值
                    </h5>
                    <div className="bg-primary-50 rounded-lg p-3 text-xs text-gray-600 font-mono max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(newData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {log.changedFields && (
                  <div className="md:col-span-2">
                    <h5 className="text-xs font-semibold text-gray-500 mb-2">
                      变更字段
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {log.changedFields.split(',').map((field, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full"
                        >
                          {field.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">IP 地址</p>
                    <p className="text-sm text-gray-600 font-mono">
                      {log.ipAddress || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">请求方式</p>
                    <p className="text-sm text-gray-600">
                      {log.httpMethod || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">状态码</p>
                    <p className="text-sm text-gray-600">{log.statusCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">追踪ID</p>
                    <p className="text-sm text-gray-600 font-mono truncate">
                      {log.traceId || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function safeParseJson(str: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

const entityTypes = [
  { value: '', label: '全部类型' },
  { value: 'Appointment', label: '预约' },
  { value: 'Payment', label: '支付' },
  { value: 'PartsShortage', label: '配件缺货' },
  { value: 'Customer', label: '客户' },
  { value: 'Technician', label: '技师' },
];

const operationTypes = [
  { value: '', label: '全部操作' },
  { value: '新增', label: '创建' },
  { value: '修改', label: '更新' },
  { value: '删除', label: '删除' },
  { value: '状态变更', label: '状态变更' },
  { value: '登录', label: '登录' },
];

export default function AuditLogsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>();
    auditLogs.forEach((log) => {
      if (log.userId && log.userName) {
        users.set(log.userId, log.userName);
      }
    });
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedEntity && log.entityName !== selectedEntity) {
        return false;
      }

      if (selectedOperation && log.operationType !== selectedOperation) {
        return false;
      }

      if (selectedUser && log.userId !== selectedUser) {
        return false;
      }

      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matches =
          log.operation?.toLowerCase().includes(keyword) ||
          log.description?.toLowerCase().includes(keyword) ||
          log.userName?.toLowerCase().includes(keyword) ||
          log.moduleName?.toLowerCase().includes(keyword);
        if (!matches) return false;
      }

      if (dateRange.start) {
        const logDate = new Date(log.createdAt);
        const startDate = new Date(dateRange.start);
        if (logDate < startDate) return false;
      }
      if (dateRange.end) {
        const logDate = new Date(log.createdAt);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) return false;
      }

      return true;
    });
  }, [searchKeyword, selectedEntity, selectedOperation, selectedUser, dateRange]);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedEntity('');
    setSelectedOperation('');
    setSelectedUser('');
    setDateRange({ start: '', end: '' });
  };

  const hasActiveFilters =
    searchKeyword || selectedEntity || selectedOperation || selectedUser || dateRange.start || dateRange.end;

  const operationStats = useMemo(() => {
    const stats: Record<string, number> = {};
    auditLogs.forEach((log) => {
      const type = log.operationType || '其他';
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  }, []);

  return (
    <AdminLayout title="状态变更日志" className="bg-gray-50">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {Object.entries(operationStats).map(([type, count]) => (
            <div
              key={type}
              className="bg-white rounded-xl shadow-card px-4 py-3 flex items-center gap-3"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-white',
                  getOperationBgColor(type)
                )}
              >
                {getOperationIcon(type)}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{type}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">筛选条件</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                清除筛选
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索关键词..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              {entityTypes.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>

            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              {operationTypes.map((ot) => (
                <option key={ot.value} value={ot.value}>
                  {ot.label}
                </option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">全部操作人</option>
              {uniqueUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                操作日志
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                共 {filteredLogs.length} 条记录
              </p>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无匹配的日志记录</p>
            </div>
          ) : (
            <div className="pt-2">
              {filteredLogs.map((log, index) => (
                <LogItem
                  key={log.id}
                  log={log}
                  isExpanded={expandedId === log.id}
                  onToggle={() => handleToggleExpand(log.id)}
                  isLast={index === filteredLogs.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
