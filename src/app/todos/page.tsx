'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, User, Clock, CheckSquare, Square, MessageSquare, FileText, Image, AlertCircle, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import { todosApi, scriptsApi, usersApi, topicsApi } from '@/lib/api'
import { TodoType, TodoStatus } from '@prisma/client'

const todoSchema = z.object({
  type: z.enum(['READ_FEEDBACK', 'REVIEW_OPINION', 'COVER_VERSION', 'SCRIPT_REVIEW', 'TOPIC_REVIEW']),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  priority: z.coerce.number().min(1).max(5).default(1),
  dueDate: z.string().optional(),
  topicId: z.string().optional(),
  scriptId: z.string().optional(),
  coverVersionId: z.string().optional(),
  assigneeId: z.string().min(1, '请选择负责人'),
  readFeedback: z.string().optional(),
  reviewOpinion: z.string().optional(),
})

type TodoForm = z.infer<typeof todoSchema>

interface Todo {
  id: string
  type: TodoType
  title: string
  description: string | null
  status: TodoStatus
  priority: number
  dueDate: string | null
  readFeedback: string | null
  reviewOpinion: string | null
  assignee: { id: string; name: string; avatarUrl: string | null }
  creator: { id: string; name: string; avatarUrl: string | null }
  topic: { id: string; title: string } | null
  script: {
    id: string
    version: string
    reviewOpinion: string | null
    readingFeedback: string | null
  } | null
  coverVersion: {
    id: string
    version: string
    imageUrl: string
    feedback: string | null
  } | null
  createdAt: string
}

const typeConfig: Record<TodoType, { label: string; icon: React.ReactNode; color: string }> = {
  READ_FEEDBACK: { label: '阅读反馈', icon: <MessageSquare size={16} />, color: 'bg-blue-100 text-blue-700' },
  REVIEW_OPINION: { label: '审稿意见', icon: <FileText size={16} />, color: 'bg-yellow-100 text-yellow-700' },
  COVER_VERSION: { label: '封面版本', icon: <Image size={16} />, color: 'bg-pink-100 text-pink-700' },
  SCRIPT_REVIEW: { label: '脚本审核', icon: <FileText size={16} />, color: 'bg-purple-100 text-purple-700' },
  TOPIC_REVIEW: { label: '选题审核', icon: <FileText size={16} />, color: 'bg-green-100 text-green-700' },
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TodoForm>({
    resolver: zodResolver(todoSchema),
    defaultValues: { priority: 1 },
  })

  const watchType = watch('type')
  const watchTopicId = watch('topicId')

  useEffect(() => {
    loadData()
    loadUsers()
    loadTopics()
  }, [page, keyword, statusFilter, typeFilter])

  useEffect(() => {
    if (watchTopicId) {
      loadScripts(watchTopicId)
    }
  }, [watchTopicId])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 10 }
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter

      const res = await todosApi.list(params)
      if (res.success) {
        setTodos(res.data.items)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
      }
    } catch (error) {
      console.error('加载待办失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await usersApi.list()
      if (res.success) {
        setUsers(res.data)
      }
    } catch (error) {
      console.error('加载用户失败:', error)
    }
  }

  const loadTopics = async () => {
    try {
      const res = await topicsApi.list({ pageSize: 100 })
      if (res.success) {
        setTopics(res.data.items)
      }
    } catch (error) {
      console.error('加载选题失败:', error)
    }
  }

  const loadScripts = async (topicId: string) => {
    try {
      const res = await scriptsApi.list({ topicId, pageSize: 100 })
      if (res.success) {
        setScripts(res.data.items)
      }
    } catch (error) {
      console.error('加载脚本失败:', error)
    }
  }

  const onCreate = async (data: TodoForm) => {
    try {
      await todosApi.create(data)
      setCreateModalOpen(false)
      reset()
      setScripts([])
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const onUpdateStatus = async (todo: Todo, newStatus: TodoStatus) => {
    try {
      await todosApi.update(todo.id, { status: newStatus })
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const getPriorityColor = (priority: number) => {
    const colors = ['bg-gray-100 text-gray-600', 'bg-blue-100 text-blue-600', 'bg-yellow-100 text-yellow-600', 'bg-orange-100 text-orange-600', 'bg-red-100 text-red-600']
    return colors[priority - 1] || colors[0]
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">待办事项</h1>
            <p className="text-gray-500 mt-1">处理阅读反馈、审稿意见和封面版本审核</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            <span>新建待办</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(typeConfig).map(([type, config]) => (
            <div
              key={type}
              onClick={() => { setTypeFilter(typeFilter === type ? '' : type); setPage(1) }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                typeFilter === type
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${config.color}`}>
                {config.icon}
              </div>
              <p className="font-medium text-gray-900">{config.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {todos.filter(t => t.type === type).length}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
              placeholder="搜索待办标题..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待处理</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
          </select>

          <button
            onClick={() => { setTypeFilter(''); setPage(1) }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            清除筛选
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : (
            <div className="divide-y">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => onUpdateStatus(
                        todo,
                        todo.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                      )}
                      className="mt-1 flex-shrink-0"
                    >
                      {todo.status === 'COMPLETED' ? (
                        <CheckSquare className="w-6 h-6 text-green-600" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400 hover:text-purple-500 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[todo.type].color}`}>
                          {typeConfig[todo.type].icon}
                          {typeConfig[todo.type].label}
                        </span>
                        <StatusBadge status={todo.status} variant="todo" />
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                          P{todo.priority}
                        </span>
                        <h3 className={`font-semibold text-gray-900 ${todo.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
                          {todo.title}
                        </h3>
                      </div>

                      {todo.description && (
                        <p className="text-gray-600 text-sm mb-3">{todo.description}</p>
                      )}

                      {(todo.readFeedback || todo.reviewOpinion || todo.script?.readingFeedback || todo.script?.reviewOpinion) && (
                        <div className="mb-3 grid grid-cols-2 gap-3">
                          {todo.readFeedback && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                                <MessageSquare size={12} /> 阅读反馈
                              </p>
                              <p className="text-sm text-blue-900">{todo.readFeedback}</p>
                            </div>
                          )}
                          {todo.reviewOpinion && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <p className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
                                <FileText size={12} /> 审稿意见
                              </p>
                              <p className="text-sm text-yellow-900">{todo.reviewOpinion}</p>
                            </div>
                          )}
                          {todo.script?.readingFeedback && !todo.readFeedback && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                                <MessageSquare size={12} /> 脚本阅读反馈
                              </p>
                              <p className="text-sm text-blue-900">{todo.script.readingFeedback}</p>
                            </div>
                          )}
                          {todo.script?.reviewOpinion && !todo.reviewOpinion && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <p className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
                                <FileText size={12} /> 脚本审稿意见
                              </p>
                              <p className="text-sm text-yellow-900">{todo.script.reviewOpinion}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {todo.coverVersion && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Image size={12} /> 封面版本 v{todo.coverVersion.version}
                          </p>
                          <div className="flex items-start gap-3">
                            <img
                              src={todo.coverVersion.imageUrl}
                              alt="封面"
                              className="w-24 h-16 object-cover rounded-lg border"
                            />
                            {todo.coverVersion.feedback && (
                              <div className="flex-1 p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">{todo.coverVersion.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {todo.topic && (
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="text-gray-400">关联选题:</span> {todo.topic.title}
                        </div>
                      )}

                      {todo.script && (
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="text-gray-400">关联脚本:</span> v{todo.script.version}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>负责人: {todo.assignee.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>创建人: {todo.creator.name}</span>
                        </div>
                        {todo.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>截止: {new Date(todo.dueDate).toLocaleDateString('zh-CN')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{new Date(todo.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && todos.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无待办事项</p>
            </div>
          )}

          {total > 0 && (
            <Pagination
              page={page}
              pageSize={10}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setScripts([]) }}
        title="新建待办"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                待办类型 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="READ_FEEDBACK">阅读反馈</option>
                <option value="REVIEW_OPINION">审稿意见</option>
                <option value="COVER_VERSION">封面版本</option>
                <option value="SCRIPT_REVIEW">脚本审核</option>
                <option value="TOPIC_REVIEW">选题审核</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value={1}>P1 - 最高</option>
                <option value={2}>P2 - 高</option>
                <option value={3}>P3 - 中</option>
                <option value={4}>P4 - 低</option>
                <option value={5}>P5 - 最低</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="输入待办标题"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="输入待办描述..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联选题
              </label>
              <select
                {...register('topicId')}
                onChange={(e) => {
                  register('topicId').onChange(e)
                  setValue('scriptId', '')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">请选择选题</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联脚本
              </label>
              <select
                {...register('scriptId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                disabled={!watchTopicId}
              >
                <option value="">请选择脚本</option>
                {scripts.map((s) => (
                  <option key={s.id} value={s.id}>
                    v{s.version}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(watchType === 'READ_FEEDBACK' || watchType === 'REVIEW_OPINION') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {watchType === 'READ_FEEDBACK' ? '阅读反馈内容' : '审稿意见内容'}
              </label>
              <textarea
                {...register(watchType === 'READ_FEEDBACK' ? 'readFeedback' : 'reviewOpinion')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder={`输入${watchType === 'READ_FEEDBACK' ? '阅读反馈' : '审稿意见'}内容...`}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                负责人 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('assigneeId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">请选择负责人</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {errors.assigneeId && (
                <p className="mt-1 text-sm text-red-600">{errors.assigneeId.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setCreateModalOpen(false); setScripts([]) }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
