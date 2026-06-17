import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import {
  Megaphone,
  Plus,
  Play,
  RotateCcw,
  Search,
  Filter,
  ChevronRight,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
} from 'lucide-react';
import type { ReachTask, PaginatedResponse } from '@shared/types';
import { formatDate, getStatusColor, getStatusText } from '@/utils';

export const Route = createFileRoute('/admin/reach')({
  component: AdminReachPage,
});

function AdminReachPage() {
  const [tasks, setTasks] = useState<ReachTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [page, status]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<ReachTask>>('/admin/reach-tasks', {
        page,
        pageSize,
        status: status || undefined,
      });
      setTasks(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    const name = prompt('请输入任务名称：', '新的触达任务');
    if (!name) return;

    try {
      const task = await api.post('/admin/reach-tasks', {
        name,
        type: 'sms',
      });
      navigate({ to: `/admin/reach/${task.id}` });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const executeTask = async (task: ReachTask) => {
    if (!confirm(`确定要执行任务"${task.name}"吗？`)) return;
    try {
      await api.post(`/admin/reach-tasks/${task.id}/execute`);
      alert('执行完成！');
      fetchTasks();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const retryTask = async (task: ReachTask) => {
    if (!confirm(`确定要重试失败的触达吗？`)) return;
    try {
      const result = await api.post(`/admin/reach-tasks/${task.id}/retry`);
      alert(`重试成功，成功 ${(result as any).retried} 条`);
      fetchTasks();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const tabs = [
    { value: '', label: '全部' },
    { value: 'draft', label: '草稿' },
    { value: 'verified', label: '已核对' },
    { value: 'executing', label: '执行中' },
    { value: 'completed', label: '已完成' },
  ];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">触达任务</h1>
          <p className="text-gray-500 mt-1">共 {total} 个任务</p>
        </div>
        <button
          onClick={createTask}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          新建任务
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === tab.value
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">暂无触达任务</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => navigate({ to: `/admin/reach/${task.id}` })}
                className="p-5 hover:bg-gray-50 cursor-pointer transition-colors animate-fadeInUp"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                      <Megaphone className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{task.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {task.totalCount} 人
                        </span>
                        <span>创建于 {formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {task.successCount}
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-4 h-4" />
                        {task.failedCount}
                      </span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>

                    {task.status === 'verified' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); executeTask(task); }}
                        className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                        title="执行"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    {task.status === 'completed' && task.failedCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); retryTask(task); }}
                        className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        title="重试失败"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {(task.status === 'completed' || task.status === 'executing') && task.totalCount > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(task.successCount / task.totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
