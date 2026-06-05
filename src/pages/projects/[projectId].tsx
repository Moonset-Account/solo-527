import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import Layout from '@/components/Layout';
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
} from '@/lib/utils';
import { useCamera } from '@/hooks/useCamera';

const taskColumns = [
  { key: 'TODO', label: '待办', color: 'bg-gray-500' },
  { key: 'IN_PROGRESS', label: '进行中', color: 'bg-blue-500' },
  { key: 'REVIEW', label: '待审核', color: 'bg-yellow-500' },
  { key: 'COMPLETED', label: '已完成', color: 'bg-green-500' },
];

export default function ProjectDetailPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const { data: session } = useSession();
  const { data: projectData, mutate } = useSWR(
    projectId ? `/api/projects/${projectId}` : null
  );
  const [activeTab, setActiveTab] = useState<'kanban' | 'budget' | 'files' | 'confirmations'>('kanban');
  const [newComment, setNewComment] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const { isCapturing, videoRef, startCamera, stopCamera, capturePhoto, selectFile } = useCamera();

  const project = projectData?.data;
  const tasks = project?.tasks || [];
  const budgetItems = project?.budgetItems || [];
  const files = project?.files || [];
  const confirmations = project?.confirmations || [];
  const comments = project?.comments || [];

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t: any) => t.status === status);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    mutate();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    await fetch(`/api/projects/${projectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    setNewComment('');
    mutate();
  };

  const handleConfirmConfirmation = async (confirmationId: string, confirmed: boolean) => {
    await fetch(`/api/confirmations/${confirmationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: confirmed ? 'CONFIRMED' : 'DECLINED' }),
    });
    mutate();
  };

  const handlePhotoCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: photo,
          fileName: `photo-${Date.now()}.jpg`,
          category: 'photo',
        }),
      });
      setShowCamera(false);
      stopCamera();
      mutate();
    }
  };

  const handleFileUpload = async () => {
    const file = await selectFile();
    if (file) {
      await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: file,
          fileName: `file-${Date.now()}`,
          category: 'document',
        }),
      });
      mutate();
    }
  };

  if (!project) {
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
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-500 mt-1">{project.description}</p>
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
            <span className={`badge ${getStatusColor(project.status)} self-start`}>
              {getStatusLabel(project.status)}
            </span>
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
              <button className="btn btn-primary text-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                添加任务
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm text-gray-900 flex-1">
                            {task.title}
                          </h4>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{task.assignee?.name || '未分配'}</span>
                          <span>{task.dueDate ? formatDate(task.dueDate) : '无截止'}</span>
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
                  {formatCurrency(project.totalSpent)}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">剩余预算</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(Number(project.totalBudget) - Number(project.totalSpent))}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">预算明细</h2>
                {(session?.user?.role === 'ADMIN' || session?.user?.role === 'PLANNER') && (
                  <button className="btn btn-primary text-sm">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {budgetItems.map((item: any) => (
                      <tr key={item.id} className={item.isInternal ? 'bg-gray-50' : ''}>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {item.category}
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
                <button className="btn btn-secondary text-sm" onClick={handleFileUpload}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  上传文件
                </button>
                <button
                  className="btn btn-primary text-sm"
                  onClick={() => {
                    setShowCamera(true);
                    startCamera();
                  }}
                >
                  <Camera className="w-4 h-4 mr-1.5" />
                  拍照上传
                </button>
              </div>
            </div>

            {showCamera && (
              <div className="card mb-6">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">拍照</h3>
                  <button
                    onClick={() => {
                      setShowCamera(false);
                      stopCamera();
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black aspect-video"
                  />
                  <div className="flex justify-center mt-4">
                    <button className="btn btn-primary" onClick={handlePhotoCapture}>
                      拍照
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'confirmations' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">确认单</h2>
              {(session?.user?.role === 'ADMIN' || session?.user?.role === 'PLANNER') && (
                <button className="btn btn-primary text-sm">
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
                      <div>
                        <h3 className="font-semibold text-gray-900">{conf.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{conf.content}</p>
                      </div>
                      <span className={`badge ${getStatusColor(conf.status)}`}>
                        {getStatusLabel(conf.status)}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        创建于 {formatDateTime(conf.createdAt)}
                      </span>
                      
                      {conf.status === 'PENDING' && session?.user?.role === 'COUPLE' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConfirmConfirmation(conf.id, false)}
                            className="btn btn-danger text-sm"
                          >
                            拒绝
                          </button>
                          <button
                            onClick={() => handleConfirmConfirmation(conf.id, true)}
                            className="btn btn-primary text-sm"
                          >
                            确认
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
