import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import TaskForm from '@/components/TaskForm';
import BudgetItemForm from '@/components/BudgetItemForm';
import FileUpload from '@/components/FileUpload';
import ConfirmationForm from '@/components/ConfirmationForm';
import QRScanner from '@/components/QRScanner';
import {
  Calendar,
  MapPin,
  User,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Camera,
  Send,
  ChevronRight,
  X,
  FileText,
  Scan,
  Check,
  XCircle,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getRoleLabel,
  formatFileSize,
  getCategoryLabel,
} from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const taskColumns = [
  { key: 'TODO', label: '待办', color: 'bg-gray-500' },
  { key: 'IN_PROGRESS', label: '进行中', color: 'bg-blue-500' },
  { key: 'REVIEW', label: '待审核', color: 'bg-yellow-500' },
  { key: 'APPROVED', label: '已通过', color: 'bg-purple-500' },
  { key: 'COMPLETED', label: '已完成', color: 'bg-green-500' },
];

export default function ProjectDetailPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const { data: session } = useSession();
  const { isOnline, queueOfflineOperation } = useOfflineSync();
  
  const [activeTab, setActiveTab] = useState<'kanban' | 'budget' | 'files' | 'confirmations'>('kanban');
  const [newComment, setNewComment] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<any>(null);

  const { data: projectData, isLoading } = useSWR(
    projectId ? `/api/projects/${projectId}` : null
  );
  const { data: tasksData } = useSWR(
    projectId ? `/api/projects/${projectId}/tasks` : null
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !projectId) return;
    
    const handleSynced = (e: any) => {
      if (e.detail?.projectId === projectId) {
        console.log(`📡 检测到离线同步完成，刷新项目 ${projectId} 数据`);
        mutate(`/api/projects/${projectId}`);
        mutate(`/api/projects/${projectId}/tasks`);
      }
    };

    window.addEventListener('offline-synced', handleSynced);
    return () => window.removeEventListener('offline-synced', handleSynced);
  }, [projectId, mutate]);

  const project = projectData?.data;
  const tasks = tasksData?.data?.items || project?.tasks || [];
  const budgetItems = project?.budgetItems || [];
  const files = project?.files || [];
  const confirmations = project?.confirmations || [];
  const comments = project?.comments || [];

  const canEditTask = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';
  const canEditBudget = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';
  const canCreateConfirmation = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';
  const canConfirm = session?.user.role === 'COUPLE';
  const canApproveFiles = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t: any) => t.status === status);
  };

  const handleTaskSubmit = async (formData: any) => {
    const operation = async () => {
      const url = selectedTask ? `/api/tasks/${selectedTask.id}` : `/api/projects/${projectId}/tasks`;
      const method = selectedTask ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        mutate(`/api/projects/${projectId}`);
        mutate(`/api/projects/${projectId}/tasks`);
        setShowTaskModal(false);
        setSelectedTask(null);
      }
    };

    if (!isOnline) {
      queueOfflineOperation({
        operation: selectedTask ? 'update' : 'create',
        entityType: 'task',
        entityData: { ...formData, projectId, taskId: selectedTask?.id },
      });
      setShowTaskModal(false);
      setSelectedTask(null);
      return;
    }

    await operation();
  };

  const handleBudgetSubmit = async (formData: any) => {
    const operation = async () => {
      const url = selectedBudgetItem ? `/api/budget/${selectedBudgetItem.id}` : `/api/projects/${projectId}/budget`;
      const method = selectedBudgetItem ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        mutate(`/api/projects/${projectId}`);
        setShowBudgetModal(false);
        setSelectedBudgetItem(null);
      }
    };

    if (!isOnline) {
      queueOfflineOperation({
        operation: selectedBudgetItem ? 'update' : 'create',
        entityType: 'budget',
        entityData: { ...formData, projectId, budgetId: selectedBudgetItem?.id },
      });
      setShowBudgetModal(false);
      setSelectedBudgetItem(null);
      return;
    }

    await operation();
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    const operation = async () => {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      mutate(`/api/projects/${projectId}`);
      mutate(`/api/projects/${projectId}/tasks`);
    };

    if (!isOnline) {
      queueOfflineOperation({
        operation: 'update',
        entityType: 'task',
        entityData: { taskId, status },
      });
      return;
    }

    await operation();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const operation = async () => {
      await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      setNewComment('');
      mutate(`/api/projects/${projectId}`);
    };

    if (!isOnline) {
      queueOfflineOperation({
        operation: 'create',
        entityType: 'comment',
        entityData: { projectId, content: newComment },
      });
      setNewComment('');
      return;
    }

    await operation();
  };

  const handleConfirmConfirmation = async (confirmationId: string, confirmed: boolean) => {
    const operation = async () => {
      await fetch(`/api/confirmations/${confirmationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: confirmed ? 'CONFIRMED' : 'DECLINED' }),
      });
      mutate(`/api/projects/${projectId}`);
    };

    if (!isOnline) {
      queueOfflineOperation({
        operation: 'update',
        entityType: 'confirmation',
        entityData: { confirmationId, status: confirmed ? 'CONFIRMED' : 'DECLINED' },
      });
      return;
    }

    await operation();
  };

  const handleFileUploaded = () => {
    mutate(`/api/projects/${projectId}`);
    setShowFileModal(false);
  };

  const handleFileStatus = async (fileId: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    mutate(`/api/projects/${projectId}`);
  };

  const handleCreateConfirmation = async (formData: any) => {
    const operation = async () => {
      const res = await fetch(`/api/projects/${projectId}/confirmations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        mutate(`/api/projects/${projectId}`);
        setShowConfirmationModal(false);
      }
    };

    if (!isOnline) {
      queueOfflineOperation({
        operation: 'create',
        entityType: 'confirmation',
        entityData: { ...formData, projectId },
      });
      setShowConfirmationModal(false);
      return;
    }

    await operation();
  };

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="card p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{project.name}</h1>
                <button
                  onClick={() => setShowScanner(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="扫码"
                >
                  <Scan className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-500">{project.description}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {project.weddingDate ? formatDate(project.weddingDate) : '未设置日期'}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  {project.venue || '未设置场地'}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1.5" />
                  策划师: {project.manager?.name}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1.5" />
                  总预算: {formatCurrency(project.totalBudget)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isOnline && (
                <span className="badge bg-yellow-100 text-yellow-700">
                  离线模式
                </span>
              )}
              <span className={`badge ${getStatusColor(project.status)} self-start`}>
                {getStatusLabel(project.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 overflow-x-auto pb-2">
          {[
            { key: 'kanban', label: '任务看板' },
            { key: 'budget', label: '预算跟踪' },
            { key: 'files', label: '文件资料' },
            { key: 'confirmations', label: '确认单' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'kanban' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">任务看板</h2>
              {canEditTask && (
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setShowTaskModal(true);
                  }}
                  className="btn btn-primary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  添加任务
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {taskColumns.map((column) => (
                <div key={column.key} className="card">
                  <div className="p-3 border-b border-gray-200 flex items-center">
                    <div className={`w-2 h-2 rounded-full ${column.color} mr-2`} />
                    <h3 className="font-medium text-gray-900">{column.label}</h3>
                    <span className="ml-auto text-sm text-gray-500">
                      {getTasksByStatus(column.key).length}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 min-h-[200px]">
                    {getTasksByStatus(column.key).map((task: any) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm text-gray-900 flex-1">
                            {task.title}
                          </h4>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{task.assignee?.name || '未分配'}</span>
                          <span>{task.dueDate ? formatDate(task.dueDate) : '无截止'}</span>
                        </div>
                        
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {column.key === 'TODO' && (task.assigneeId === session?.user.id || canEditTask) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateTaskStatus(task.id, 'IN_PROGRESS');
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              开始
                            </button>
                          )}
                          {column.key === 'IN_PROGRESS' && (task.assigneeId === session?.user.id || canEditTask) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateTaskStatus(task.id, 'REVIEW');
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            >
                              提交审核
                            </button>
                          )}
                          {column.key === 'REVIEW' && canEditTask && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(task.id, 'APPROVED');
                                }}
                                className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                              >
                                通过
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(task.id, 'IN_PROGRESS');
                                }}
                                className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                驳回
                              </button>
                            </>
                          )}
                          {column.key === 'REVIEW' && canConfirm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateTaskStatus(task.id, 'APPROVED');
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              确认
                            </button>
                          )}
                          {column.key === 'APPROVED' && canEditTask && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateTaskStatus(task.id, 'COMPLETED');
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              完成
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card mt-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">讨论区</h3>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.author?.name}
                        </span>
                        <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                          {getRoleLabel(comment.author?.role)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    暂无评论，来发表第一条评论吧
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="输入评论..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <p className="text-sm text-gray-500">总预算</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(project.totalBudget)}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">已支出</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(project.totalSpent || budgetItems.reduce((sum: number, i: any) => sum + (i.actual || 0), 0))}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">剩余预算</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(Number(project.totalBudget) - (project.totalSpent || budgetItems.reduce((sum: number, i: any) => sum + (i.actual || 0), 0)))}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">预算明细</h2>
                {canEditBudget && (
                  <button
                    onClick={() => {
                      setSelectedBudgetItem(null);
                      setShowBudgetModal(true);
                    }}
                    className="btn btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    添加预算项
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">预算</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">实际</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">差额</th>
                      {canEditBudget && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {budgetItems.map((item: any) => (
                      <tr key={item.id} className={item.isInternal ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {getCategoryLabel(item.category)}
                            {item.isInternal && <span className="ml-1 text-red-500">(内部)</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.estimated)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.actual)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${
                          Number(item.actual) > Number(item.estimated)
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {formatCurrency(Number(item.estimated) - Number(item.actual))}
                        </td>
                        {canEditBudget && (
                          <td className="px-4 py-3 text-sm text-right">
                            <button
                              onClick={() => {
                                setSelectedBudgetItem(item);
                                setShowBudgetModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              编辑
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {session?.user?.role === 'COUPLE' && (
                <div className="p-4 bg-blue-50 border-t border-blue-100">
                  <p className="text-sm text-blue-700">
                    💡 提示：部分内部费用项已对您隐藏，仅显示对外报价部分。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">文件资料</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFileModal(true)}
                  className="btn btn-primary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  上传文件
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file: any) => (
                <div key={file.id} className="card group">
                  <div className="aspect-video bg-gray-100 relative">
                    {file.type?.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 badge ${getStatusColor(file.status)}`}>
                      {getStatusLabel(file.status)}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{file.name}</h4>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatRelativeTime(file.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      {file.uploadedBy?.name}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn btn-secondary text-xs py-1.5"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        查看
                      </a>
                      {canApproveFiles && file.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleFileStatus(file.id, 'APPROVED')}
                            className="btn btn-primary text-xs py-1.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFileStatus(file.id, 'REJECTED')}
                            className="btn btn-danger text-xs py-1.5"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {files.length === 0 && (
              <div className="card p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文件</h3>
                <p className="text-gray-500">上传第一个文件开始协作</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'confirmations' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">确认单</h2>
              {canCreateConfirmation && (
                <button
                  onClick={() => setShowConfirmationModal(true)}
                  className="btn btn-primary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  创建确认单
                </button>
              )}
            </div>

            <div className="space-y-4">
              {confirmations.map((conf: any) => (
                <div key={conf.id} className="card">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{conf.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{conf.content}</p>
                        {conf.files?.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {conf.files.map((f: any) => (
                              <a
                                key={f.id}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-600 hover:underline"
                              >
                                <FileText className="w-3 h-3 inline mr-1" />
                                {f.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`badge ${getStatusColor(conf.status)} ml-4`}>
                        {getStatusLabel(conf.status)}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-gray-500">
                        创建于 {formatDateTime(conf.createdAt)}
                      </span>
                      
                      {conf.status === 'PENDING' && canConfirm && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConfirmConfirmation(conf.id, false)}
                            className="btn btn-danger text-sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            拒绝
                          </button>
                          <button
                            onClick={() => handleConfirmConfirmation(conf.id, true)}
                            className="btn btn-primary text-sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            确认
                          </button>
                        </div>
                      )}

                      {conf.status !== 'PENDING' && conf.confirmedAt && (
                        <span className="text-sm text-gray-500">
                          {conf.status === 'CONFIRMED' ? '确认' : '拒绝'}于 {formatDateTime(conf.confirmedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {confirmations.length === 0 && (
              <div className="card p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无确认单</h3>
                <p className="text-gray-500">策划师可以创建确认单供新人确认</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        title={selectedTask ? '编辑任务' : '添加任务'}
        size="lg"
      >
        <TaskForm
          projectId={projectId as string}
          initialData={selectedTask}
          onSubmit={handleTaskSubmit}
          onCancel={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setSelectedBudgetItem(null);
        }}
        title={selectedBudgetItem ? '编辑预算项' : '添加预算项'}
        size="lg"
      >
        <BudgetItemForm
          projectId={projectId as string}
          initialData={selectedBudgetItem}
          onSubmit={handleBudgetSubmit}
          onCancel={() => {
            setShowBudgetModal(false);
            setSelectedBudgetItem(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        title="上传文件"
        size="lg"
      >
        <FileUpload
          projectId={projectId as string}
          onUpload={handleFileUploaded}
          onCancel={() => setShowFileModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title="创建确认单"
        size="lg"
      >
        <ConfirmationForm
          projectId={projectId as string}
          onSubmit={handleCreateConfirmation}
          onCancel={() => setShowConfirmationModal(false)}
        />
      </Modal>

      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(code) => {
          setShowScanner(false);
          if (code.startsWith('task-')) {
            const taskId = code.replace('task-', '');
            const task = tasks.find((t: any) => t.id === taskId);
            if (task) {
              setSelectedTask(task);
              setShowTaskModal(true);
            }
          }
        }}
      />
    </Layout>
  );
}
