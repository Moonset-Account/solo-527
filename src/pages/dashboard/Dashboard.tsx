import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';
import {
  FlaskConical, Clock, CalendarDays, AlertTriangle,
  AlertOctagon, ClockAlert, CheckCircle2, Bell
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store';
import { dashboardApi, notificationApi } from '@/api';
import { Notification, TodoItem, TableColumn } from '@/types';
import { formatRelativeTime, getPriorityColor, getStatusColor, truncateText } from '@/utils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const monthlyTrendData = [
  { month: '1月', 申请数: 12, 完成数: 10 },
  { month: '2月', 申请数: 15, 完成数: 13 },
  { month: '3月', 申请数: 18, 完成数: 16 },
  { month: '4月', 申请数: 22, 完成数: 20 },
  { month: '5月', 申请数: 19, 完成数: 18 },
  { month: '6月', 申请数: 25, 完成数: 22 },
];

const categoryData = [
  { name: '有机溶剂', value: 35 },
  { name: '酸类', value: 25 },
  { name: '碱类', value: 15 },
  { name: '盐类', value: 15 },
  { name: '指示剂', value: 10 },
];

const complianceData = [
  { month: '1月', 合规: 85, 警告: 10, 不合规: 5 },
  { month: '2月', 合规: 88, 警告: 8, 不合规: 4 },
  { month: '3月', 合规: 82, 警告: 12, 不合规: 6 },
  { month: '4月', 合规: 90, 警告: 7, 不合规: 3 },
  { month: '5月', 合规: 87, 警告: 9, 不合规: 4 },
  { month: '6月', 合规: 92, 警告: 6, 不合规: 2 },
];

export default function Dashboard() {
  const { dashboardStats, todoList, loadDashboardData, isLoading } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          loadDashboardData(),
          fetchNotifications()
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loadDashboardData]);

  const fetchNotifications = async () => {
    try {
      const result = await notificationApi.getList({ page: 1, size: 5 });
      setNotifications(result.content);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const statCards = [
    { label: '试剂总数', value: dashboardStats?.totalReagents || 0, icon: FlaskConical, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: '待审核申请', value: dashboardStats?.pendingApplications || 0, icon: Clock, color: 'text-warning-500', bg: 'bg-warning-50' },
    { label: '今日排期', value: dashboardStats?.todaySchedules || 0, icon: CalendarDays, color: 'text-success-500', bg: 'bg-success-50' },
    { label: '安全告警', value: dashboardStats?.safetyAlerts || 0, icon: AlertTriangle, color: 'text-danger-500', bg: 'bg-danger-50' },
    { label: '待处理冲突', value: dashboardStats?.pendingConflicts || 0, icon: AlertOctagon, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: '即将过期', value: dashboardStats?.expiringReagents || 0, icon: ClockAlert, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const todoColumns: TableColumn<TodoItem>[] = [
    {
      key: 'title',
      title: '待办事项',
      render: (record) => (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-800">{record.title}</span>
        </div>
      ),
    },
    {
      key: 'description',
      title: '描述',
      render: (record) => (
        <span className="text-sm text-neutral-500">{truncateText(record.description, 30)}</span>
      ),
    },
    {
      key: 'priority',
      title: '优先级',
      render: (record) => (
        <Badge variant={record.priority === 'HIGH' ? 'danger' : record.priority === 'MEDIUM' ? 'warning' : 'neutral'}>
          <span className={getPriorityColor(record.priority)}>
            {record.priority === 'HIGH' ? '高' : record.priority === 'MEDIUM' ? '中' : '低'}
          </span>
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (record) => (
        <span className="text-sm text-neutral-500">{formatRelativeTime(record.createdAt)}</span>
      ),
    },
  ];

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-danger-500">{error}</p>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>月度申请趋势</Card.Title>
          </Card.Header>
          <Card.Content className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="申请数" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="完成数" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>试剂类别占比</Card.Title>
          </Card.Header>
          <Card.Content className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>安全合规趋势</Card.Title>
        </Card.Header>
        <Card.Content className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Bar dataKey="合规" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="警告" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="不合规" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>待办事项</Card.Title>
            <Button variant="ghost" size="sm">查看全部</Button>
          </Card.Header>
          <Card.Content className="p-0">
            <Table<TodoItem>
              columns={todoColumns}
              data={todoList}
              rowKey="id"
              emptyText="暂无待办事项"
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-neutral-600" />
              最近通知
            </Card.Title>
            <Button variant="ghost" size="sm">查看全部</Button>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="divide-y divide-neutral-100">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-neutral-500">暂无通知</div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(notif.status).split(' ')[0]}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-neutral-900 truncate">{notif.title}</h4>
                          <Badge variant="neutral">{notif.type === 'APPLICATION' ? '申请' : notif.type === 'CONFLICT' ? '冲突' : notif.type === 'COMPLIANCE' ? '合规' : '系统'}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 truncate">{notif.content}</p>
                        <p className="mt-1 text-xs text-neutral-400">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
