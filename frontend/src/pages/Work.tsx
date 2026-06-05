import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

interface WorkTask {
  id: string;
  reservation_id: string;
  member_name: string;
  equipment_name: string;
  field_name: string;
  crop: string;
  start_time: string;
  end_time: string;
  status: 'assigned' | 'in_progress' | 'completed';
  field_photos?: string[];
  fuel_consumption?: number;
  work_hours?: number;
}

export default function Work() {
  const user = useAuthStore(state => state.user);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState({
    work_hours: '',
    fuel_consumption: '',
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/work/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('获取作业任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async (taskId: string) => {
    try {
      await axios.post(`/api/work/${taskId}/start`);
      fetchTasks();
    } catch (error) {
      console.error('开始作业失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleCompleteWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await axios.post(`/api/work/${selectedTask.id}/complete`, {
        work_hours: parseFloat(completionData.work_hours),
        fuel_consumption: parseFloat(completionData.fuel_consumption),
        notes: completionData.notes
      });
      alert('作业完成！');
      setSelectedTask(null);
      setCompletionData({ work_hours: '', fuel_consumption: '', notes: '' });
      fetchTasks();
    } catch (error) {
      console.error('完成作业失败:', error);
      alert('提交失败，请重试');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 模拟照片上传
    const files = e.target.files;
    if (files && files.length > 0) {
      alert(`已选择 ${files.length} 张地块照片`);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const pendingTasks = tasks.filter(t => t.status === 'assigned');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">作业执行</h1>
        <p className="text-gray-500 mt-1">机手作业任务管理中心</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</p>
          <p className="text-sm text-gray-500 mt-1">待执行</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{inProgressTasks.length}</p>
          <p className="text-sm text-gray-500 mt-1">作业中</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-600">{completedTasks.length}</p>
          <p className="text-sm text-gray-500 mt-1">已完成</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">📋 我的任务</h2>
          
          {pendingTasks.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-yellow-600">待执行</p>
              {pendingTasks.map(task => (
                <div key={task.id} className="card border-l-4 border-yellow-400">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{task.equipment_name}</p>
                      <p className="text-sm text-gray-500">{task.field_name} · {task.crop}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        社员：{task.member_name}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {dayjs(task.start_time).format('MM-DD HH:mm')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleStartWork(task.id)}
                    className="btn-primary w-full mt-4 text-sm py-2"
                  >
                    ▶️ 开始作业
                  </button>
                </div>
              ))}
            </div>
          )}

          {inProgressTasks.length > 0 && (
            <div className="space-y-3 mt-6">
              <p className="text-sm font-medium text-green-600">作业中</p>
              {inProgressTasks.map(task => (
                <div key={task.id} className="card border-l-4 border-green-400">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{task.equipment_name}</p>
                      <p className="text-sm text-gray-500">{task.field_name} · {task.crop}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      作业中
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="btn-secondary w-full mt-4 text-sm py-2"
                  >
                    ✅ 完成作业
                  </button>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-3 mt-6">
              <p className="text-sm font-medium text-gray-600">已完成（今日）</p>
              {completedTasks.slice(0, 3).map(task => (
                <div key={task.id} className="card bg-gray-50 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-600">{task.equipment_name}</p>
                      <p className="text-sm text-gray-500">{task.field_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{task.work_hours}h</p>
                      <p className="text-xs text-gray-500">{task.fuel_consumption}L</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <div className="card text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🚜</div>
              <p>暂无作业任务</p>
            </div>
          )}
        </div>

        <div>
          {selectedTask ? (
            <div className="card">
              <h2 className="font-semibold text-lg mb-4">✅ 完成作业</h2>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedTask.equipment_name}</p>
                <p className="text-sm text-gray-500">{selectedTask.field_name} · {selectedTask.crop}</p>
              </div>

              <form onSubmit={handleCompleteWork} className="space-y-4">
                <div>
                  <label className="label">作业时长（小时）*</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={completionData.work_hours}
                    onChange={(e) => setCompletionData({ ...completionData, work_hours: e.target.value })}
                    placeholder="例如：2.5"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">油耗（升）*</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={completionData.fuel_consumption}
                    onChange={(e) => setCompletionData({ ...completionData, fuel_consumption: e.target.value })}
                    placeholder="例如：15.5"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">上传地块照片</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="text-3xl mb-2">📷</div>
                      <p className="text-sm text-gray-500">点击或拖拽上传照片</p>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">作业备注</label>
                  <textarea
                    value={completionData.notes}
                    onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                    rows={3}
                    placeholder="记录作业中遇到的问题..."
                    className="input-field resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="btn-secondary flex-1"
                  >
                    取消
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    确认完成
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-3">👈</div>
                <p>选择一个任务开始作业</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
