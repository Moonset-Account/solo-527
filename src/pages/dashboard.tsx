import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import Layout from '@/components/Layout';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FolderKanban,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: projects } = useSWR('/api/projects');

  const stats = [
    { label: '进行中项目', value: projects?.data?.total || 0, icon: FolderKanban, color: 'text-blue-600 bg-blue-50' },
    { label: '已完成任务', value: 12, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: '待处理', value: 5, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
    { label: '总预算', value: formatCurrency(150000), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ];

  const upcomingTasks = [
    { id: 1, title: '花艺方案设计', dueDate: '2024-09-01', priority: 'HIGH', project: '张先生 & 王小姐 婚礼' },
    { id: 2, title: '确认摄影团队', dueDate: '2024-09-05', priority: 'HIGH', project: '张先生 & 王小姐 婚礼' },
    { id: 3, title: '设计稿确认', dueDate: '2024-09-15', priority: 'MEDIUM', project: '张先生 & 王小姐 婚礼' },
    { id: 4, title: '试菜', dueDate: '2024-09-20', priority: 'MEDIUM', project: '张先生 & 王小姐 婚礼' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{session?.user?.name}
          </h1>
          <p className="text-gray-500 mt-1">这是您今天的工作概览</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">即将到期的任务</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{task.project}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {task.priority === 'HIGH' ? '高优先' : '中优先'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>截止: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">花艺师小林</span> 提交了设计稿
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">10 分钟前</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">张先生</span> 确认了场地
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">2 小时前</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      摄影方案等待<span className="font-medium">审核</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">昨天</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">即将到来</h2>
              </div>
              <div className="p-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-3">
                    <Calendar className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="font-semibold text-gray-900">张先生 & 王小姐 婚礼</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate('2024-10-18')}
                  </p>
                  <div className="mt-3 inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    倒计时 60 天
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
