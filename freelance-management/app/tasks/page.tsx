'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { taskApi, projectApi } from '@/lib/api';
import { TaskStatus } from '@/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await projectApi.list();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = selectedProject ? { project_id: parseInt(selectedProject) } : undefined;
      const data = await taskApi.list(params);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    try {
      await taskApi.update(taskId, { status });
      loadTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const taskColumns = [
    { key: 'todo', title: '待办', color: 'from-gray-400 to-gray-500' },
    { key: 'in_progress', title: '进行中', color: 'from-blue-400 to-blue-500' },
    { key: 'review', title: '审核中', color: 'from-yellow-400 to-orange-500' },
    { key: 'done', title: '已完成', color: 'from-green-400 to-emerald-500' },
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">任务看板</h1>
            <p className="text-gray-500 mt-1">查看和管理所有任务</p>
          </div>
          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {taskColumns.map((column) => (
            <div key={column.key} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.color}`} />
                <h3 className="font-semibold text-gray-700">{column.title}</h3>
                <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {tasks.filter((t) => t.status === column.key).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === column.key)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {task.project_name || '未分配项目'}
                        </span>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="todo">待办</option>
                          <option value="in_progress">进行中</option>
                          <option value="review">审核中</option>
                          <option value="done">已完成</option>
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
