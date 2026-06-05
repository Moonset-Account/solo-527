'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { projectApi, taskApi, timeEntryApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Role, TaskStatus } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    estimated_hours: '',
    due_date: '',
  });
  const [timeForm, setTimeForm] = useState({
    task_id: '',
    hours: '',
    description: '',
    entry_date: new Date().toISOString().split('T')[0],
    billable: true,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'time' | 'files' | 'info'>('tasks');

  const isClient = user?.role === Role.CLIENT;
  const projectId = parseInt(params.id as string);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectData, filesData] = await Promise.all([
        projectApi.get(projectId),
        projectApi.getFiles(projectId),
      ]);
      setProject(projectData);
      setTasks(projectData.tasks || []);
      setTimeEntries(projectData.timeEntries || []);
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskApi.create({
        ...taskForm,
        project_id: projectId,
        estimated_hours: taskForm.estimated_hours ? parseFloat(taskForm.estimated_hours) : undefined,
      });
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        estimated_hours: '',
        due_date: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timeEntryApi.create({
        ...timeForm,
        project_id: projectId,
        task_id: parseInt(timeForm.task_id),
        hours: parseFloat(timeForm.hours),
      });
      setShowTimeModal(false);
      setTimeForm({
        task_id: '',
        hours: '',
        description: '',
        entry_date: new Date().toISOString().split('T')[0],
        billable: true,
      });
      loadData();
    } catch (error) {
      console.error('Failed to create time entry:', error);
    }
  };

  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    try {
      await taskApi.update(taskId, { status });
      loadData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await projectApi.uploadFile(projectId, file, true);
      loadData();
      setShowFileModal(false);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      delivered: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      pending_approval: '待审核',
      in_progress: '进行中',
      delivered: '已交付',
      completed: '已完成',
      cancelled: '已取消',
      todo: '待办',
      review: '审核中',
      done: '已完成',
    };
    return labels[status] || status;
  };

  const taskColumns = [
    { key: 'todo', title: '待办', color: 'from-gray-400 to-gray-500' },
    { key: 'in_progress', title: '进行中', color: 'from-blue-400 to-blue-500' },
    { key: 'review', title: '审核中', color: 'from-yellow-400 to-orange-500' },
    { key: 'done', title: '已完成', color: 'from-green-400 to-emerald-500' },
  ];

  if (loading || !project) {
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    project.status
                  )}`}
                >
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <p className="text-gray-500 mb-4">{project.description || '暂无描述'}</p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-500">客户：</span>
                  <span className="font-medium text-gray-700">{project.client_name}</span>
                </div>
                {!isClient && project.budget && (
                  <div>
                    <span className="text-gray-500">预算：</span>
                    <span className="font-medium text-gray-700">
                      ¥{project.budget.toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">进度：</span>
                  <span className="font-medium text-gray-700">{project.progress || 0}%</span>
                </div>
              </div>
            </div>
            <div className="w-32 h-32 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(project.progress || 0) * 3.52} 352`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{project.progress || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-100">
            {[
              { key: 'tasks', label: '任务看板' },
              ...(!isClient ? [{ key: 'time', label: '工时记录' }] : []),
              { key: 'files', label: '项目文件' },
              { key: 'info', label: '项目信息' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'tasks' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">任务列表</h3>
                  {!isClient && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        添加任务
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {taskColumns.map((column) => (
                    <div key={column.key} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.color}`} />
                        <h4 className="font-medium text-gray-700">{column.title}</h4>
                        <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                          {tasks.filter((t) => t.status === column.key).length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {tasks
                          .filter((t) => t.status === column.key)
                          .map((task) => (
                            <div
                              key={task.id}
                              className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                            >
                              <h5 className="font-medium text-gray-900 mb-1">{task.title}</h5>
                              {task.description && (
                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs">
                                {task.estimated_hours && (
                                  <span className="text-gray-500">
                                    预计 {task.estimated_hours}h
                                  </span>
                                )}
                                {!isClient && (
                                  <select
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs border border-gray-200 rounded px-2 py-0.5"
                                  >
                                    <option value={TaskStatus.TODO}>待办</option>
                                    <option value={TaskStatus.IN_PROGRESS}>进行中</option>
                                    <option value={TaskStatus.REVIEW}>审核中</option>
                                    <option value={TaskStatus.DONE}>已完成</option>
                                  </select>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'time' && !isClient && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">工时记录</h3>
                  <button
                    onClick={() => setShowTimeModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    记录工时
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日期</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">任务</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">描述</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">工时</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">可计费</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-700">{entry.entry_date}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{entry.task_title}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{entry.description || '-'}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{entry.hours}h</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
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
              </div>
            )}

            {activeTab === 'files' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">项目文件</h3>
                  {!isClient && (
                    <button
                      onClick={() => setShowFileModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      上传文件
                    </button>
                  )}
                </div>

                {files.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>暂无文件</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <a
                            href={file.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center text-sm text-blue-600 hover:bg-blue-50 py-1.5 rounded transition"
                          >
                            查看
                          </a>
                          {!isClient && (
                            <button className="flex-1 text-center text-sm text-red-600 hover:bg-red-50 py-1.5 rounded transition">
                              删除
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">项目信息</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">开始日期</label>
                      <p className="font-medium text-gray-700">{project.start_date || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">结束日期</label>
                      <p className="font-medium text-gray-700">{project.end_date || '-'}</p>
                    </div>
                    {!isClient && (
                      <>
                        <div>
                          <label className="text-sm text-gray-500">预算</label>
                          <p className="font-medium text-gray-700">
                            {project.budget ? `¥${project.budget.toLocaleString()}` : '-'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">小时费率</label>
                          <p className="font-medium text-gray-700">
                            {project.hourly_rate ? `¥${project.hourly_rate}/h` : '-'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">添加任务</h2>
              </div>
              <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    任务标题 *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      预计工时 (h)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={taskForm.estimated_hours}
                      onChange={(e) => setTaskForm({ ...taskForm, estimated_hours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTimeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">记录工时</h2>
              </div>
              <form onSubmit={handleTimeSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">任务 *</label>
                  <select
                    value={timeForm.task_id}
                    onChange={(e) => setTimeForm({ ...timeForm, task_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">选择任务</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
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
                      value={timeForm.hours}
                      onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
                    <input
                      type="date"
                      value={timeForm.entry_date}
                      onChange={(e) => setTimeForm({ ...timeForm, entry_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={timeForm.description}
                    onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={timeForm.billable}
                    onChange={(e) => setTimeForm({ ...timeForm, billable: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="billable" className="text-sm text-gray-700">
                    可计费工时
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTimeModal(false)}
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

        {showFileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">上传文件</h2>
              </div>
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 font-medium">
                      {uploading ? '上传中...' : '点击选择文件或拖拽到此处'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">支持所有文件格式</p>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFileModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    disabled={uploading}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
