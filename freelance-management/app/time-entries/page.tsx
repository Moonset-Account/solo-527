'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { timeEntryApi, projectApi, taskApi } from '@/lib/api';
import { exportApi } from '@/lib/api';

export default function TimeEntriesPage() {
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    task_id: '',
    hours: '',
    description: '',
    entry_date: new Date().toISOString().split('T')[0],
    billable: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, projectsData] = await Promise.all([
        timeEntryApi.list(),
        projectApi.list(),
      ]);
      setTimeEntries(entriesData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (projectId: number) => {
    try {
      const tasksData = await taskApi.list({ project_id: projectId });
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setFormData({ ...formData, project_id: projectId, task_id: '' });
    if (projectId) {
      loadTasks(parseInt(projectId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timeEntryApi.create({
        ...formData,
        project_id: parseInt(formData.project_id),
        task_id: parseInt(formData.task_id),
        hours: parseFloat(formData.hours),
      });
      setShowModal(false);
      setFormData({
        project_id: '',
        task_id: '',
        hours: '',
        description: '',
        entry_date: new Date().toISOString().split('T')[0],
        billable: true,
      });
      setTasks([]);
      loadData();
    } catch (error) {
      console.error('Failed to create time entry:', error);
    }
  };

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const billableHours = timeEntries.reduce((sum, e) => sum + (e.billable ? e.hours : 0), 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工时记录</h1>
          <p className="text-gray-500 mt-1">记录和管理工作时间</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportApi.timeEntries()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            记录工时
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">总工时</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalHours}h</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">可计费工时</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{billableHours}h</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">不可计费</p>
          <p className="text-3xl font-bold text-gray-500 mt-1">{totalHours - billableHours}h</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">日期</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">项目</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">任务</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">描述</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">工时</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">可计费</th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.map((entry) => (
            <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-4 px-6 text-sm text-gray-600">{entry.entry_date}</td>
              <td className="py-4 px-6 text-sm text-gray-700">{entry.project_name}</td>
              <td className="py-4 px-6 text-sm text-gray-600">{entry.task_title}</td>
              <td className="py-4 px-6 text-sm text-gray-500">{entry.description || '-'}</td>
              <td className="py-4 px-6 text-sm font-semibold text-gray-900">{entry.hours}h</td>
              <td className="py-4 px-6">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    entry.billable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {entry.billable ? '是' : '否'}
                </span>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">记录工时</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目 *</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">选择项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">任务 *</label>
                <select
                  value={formData.task_id}
                  onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.project_id}
                >
                  <option value="">选择任务</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工时 (h) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
                  <input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billable"
                  checked={formData.billable}
                  onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="billable" className="text-sm text-gray-700">
                  可计费工时
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setTasks([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}
