import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api, exportFile } from '@/utils/api';
import {
  ArrowLeft,
  Users,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { ReachTask, ReachLog, MemberLevel, PaginatedResponse } from '@shared/types';
import { formatDate, getStatusText, getStatusColor } from '@/utils';

export const Route = createFileRoute('/admin/reach/$id')({
  component: ReachTaskDetailPage,
});

function ReachTaskDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<ReachTask | null>(null);
  const [logs, setLogs] = useState<ReachLog[]>([]);
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logStatus, setLogStatus] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<any>({
    level: '',
    minPoints: undefined as number | undefined,
    maxPoints: undefined as number | undefined,
  });

  const pageSize = 20;

  useEffect(() => {
    fetchTask();
    fetchLevels();
  }, [id]);

  useEffect(() => {
    if (task?.status !== 'draft') {
      fetchLogs();
    }
  }, [task?.status, logPage, logStatus]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const data = await api.get<ReachTask>(`/admin/reach-tasks/${id}`);
      setTask(data);
      if (data.filterCriteria) {
        setFilterCriteria(data.filterCriteria as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const data = await api.get<MemberLevel[]>('/member-levels');
      setLevels(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await api.get<PaginatedResponse<ReachLog>>(`/admin/reach-tasks/${id}/logs`, {
        page: logPage,
        pageSize,
        status: logStatus || undefined,
      });
      setLogs(data.items || []);
      setLogTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    try {
      const result = await api.post(`/admin/reach-tasks/${id}/verify`, {
        filterCriteria,
      });
      alert(`核对完成，匹配 ${(result as any).matched} 人`);
      fetchTask();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!confirm('确定执行触达任务吗？')) return;
    try {
      await api.post(`/admin/reach-tasks/${id}/execute`);
      alert('执行完成！');
      fetchTask();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRetry = async () => {
    if (!confirm('确定重试失败的触达吗？')) return;
    try {
      const result = await api.post(`/admin/reach-tasks/${id}/retry`);
      alert(`重试完成，成功 ${(result as any).retried} 条`);
      fetchTask();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExport = async () => {
    try {
      await exportFile('/admin/statistics/export', {
        type: 'reach',
        taskId: id,
        status: logStatus,
      }, '触达日志.csv');
    } catch (e: any) {
      alert(e.message || '导出失败');
    }
  };

  const totalLogPages = Math.ceil(logTotal / pageSize);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
          <div className="bg-white rounded-2xl p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <p className="text-gray-500">任务不存在</p>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      <button
        onClick={() => navigate({ to: '/admin/reach' })}
        className="flex items-center gap-2 text-gray-600 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回任务列表
      </button>

      <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{task.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              <span className="text-sm text-gray-500">
                创建于 {formatDate(task.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {task.status === 'draft' && (
              <button
                onClick={handleVerify}
                disabled={verifyLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${verifyLoading ? 'animate-spin' : ''}`} />
                核对名单
              </button>
            )}
            {task.status === 'verified' && (
              <button
                onClick={handleExecute}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                <Play className="w-4 h-4" />
                执行触达
              </button>
            )}
            {task.status === 'completed' && task.failedCount > 0 && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重试失败
              </button>
            )}
            {task.status !== 'draft' && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-500 mb-1">目标人数</div>
            <div className="text-2xl font-bold text-gray-800">{task.totalCount}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="text-sm text-green-600 mb-1">成功</div>
            <div className="text-2xl font-bold text-green-700">{task.successCount}</div>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <div className="text-sm text-red-600 mb-1">失败</div>
            <div className="text-2xl font-bold text-red-700">{task.failedCount}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="text-sm text-blue-600 mb-1">成功率</div>
            <div className="text-2xl font-bold text-blue-700">
              {task.totalCount > 0 ? Math.round((task.successCount / task.totalCount) * 100) : 0}%
            </div>
          </div>
        </div>

        {task.status === 'draft' && (
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-semibold text-gray-800 mb-4">筛选条件</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">会员等级</label>
                <select
                  value={filterCriteria.level || ''}
                  onChange={(e) => setFilterCriteria({ ...filterCriteria, level: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">全部等级</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最低积分</label>
                <input
                  type="number"
                  value={filterCriteria.minPoints || ''}
                  onChange={(e) => setFilterCriteria({
                    ...filterCriteria,
                    minPoints: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  placeholder="最低积分"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最高积分</label>
                <input
                  type="number"
                  value={filterCriteria.maxPoints || ''}
                  onChange={(e) => setFilterCriteria({
                    ...filterCriteria,
                    maxPoints: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  placeholder="最高积分"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              设置筛选条件后点击"核对名单"按钮，系统将自动匹配符合条件的会员
            </p>
          </div>
        )}
      </div>

      {task.status !== 'draft' && (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">触达日志</h3>
            <div className="flex items-center gap-2">
              {['', 'success', 'failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setLogStatus(s); setLogPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    logStatus === s
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s === '' ? '全部' : s === 'success' ? '成功' : '失败'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">会员</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">手机号</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">失败原因</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">重试次数</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">暂无日志数据</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const member = (log as any).member;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                              <Users className="w-4 h-4 text-brand-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {member?.nickname || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {log.memberPhone || member?.phone || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {getStatusText(log.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-red-500">
                            {log.errorMessage || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.retryCount}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalLogPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                disabled={logPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500">
                {logPage} / {totalLogPages}
              </span>
              <button
                onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                disabled={logPage === totalLogPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
