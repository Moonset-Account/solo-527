import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export const Route = createLazyFileRoute('/schedules')({
  component: SchedulesIndex,
});

interface WorkloadItem {
  volunteerId?: string;
  volunteerName?: string;
  scheduleDate?: string;
  riskReason?: string;
  totalSchedules: number;
  byStatus?: Record<string, number>;
  byRiskReason?: Record<string, number>;
  byVolunteer?: Record<string, number>;
  byDate?: Record<string, number>;
}

function SchedulesIndex() {
  const [groupBy, setGroupBy] = useState<'volunteer' | 'date' | 'risk'>('volunteer');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkload();
  }, [groupBy, startDate, endDate]);

  const loadWorkload = async () => {
    try {
      const params = new URLSearchParams();
      params.append('groupBy', groupBy);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const { data } = await apiClient.get(`/schedules/workload?${params.toString()}`);
      setWorkload(data);
    } catch (error) {
      console.error('Failed to load workload:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderWorkloadCard = (item: WorkloadItem) => {
    let title = '';
    let subtitle = '';

    if (groupBy === 'volunteer') {
      title = item.volunteerName || '未分配';
      subtitle = `志愿者 ID: ${item.volunteerId}`;
    } else if (groupBy === 'date') {
      title = item.scheduleDate ? new Date(item.scheduleDate).toLocaleDateString() : '未知日期';
      subtitle = '排班日期';
    } else {
      title = item.riskReason || '无风险原因';
      subtitle = '风险原因分类';
    }

    return (
      <div key={title} className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <div className="text-3xl font-bold text-blue-600">{item.totalSchedules}</div>
        </div>

        {item.byStatus && Object.keys(item.byStatus).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">按状态</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(item.byStatus).map(([status, count]) => (
                <span
                  key={status}
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}
                >
                  {status === 'scheduled'
                    ? '已排班'
                    : status === 'in_progress'
                    ? '进行中'
                    : status === 'completed'
                    ? '已完成'
                    : '已取消'}
                  : {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.byRiskReason && Object.keys(item.byRiskReason).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">按风险原因</h4>
            <div className="space-y-1">
              {Object.entries(item.byRiskReason).map(([reason, count]) => (
                <div key={reason} className="flex justify-between text-sm">
                  <span className="text-gray-600">{reason === 'none' ? '无' : reason}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.byVolunteer && Object.keys(item.byVolunteer).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">按志愿者</h4>
            <div className="space-y-1">
              {Object.entries(item.byVolunteer).map(([volunteer, count]) => (
                <div key={volunteer} className="flex justify-between text-sm">
                  <span className="text-gray-600">{volunteer}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.byDate && Object.keys(item.byDate).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">按日期</h4>
            <div className="space-y-1">
              {Object.entries(item.byDate).map(([date, count]) => (
                <div key={date} className="flex justify-between text-sm">
                  <span className="text-gray-600">{new Date(date).toLocaleDateString()}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">排班负荷管理</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">分组方式:</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setGroupBy('volunteer')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  groupBy === 'volunteer'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                按志愿者
              </button>
              <button
                onClick={() => setGroupBy('date')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  groupBy === 'date'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                按日期
              </button>
              <button
                onClick={() => setGroupBy('risk')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  groupBy === 'risk'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                按风险原因
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">日期范围:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workload.map((item) => renderWorkloadCard(item))}
      </div>

      {workload.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          暂无排班数据
        </div>
      )}
    </div>
  );
}
