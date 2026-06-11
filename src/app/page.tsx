'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, User, Tag, Clock, ChevronRight, FileText, Video } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import { topicsApi, scriptsApi, usersApi } from '@/lib/api'
import { TopicStatus, ScriptStatus, UserRole } from '@prisma/client'

const topicSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  tags: z.string().transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  priority: z.coerce.number().min(1).max(5).default(1),
  scheduledDate: z.string().optional(),
  deadline: z.string().optional(),
  assigneeId: z.string().optional(),
})

const scriptSchema = z.object({
  topicId: z.string().min(1, '请选择选题'),
  version: z.string().default('1.0'),
  content: z.string().min(1, '脚本内容不能为空'),
  duration: z.coerce.number().optional(),
  assigneeId: z.string().optional(),
})

type TopicForm = z.infer<typeof topicSchema>
type ScriptForm = z.infer<typeof scriptSchema>

interface Topic {
  id: string
  title: string
  description: string
  tags: string[]
  priority: number
  status: TopicStatus
  scheduledDate: string | null
  deadline: string | null
  creator: { id: string; name: string; avatarUrl: string | null }
  assignee: { id: string; name: string; avatarUrl: string | null } | null
  scripts: any[]
  createdAt: string
}

interface Script {
  id: string
  version: string
  content: string
  status: ScriptStatus
  topic: { id: string; title: string }
  creator: { id: string; name: string }
  coverVersions: any[]
  reviewOpinion: string | null
  readingFeedback: string | null
  createdAt: string
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'topics' | 'scripts'>('topics')
  const [topics, setTopics] = useState<Topic[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [scriptModalOpen, setScriptModalOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const {
    register: registerTopic,
    handleSubmit: handleSubmitTopic,
    formState: { errors: topicErrors },
    reset: resetTopic,
  } = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
    defaultValues: { priority: 1 },
  })

  const {
    register: registerScript,
    handleSubmit: handleSubmitScript,
    formState: { errors: scriptErrors },
    reset: resetScript,
  } = useForm<ScriptForm>({
    resolver: zodResolver(scriptSchema),
    defaultValues: { version: '1.0' },
  })

  useEffect(() => {
    loadData()
    loadUsers()
  }, [activeTab, page, keyword, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 10 }
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter

      if (activeTab === 'topics') {
        const res = await topicsApi.list(params)
        if (res.success) {
          setTopics(res.data.items)
          setTotal(res.data.total)
          setTotalPages(res.data.totalPages)
        }
      } else {
        const res = await scriptsApi.list(params)
        if (res.success) {
          setScripts(res.data.items)
          setTotal(res.data.total)
          setTotalPages(res.data.totalPages)
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
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

  const onCreateTopic = async (data: TopicForm) => {
    try {
      await topicsApi.create(data)
      setTopicModalOpen(false)
      resetTopic()
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const onCreateScript = async (data: ScriptForm) => {
    try {
      await scriptsApi.create(data)
      setScriptModalOpen(false)
      resetScript()
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
            <h1 className="text-2xl font-bold text-gray-900">选题与脚本管理</h1>
            <p className="text-gray-500 mt-1">提交选题，管理脚本，追踪内容生产进度</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTopicModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              <span>提交选题</span>
            </button>
            <button
              onClick={() => setScriptModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText size={18} />
              <span>提交脚本</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('topics'); setPage(1) }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'topics'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              选题列表
            </button>
            <button
              onClick={() => { setActiveTab('scripts'); setPage(1) }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'scripts'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              脚本列表
            </button>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                placeholder="搜索标题或描述..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option value="">全部状态</option>
                {activeTab === 'topics' ? (
                  <>
                    <option value="DRAFT">草稿</option>
                    <option value="PENDING_REVIEW">待审核</option>
                    <option value="APPROVED">已通过</option>
                    <option value="IN_PRODUCTION">制作中</option>
                    <option value="COMPLETED">已完成</option>
                  </>
                ) : (
                  <>
                    <option value="DRAFT">草稿</option>
                    <option value="PENDING_REVIEW">待审核</option>
                    <option value="APPROVED">已通过</option>
                    <option value="RECORDING">录制中</option>
                    <option value="COMPLETED">已完成</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : activeTab === 'topics' ? (
            <div className="divide-y">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                        <StatusBadge status={topic.status} variant="topic" />
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(topic.priority)}`}>
                          P{topic.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{topic.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Tag size={14} />
                          <span>{topic.tags.slice(0, 3).join(', ')}</span>
                        </div>
                        {topic.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date(topic.scheduledDate).toLocaleDateString('zh-CN')}</span>
                          </div>
                        )}
                        {topic.assignee && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{topic.assignee.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FileText size={14} />
                          <span>{topic.scripts.length} 个脚本</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{new Date(topic.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {scripts.map((script) => (
                <div key={script.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{script.topic.title}</h3>
                        <StatusBadge status={script.status} variant="script" />
                        <span className="text-sm text-gray-500">v{script.version}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{script.content}</p>
                      
                      {(script.readingFeedback || script.reviewOpinion) && (
                        <div className="mb-3 flex gap-4">
                          {script.readingFeedback && (
                            <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs font-medium text-blue-700 mb-1">阅读反馈</p>
                              <p className="text-sm text-blue-900 line-clamp-1">{script.readingFeedback}</p>
                            </div>
                          )}
                          {script.reviewOpinion && (
                            <div className="flex-1 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-xs font-medium text-yellow-700 mb-1">审稿意见</p>
                              <p className="text-sm text-yellow-900 line-clamp-1">{script.reviewOpinion}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {script.coverVersions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">封面版本 ({script.coverVersions.length})</p>
                          <div className="flex gap-2">
                            {script.coverVersions.slice(0, 5).map((cover: any) => (
                              <div key={cover.id} className="relative">
                                <img
                                  src={cover.imageUrl}
                                  alt={`v${cover.version}`}
                                  className={`w-16 h-10 object-cover rounded ${cover.isSelected ? 'ring-2 ring-purple-500' : ''}`}
                                />
                                <span className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                                  v{cover.version}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>{script.creator.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{new Date(script.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (activeTab === 'topics' ? topics.length === 0 : scripts.length === 0) && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'topics' ? <FileText className="w-8 h-8 text-gray-400" /> : <Video className="w-8 h-8 text-gray-400" />}
              </div>
              <p className="text-gray-500">暂无{activeTab === 'topics' ? '选题' : '脚本'}数据</p>
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
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        title="提交选题"
        size="lg"
      >
        <form onSubmit={handleSubmitTopic(onCreateTopic)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选题标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...registerTopic('title')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="输入选题标题"
            />
            {topicErrors.title && (
              <p className="mt-1 text-sm text-red-600">{topicErrors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选题描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...registerTopic('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="详细描述选题内容、目标受众、核心卖点等"
            />
            {topicErrors.description && (
              <p className="mt-1 text-sm text-red-600">{topicErrors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <input
                type="text"
                {...registerTopic('tags')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="多个标签用逗号分隔"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <select
                {...registerTopic('priority')}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                计划发布日期
              </label>
              <input
                type="date"
                {...registerTopic('scheduledDate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              <input
                type="date"
                {...registerTopic('deadline')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              负责人
            </label>
            <select
              {...registerTopic('assigneeId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="">请选择负责人</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'ADMIN' ? '管理员' : u.role === 'EDITOR_SUPERVISOR' ? '编辑主管' : u.role === 'EDITOR' ? '编辑' : '创作者'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setTopicModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              提交选题
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={scriptModalOpen}
        onClose={() => setScriptModalOpen(false)}
        title="提交脚本"
        size="lg"
      >
        <form onSubmit={handleSubmitScript(onCreateScript)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所属选题 <span className="text-red-500">*</span>
              </label>
              <select
                {...registerScript('topicId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">请选择选题</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              {scriptErrors.topicId && (
                <p className="mt-1 text-sm text-red-600">{scriptErrors.topicId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                版本号
              </label>
              <input
                type="text"
                {...registerScript('version')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="1.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              脚本内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...registerScript('content')}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono text-sm"
              placeholder="输入脚本内容，建议按场景分点描述..."
            />
            {scriptErrors.content && (
              <p className="mt-1 text-sm text-red-600">{scriptErrors.content.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预计时长（秒）
              </label>
              <input
                type="number"
                {...registerScript('duration')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                负责人
              </label>
              <select
                {...registerScript('assigneeId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">请选择负责人</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setScriptModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              提交脚本
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
