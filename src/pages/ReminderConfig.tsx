import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import useAuthStore from '@/stores/auth';
import { getReminderConfig, updateReminderConfig } from '@/api/reminders';
import type { ReminderConfig as ReminderConfigType } from '@/types';

export default function ReminderConfig() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [config, setConfig] = useState<ReminderConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_reminder_days: 0,
    repeat_interval_days: 0,
    escalation_timeout_hours: 0,
    max_escalation_level: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getReminderConfig();
        setConfig(res.data);
        setForm({
          first_reminder_days: res.data.first_reminder_days,
          repeat_interval_days: res.data.repeat_interval_days,
          escalation_timeout_hours: res.data.escalation_timeout_hours,
          max_escalation_level: res.data.max_escalation_level,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">仅管理员可访问此页面</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReminderConfig(form);
      const res = await getReminderConfig();
      setConfig(res.data);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">加载中...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/reminders')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">催收节奏配置</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">首次提醒天数</label>
            <input
              type="number"
              min={0}
              value={form.first_reminder_days}
              onChange={(e) => setForm({ ...form, first_reminder_days: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">重复间隔天数</label>
            <input
              type="number"
              min={0}
              value={form.repeat_interval_days}
              onChange={(e) => setForm({ ...form, repeat_interval_days: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">超时升级小时数</label>
            <input
              type="number"
              min={0}
              value={form.escalation_timeout_hours}
              onChange={(e) => setForm({ ...form, escalation_timeout_hours: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大升级级别</label>
            <input
              type="number"
              min={0}
              value={form.max_escalation_level}
              onChange={(e) => setForm({ ...form, max_escalation_level: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#f59e0b' }}
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
