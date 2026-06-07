import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, checkpointsAPI } from '../api';
import type { Checkpoint, EventLevel } from '../types';
import { useAuth } from '../auth';

const EventNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'medium' as EventLevel,
    checkpoint_id: '',
    actual_occurred_at: new Date().toISOString().slice(0, 16),
    original_record_url: '',
  });

  useEffect(() => {
    checkpointsAPI.getList().then(setCheckpoints);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.checkpoint_id) {
      alert('请选择签到点');
      return;
    }
    setLoading(true);
    try {
      const checkpoint = checkpoints.find(c => c.id === formData.checkpoint_id);
      const event = await eventsAPI.create({
        ...formData,
        location_lat: checkpoint?.lat,
        location_lng: checkpoint?.lng,
      });
      navigate(`/event/${event.id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-primary-600 hover:text-primary-500 mb-4 flex items-center gap-2"
        >
          ← 返回看板
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">补录事件</h1>
        <p className="text-gray-500">记录安全事件，系统将自动标记补录时间</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>重要:</strong> 请准确填写真实发生时间，处理时长统计将基于此时间计算。
            </p>
            <p className="text-xs text-amber-600 mt-1">
              补录人: {user?.name} · 系统将自动记录补录时间
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事件标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="请输入事件标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事件描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="请详细描述事件经过"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事件等级 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as EventLevel })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">低 - 轻微事件</option>
                <option value="medium">中 - 一般事件</option>
                <option value="high">高 - 重要事件</option>
                <option value="critical">紧急 - 严重事件</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                签到点 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.checkpoint_id}
                onChange={(e) => setFormData({ ...formData, checkpoint_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">请选择签到点</option>
                {checkpoints.map(cp => (
                  <option key={cp.id} value={cp.id}>{cp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              真实发生时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.actual_occurred_at}
              onChange={(e) => setFormData({ ...formData, actual_occurred_at: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">处理时长统计将基于此时间计算</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原始记录链接
            </label>
            <input
              type="url"
              value={formData.original_record_url}
              onChange={(e) => setFormData({ ...formData, original_record_url: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50"
            >
              {loading ? '提交中...' : '提交补录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventNew;
