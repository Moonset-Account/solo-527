import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

export const Route = createFileRoute()({
  component: Dashboard,
});

interface Stats {
  apartments: {
    total: number;
    vacant: number;
    occupied: number;
    reserved: number;
    maintenance: number;
  };
  viewings: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  followups: {
    total: number;
    signed: number;
    lost: number;
    pending: number;
  };
  deposits: {
    total: number;
    held: number;
    refunded: number;
    disputed: number;
    totalAmount: string;
    refundedAmount: string;
  };
  consultantStats: Array<{
    consultantId: number;
    consultantName: string;
    followups: number;
    signed: number;
  }>;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todos, setTodos] = useState<Array<{ id: number; title: string; type: string; priority: string; createdAt: string }>>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'admin') {
      apiClient.get('/reports/statistics').then((res) => setStats(res.data));
    }
    apiClient.get('/todos', { params: { status: 'pending', pageSize: 5 } }).then((res) => setTodos(res.data.list));
  }, [user]);

  const statusColors: Record<string, string> = {
    vacant: 'bg-green-100 text-green-800',
    occupied: 'bg-blue-100 text-blue-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-red-100 text-red-800',
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    normal: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const priorityLabels: Record<string, string> = {
    high: '高',
    normal: '中',
    low: '低',
  };

  const todoTypeLabels: Record<string, string> = {
    deposit_dispute: '押金争议',
    vacancy: '空置处理',
    other: '其他',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">工作台</h1>
        <p className="text-gray-500">{dayjs().format('YYYY年MM月DD日 dddd')}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">房源总数</p>
                <p className="text-3xl font-bold text-gray-800">{stats.apartments.total}</p>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
            <div className="mt-4 flex gap-2">
              <span className={`px-2 py-1 rounded text-xs ${statusColors.vacant}`}>
                空置 {stats.apartments.vacant}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${statusColors.occupied}`}>
                已租 {stats.apartments.occupied}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">本月预约</p>
                <p className="text-3xl font-bold text-gray-800">{stats.viewings.total}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
            <div className="mt-4 flex gap-2">
              <span className={`px-2 py-1 rounded text-xs ${statusColors.reserved}`}>
                待处理 {stats.viewings.pending}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${statusColors.occupied}`}>
                已完成 {stats.viewings.completed}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">本月跟进</p>
                <p className="text-3xl font-bold text-gray-800">{stats.followups.total}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
            <div className="mt-4 flex gap-2">
              <span className={`px-2 py-1 rounded text-xs ${statusColors.occupied}`}>
                签约 {stats.followups.signed}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${statusColors.maintenance}`}>
                流失 {stats.followups.lost}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">押金总额</p>
                <p className="text-3xl font-bold text-gray-800">¥{Number(stats.deposits.totalAmount || 0).toLocaleString()}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <div className="mt-4 flex gap-2">
              <span className={`px-2 py-1 rounded text-xs ${statusColors.reserved}`}>
                争议 {stats.deposits.disputed}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${statusColors.occupied}`}>
                已退 ¥{Number(stats.deposits.refundedAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">待办事项</h2>
          </div>
          <div className="p-4">
            {todos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无待办事项</p>
            ) : (
              <ul className="space-y-3">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{todo.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {todoTypeLabels[todo.type] || todo.type} · {dayjs(todo.createdAt).format('MM-DD HH:mm')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${priorityColors[todo.priority] || priorityColors.normal}`}>
                      {priorityLabels[todo.priority] || todo.priority}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {stats?.consultantStats && stats.consultantStats.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">顾问业绩</h2>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-3">顾问</th>
                    <th className="pb-3">跟进数</th>
                    <th className="pb-3">签约数</th>
                    <th className="pb-3">转化率</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.consultantStats.map((item) => (
                    <tr key={item.consultantId} className="py-3">
                      <td className="py-3 text-gray-800">{item.consultantName}</td>
                      <td className="py-3 text-gray-600">{item.followups}</td>
                      <td className="py-3 text-gray-600">{item.signed}</td>
                      <td className="py-3">
                        <span className="text-blue-600 font-medium">
                          {item.followups > 0 ? ((item.signed / item.followups) * 100).toFixed(1) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
