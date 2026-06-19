'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Clock,
  FileText,
  Filter,
  Calendar,
  User,
  Search,
  TrendingUp,
  Gauge,
  BarChart3,
  Clock3,
  FileCheck,
  Upload,
} from 'lucide-react';
import { getDataService } from '@/lib/data-service';
import { getOperationTypeLabel, formatDate, cn } from '@/lib/utils';
import { OperationType, UserRole } from '@prisma/client';

export default function OperationLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [efficiencyStats, setEfficiencyStats] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'logs' | 'efficiency'>('logs');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      const service = await getDataService();
      const [logsData, usersData, efficiencyData, contractsData] = await Promise.all([
        service.getOperationLogs(),
        service.getUsers(),
        service.getEfficiencyStats(),
        service.getContracts(),
      ]);
      setLogs(logsData);
      setUsers(usersData);
      setEfficiencyStats(efficiencyData);
      setContracts(contractsData);
      setLoading(false);
    }
    loadData();
  }, []);

  const userMap = new Map(users.map(u => [u.id, u]));
  const contractMap = new Map(contracts.map(c => [c.id, c]));

  let filteredLogs = logs;

  if (filterType !== 'all') {
    filteredLogs = filteredLogs.filter(l => l.operationType === filterType);
  }

  if (filterUser !== 'all') {
    filteredLogs = filteredLogs.filter(l => l.userId === filterUser);
  }

  if (searchTerm) {
    filteredLogs = filteredLogs.filter(l =>
      l.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const operationTypes = Object.values(OperationType);

  const totalReviews = efficiencyStats.reduce((sum: number, s: any) => sum + s.reviewCount, 0);
  const totalUploads = efficiencyStats.reduce((sum: number, s: any) => sum + s.uploadCount, 0);
  const totalStamps = efficiencyStats.reduce((sum: number, s: any) => sum + s.stampCount, 0);
  const avgReviewTime = efficiencyStats.filter((s: any) => s.avgReviewTime).length > 0
    ? Math.round(
        efficiencyStats.filter((s: any) => s.avgReviewTime).reduce((sum: number, s: any) => sum + (s.avgReviewTime || 0), 0) /
        efficiencyStats.filter((s: any) => s.avgReviewTime).length
      )
    : 0;

  function getTypeIcon(type: string) {
    switch (type) {
      case OperationType.UPLOAD:
        return <Upload className="h-4 w-4" />;
      case OperationType.VIEW:
        return <FileText className="h-4 w-4" />;
      case OperationType.REVIEW:
        return <FileCheck className="h-4 w-4" />;
      case OperationType.APPROVE:
      case OperationType.REJECT:
        return <Gauge className="h-4 w-4" />;
      case OperationType.DOWNLOAD:
        return <FileCheck className="h-4 w-4" />;
      case OperationType.STAMP:
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  }

  function getTypeBadgeClass(type: string) {
    switch (type) {
      case OperationType.UPLOAD:
      case OperationType.DOWNLOAD:
        return 'badge-primary';
      case OperationType.REVIEW:
        return 'badge-warning';
      case OperationType.APPROVE:
        return 'badge-success';
      case OperationType.REJECT:
      case OperationType.RISK_FLAG:
        return 'badge-danger';
      case OperationType.UPDATE_RULE:
      case OperationType.UPDATE_PERMISSION:
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">操作留痕与效率追踪</h1>
            <p className="mt-1 text-sm text-gray-500">查看系统操作记录和审阅效率数据分析</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">操作留痕与效率追踪</h1>
          <p className="mt-1 text-sm text-gray-500">查看系统操作记录和审阅效率数据分析</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总操作记录</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <History className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">审阅总数</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalReviews}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均审阅时间</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{avgReviewTime}<span className="text-sm font-normal">分钟</span></p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">盖章完成</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalStamps}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4">
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'logs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <History className="h-4 w-4" />
              操作日志
            </button>
            <button
              onClick={() => setActiveTab('efficiency')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'efficiency'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              效率分析
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索操作描述..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="input w-40"
                  >
                    <option value="all">全部类型</option>
                    {operationTypes.map((type) => (
                      <option key={type} value={type}>
                        {getOperationTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="input w-40"
                  >
                    <option value="all">全部用户</option>
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200">
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                      <History className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500">暂无操作记录</p>
                    </div>
                  ) : (
                    filteredLogs.map((log: any) => {
                      const user = userMap.get(log.userId) || log.user;
                      const contract = log.contractId
                        ? contractMap.get(log.contractId) || log.contract
                        : null;

                      return (
                        <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                          <div className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0',
                            log.operationType === OperationType.APPROVE ? 'bg-success-100 text-success-600' :
                            log.operationType === OperationType.REJECT || log.operationType === OperationType.RISK_FLAG
                              ? 'bg-danger-100 text-danger-600' :
                            log.operationType === OperationType.REVIEW ? 'bg-warning-100 text-warning-600' :
                            'bg-primary-100 text-primary-600'
                          )}>
                            {getTypeIcon(log.operationType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('badge', getTypeBadgeClass(log.operationType))}>
                                {getOperationTypeLabel(log.operationType)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-gray-700">{log.description}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {user?.name || '未知'}
                              </span>
                              {contract && (
                                <span className="text-primary-600">
                                  {contract.title}
                                </span>
                              )}
                              {log.ipAddress && (
                                <span className="font-mono">IP: {log.ipAddress}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-500 text-center">
                共 {filteredLogs.length} 条记录
              </div>
            </div>
          )}

          {activeTab === 'efficiency' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">本周审阅趋势</h3>
                  <div className="space-y-3">
                    {[
                      { day: '周一', count: 5, avg: 40 },
                      { day: '周二', count: 3, avg: 55 },
                      { day: '周三', count: 7, avg: 35 },
                      { day: '周四', count: 4, avg: 45 },
                      { day: '周五', count: 6, avg: 38 },
                      { day: '周六', count: 2, avg: 60 },
                      { day: '周日', count: 1, avg: 70 },
                    ].map((item) => (
                      <div key={item.day} className="flex items-center gap-4">
                        <span className="w-12 text-sm text-gray-500">{item.day}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${(item.count / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">{item.count} 份</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          平均 {item.avg}分钟
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">人员效率排行</h3>
                  <div className="space-y-4">
                    {[
                      { name: '王审阅', role: '合同审阅人', count: 12, avg: 28, rank: 1 },
                      { name: '张法务', role: '法务负责人', count: 10, avg: 42, rank: 2 },
                      { name: '李公益', role: '公益律师', count: 8, avg: 55, rank: 3 },
                      { name: '系统管理员', role: '系统管理员', count: 5, avg: 30, rank: 4 },
                    ].map((person) => (
                      <div key={person.name} className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                          person.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          person.rank === 2 ? 'bg-gray-200 text-gray-600' :
                          person.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        )}>
                          {person.rank}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{person.name}</span>
                            <span className="text-xs text-gray-500">{person.count} 份审阅</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-gray-500">{person.role}</span>
                            <span className="text-xs text-primary-600">平均 {person.avg} 分钟</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-4">审阅效率提醒</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 text-warning-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-warning-800">李公益 审阅效率偏低</p>
                      <p className="text-xs text-warning-600 mt-0.5">
                        近7天平均审阅时间 55 分钟，高于团队平均水平 43 分钟，建议关注
                      </p>
                    </div>
                    <button className="btn-secondary text-xs">发送提醒</button>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-primary-50 border border-primary-200 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <Gauge className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-800">本周效率提升</p>
                      <p className="text-xs text-primary-600 mt-0.5">
                        团队平均审阅时间较上周下降 12%，继续保持
                      </p>
                    </div>
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
