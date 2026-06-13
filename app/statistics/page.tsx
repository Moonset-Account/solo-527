'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import { getOverdueDays, formatDateShort, cn } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import Avatar from '@/components/Avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ListTodo,
  Building2,
  Calendar,
  User,
  ChevronRight,
} from 'lucide-react';

const COLORS = ['#21BF73', '#0F3460', '#E94560', '#f5a623'];

export default function StatisticsPage() {
  const router = useRouter();
  const getDepartmentStats = useStore((state) => state.getDepartmentStats);
  const getOverdueTasks = useStore((state) => state.getOverdueTasks);
  const tasks = useStore((state) => state.tasks);
  const currentUser = useStore((state) => state.currentUser);

  const [selectedDept, setSelectedDept] = useState<string | 'all'>('all');

  const departmentStats = useMemo(() => {
    const stats = getDepartmentStats();
    if (currentUser?.role === 'manager') {
      return stats.filter(s => s.department_id === currentUser.department_id);
    }
    return stats;
  }, [getDepartmentStats, currentUser]);

  const overdueTasks = useMemo(() => {
    const tasks = getOverdueTasks();
    if (selectedDept !== 'all') {
      return tasks.filter(t => t.department_id === selectedDept);
    }
    if (currentUser?.role === 'manager') {
      return tasks.filter(t => t.department_id === currentUser.department_id);
    }
    return tasks;
  }, [getOverdueTasks, selectedDept, currentUser]);

  const overallStats = useMemo(() => {
    const stats = selectedDept === 'all' 
      ? departmentStats
      : departmentStats.filter(s => s.department_id === selectedDept);
    
    const totalTasks = stats.reduce((sum, s) => sum + s.total_tasks, 0);
    const completedTasks = stats.reduce((sum, s) => sum + s.completed_tasks, 0);
    
    let closureRate = 0;
    if (totalTasks > 0) {
      closureRate = Math.round((completedTasks / totalTasks) * 100);
    }
    
    return {
      total: totalTasks,
      completed: completedTasks,
      overdue: stats.reduce((sum, s) => sum + s.overdue_tasks, 0),
      inProgress: stats.reduce((sum, s) => sum + s.in_progress_tasks, 0),
      todo: stats.reduce((sum, s) => sum + s.todo_tasks, 0),
      closureRate,
    };
  }, [departmentStats, selectedDept]);

  const pieData = useMemo(() => [
    { name: '已完成', value: overallStats.completed, color: '#21BF73' },
    { name: '进行中', value: overallStats.inProgress, color: '#0F3460' },
    { name: '待办', value: overallStats.todo, color: '#f5a623' },
    { name: '已延期', value: overallStats.overdue, color: '#E94560' },
  ], [overallStats]);

  const barData = useMemo(() => 
    departmentStats.map(dept => ({
      name: dept.department_name,
      closureRate: dept.closure_rate,
      completed: dept.completed_tasks,
      overdue: dept.overdue_tasks,
    })), [departmentStats]);

  const statusCards = [
    { label: '总事项数', value: overallStats.total, icon: ListTodo, color: 'bg-gray-500' },
    { label: '已完成', value: overallStats.completed, icon: CheckCircle2, color: 'bg-success-500' },
    { label: '进行中', value: overallStats.inProgress, icon: Clock, color: 'bg-primary-500' },
    { label: '已延期', value: overallStats.overdue, icon: AlertTriangle, color: 'bg-danger-500' },
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary-900" />
          统计分析
        </h1>
        <p className="text-gray-500">各部门事项完成情况与延期风险分析</p>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="mb-6">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="select max-w-xs"
          >
            <option value="all">全部部门</option>
            {departmentStats.map((dept) => (
              <option key={dept.department_id} value={dept.department_id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statusCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`${card.color} text-white p-2 rounded-lg`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-900" />
            整体闭环率
          </h3>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={overallStats.closureRate >= 80 ? '#21BF73' : overallStats.closureRate >= 60 ? '#0F3460' : '#E94560'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${overallStats.closureRate * 3.52} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{overallStats.closureRate}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              完成 {overallStats.completed} / {overallStats.total} 项
            </p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">状态分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-900" />
            部门排名
          </h3>
          <div className="space-y-3">
            {departmentStats
              .sort((a, b) => b.closure_rate - a.closure_rate)
              .map((dept, index) => (
                <div key={dept.department_id} className="flex items-center gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                    index === 0 ? 'bg-warning-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  )}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{dept.department_name}</span>
                      <span className="text-sm font-semibold text-primary-900">{dept.closure_rate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${dept.closure_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-900" />
          各部门数据对比
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="closureRate" name="闭环率" fill="#0F3460" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="已完成" fill="#21BF73" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overdue" name="已延期" fill="#E94560" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger-500" />
            延期事项列表
            <span className="text-sm font-normal text-gray-500">({overdueTasks.length} 项)</span>
          </h3>
        </div>

        {overdueTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success-400" />
            <p className="text-sm">太棒了！当前没有延期事项</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">事项名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">部门</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">责任人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">优先级</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">截止日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">超期天数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">进度</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {overdueTasks.map((task) => {
                  const overdueDays = getOverdueDays(task.deadline);
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-gray-100 hover:bg-danger-50/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{task.title}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="w-4 h-4" />
                          {task.department?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={task.assignee.name} size="sm" />
                            <span className="text-sm text-gray-900">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">未认领</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={task.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDateShort(task.deadline)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-danger-600 bg-danger-50 px-2 py-1 rounded">
                          <AlertTriangle className="w-4 h-4" />
                          {overdueDays} 天
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">进度</span>
                            <span className="font-medium text-gray-700">{task.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-danger-500 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          查看详情
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
