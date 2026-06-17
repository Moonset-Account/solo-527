import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  AlertTriangle,
  TrendingUp,
  Clock,
  Plus,
  Search,
  ArrowRight,
  Zap,
  Timer,
  CheckCircle2,
  Target,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { ticketApi } from '@/api/ticketApi';
import type { DashboardStats } from '@/types';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { formatDuration } from '@/utils/formatTime';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  subText?: string;
  highlight?: boolean;
}

function StatCard({ title, value, icon, color, onClick, subText, highlight }: StatCardProps) {
  return (
    <Card hoverable={!!onClick} onClick={onClick} className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${highlight ? 'text-red-600' : 'text-zinc-900'}`}>
              {value.toLocaleString()}
            </p>
            {subText && (
              <p className="text-xs text-zinc-400 mt-1">{subText}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
        {onClick && (
          <div className="mt-4 flex items-center text-sm text-primary-600 font-medium">
            查看详情 <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="h-4 w-24 skeleton rounded mb-2" />
            <div className="h-10 w-20 skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="h-4 w-20 skeleton rounded mb-2" />
            <div className="h-8 w-16 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await ticketApi.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">工作台</h1>
          <p className="text-zinc-500 mt-1">欢迎回来，查看今日工作概览</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="快速搜索工单..."
              className="h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickSearch.trim()) {
                  navigate(`/tickets?search=${encodeURIComponent(quickSearch)}`);
                }
              }}
            />
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tickets/create')}>
            创建工单
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="待办工单"
          value={stats?.todo.total || 0}
          icon={<Ticket className="h-6 w-6 text-primary-600" />}
          color="bg-primary-100"
          onClick={() => navigate('/tickets?status=open')}
          subText={`紧急 ${stats?.todo.urgent || 0} · 即将到期 ${stats?.todo.due_soon || 0}`}
        />

        <StatCard
          title="异常工单"
          value={(stats?.exceptions.overdue || 0) + (stats?.exceptions.escalated_no_response || 0) + (stats?.exceptions.repeated_complaints || 0)}
          icon={<AlertTriangle className="h-6 w-6 text-warning-600" />}
          color="bg-warning-100"
          onClick={() => navigate('/tickets?filter=anomaly')}
          subText={`超时 ${stats?.exceptions.overdue || 0} · 升级未响应 ${stats?.exceptions.escalated_no_response || 0} · 重复投诉 ${stats?.exceptions.repeated_complaints || 0}`}
          highlight={(stats?.exceptions.overdue || 0) > 0}
        />

        <StatCard
          title="今日统计"
          value={stats?.reports.today_tickets || 0}
          icon={<Zap className="h-6 w-6 text-success-600" />}
          color="bg-success-100"
          onClick={() => navigate('/reports')}
          subText={`已解决 ${stats?.reports.today_resolved || 0}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Ticket className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">今日工单</p>
                <p className="text-2xl font-bold text-zinc-900">{stats?.reports.today_tickets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">今日解决</p>
                <p className="text-2xl font-bold text-zinc-900">{stats?.reports.today_resolved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                <Timer className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">平均响应时长(分钟)</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {stats?.reports.avg_response_time || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">解决率</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {(stats?.reports.resolution_rate || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">快捷操作</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => navigate('/tickets/create')}
                className="h-16 flex-col"
              >
                <span>创建工单</span>
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Search className="h-4 w-4" />}
                onClick={() => navigate('/tickets')}
                className="h-16 flex-col"
              >
                <span>工单列表</span>
              </Button>
              <Button
                variant="secondary"
                leftIcon={<BookOpen className="h-4 w-4" />}
                onClick={() => navigate('/knowledge')}
                className="h-16 flex-col"
              >
                <span>知识库</span>
              </Button>
              <Button
                variant="secondary"
                leftIcon={<BarChart3 className="h-4 w-4" />}
                onClick={() => navigate('/reports')}
                className="h-16 flex-col"
              >
                <span>数据报表</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">效率指标</h3>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => navigate('/reports')}>
                查看全部
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-600">首次响应达标率</span>
                  <span className="font-medium text-success-600">95.2%</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-success-500 rounded-full" style={{ width: '95.2%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-600">24小时解决率</span>
                  <span className="font-medium text-primary-600">88.7%</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: '88.7%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-600">客户满意度</span>
                  <span className="font-medium text-warning-600">92.3%</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-warning-500 rounded-full" style={{ width: '92.3%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
