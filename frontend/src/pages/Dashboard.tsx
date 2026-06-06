import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { dashboardApi, financeApi, authApi } from '../services/api';
import { DashboardOverview, ResourceUtilization, MonthlyTrend, User } from '../types';
import { formatCurrency, formatDate, formatPercent } from '../utils/format';

const DEMAND_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'quoting', label: '报价中' },
  { value: 'confirmed', label: '已确认' },
  { value: 'cancelled', label: '已取消' },
];

const QUOTE_STATUS_OPTIONS = [
  { value: '', label: '全部报价状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_approval', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

export const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [utilization, setUtilization] = useState<ResourceUtilization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    assigneeId: '',
    status: '',
    quoteStatus: '',
  });

  const loadUsers = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUsers([profile]);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewData, trendData, utilData] = await Promise.all([
          dashboardApi.getOverview(filters),
          financeApi.getMonthlyTrend(6),
          dashboardApi.getResourceUtilization({
            startDate: filters.startDate,
            endDate: filters.endDate,
            assigneeId: filters.assigneeId,
          }),
        ]);
        setOverview(overviewData);
        setMonthlyTrend(trendData);
        setUtilization(utilData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const stats = overview?.stats || {
    totalDemands: 0,
    pendingDemands: 0,
    quotingDemands: 0,
    confirmedDemands: 0,
    totalQuotes: 0,
    pendingApprovalQuotes: 0,
    approvedQuotes: 0,
    totalContracts: 0,
    pendingContracts: 0,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">后台看板</h1>
            <p className="text-slate-500 mt-1">实时监控业务运营状况</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
              <Filter size={16} className="text-slate-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="text-sm text-slate-600 bg-transparent outline-none"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="text-sm text-slate-600 bg-transparent outline-none"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg outline-none focus:border-teal-500"
            >
              {DEMAND_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filters.quoteStatus}
              onChange={(e) => setFilters({ ...filters, quoteStatus: e.target.value })}
              className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg outline-none focus:border-teal-500"
            >
              {QUOTE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filters.assigneeId}
              onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
              className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg outline-none focus:border-teal-500"
            >
              <option value="">全部负责人</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', assigneeId: '', status: '', quoteStatus: '' })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              重置
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="客户需求"
            value={stats.totalDemands}
            icon={FileText}
            color="teal"
          />
          <StatCard
            title="待处理需求"
            value={stats.pendingDemands}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="报价单总数"
            value={stats.totalQuotes}
            icon={Receipt}
            color="blue"
          />
          <StatCard
            title="待审批报价"
            value={stats.pendingApprovalQuotes}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800">月度营收趋势</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-teal-500 rounded-full" />
                  营收
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-full" />
                  利润
                </span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ fill: '#0d9488', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">人员工作负荷</h3>
            <div className="space-y-4">
              {utilization.map((item) => (
                <div key={item.userId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{item.userName}</span>
                    <span className="text-sm font-medium text-slate-800">{item.utilizationRate.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.utilizationRate >= 80
                          ? 'bg-red-500'
                          : item.utilizationRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(item.utilizationRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>已分配 {item.assignedCount} 单</span>
                    <span>已完成 {item.completedCount} 单</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                超时任务预警
              </h3>
              <button className="text-sm text-teal-600 hover:text-teal-700">查看全部</button>
            </div>
            <div className="space-y-3">
              {overview?.overdueTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Clock size={18} className="text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{task.customerName}</div>
                      <div className="text-xs text-slate-500">
                        <Calendar size={12} className="inline mr-1" />
                        出行日期: {formatDate(task.travelStart)}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={task.status} type="demand" />
                </div>
              ))}
              {(!overview?.overdueTasks || overview.overdueTasks.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle size={40} className="mx-auto mb-2 text-green-400" />
                  <p>暂无超时任务</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-teal-500" />
              业务数据概览
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="quoteCount" fill="#0d9488" radius={[4, 4, 0, 0]} name="报价数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
