'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Calendar, User, Clock, AlertTriangle, FileText, XCircle, CheckCircle, AlertCircle, ChevronRight, MessageSquare } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import { anomaliesApi, topicsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { AnomalyType, AnomalyStatus, UserRole } from '@prisma/client'

const anomalySchema = z.object({
  type: z.enum(['SCHEDULE_CONFLICT', 'MATERIAL_MISSING', 'APPROVAL_DELAY', 'QUALITY_ISSUE', 'OTHER']),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  topicId: z.string().optional(),
  scriptId: z.string().optional(),
  conflictDetails: z.string().optional(),
})

const closeSchema = z.object({
  closeReason: z.string().min(1, '请填写办结原因'),
  closeResult: z.string().min(1, '请填写处理结果'),
})

type AnomalyForm = z.infer<typeof anomalySchema>
type CloseForm = z.infer<typeof closeSchema>

interface Anomaly {
  id: string
  type: AnomalyType
  title: string
  description: string
  status: AnomalyStatus
  conflictDetails: any
  closeReason: string | null
  closeResult: string | null
  closedAt: string | null
  creator: { id: string; name: string; avatarUrl: string | null }
  handler: { id: string; name: string; avatarUrl: string | null } | null
  topic: { id: string; title: string; scheduledDate: string | null } | null
  script: { id: string; version: string } | null
  createdAt: string
}

const typeConfig: Record<AnomalyType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  SCHEDULE_CONFLICT: {
    label: '排期冲突',
    icon: <Calendar size={18} />,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  MATERIAL_MISSING: {
    label: '素材缺失',
    icon: <FileText size={18} />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  APPROVAL_DELAY: {
    label: '审批延迟',
    icon: <Clock size={18} />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  QUALITY_ISSUE: {
    label: '质量问题',
    icon: <AlertCircle size={18} />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  OTHER: {
    label: '其他异常',
    icon: <AlertTriangle size={18} />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
}

export default function AnomaliesPage() {
  const { user } = useAuth()
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [groupedStats, setGroupedStats] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)

  const canClose = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR_SUPERVISOR

  const {
    register: registerAnomaly,
    handleSubmit: handleSubmitAnomaly,
    formState: { errors: anomalyErrors },
    reset: resetAnomaly,
  } = useForm<AnomalyForm>({
    resolver: zodResolver(anomalySchema),
  })

  const {
    register: registerClose,
    handleSubmit: handleSubmitClose,
    formState: { errors: closeErrors },
    reset: resetClose,
  } = useForm<CloseForm>({
    resolver: zodResolver(closeSchema),
  })

  useEffect(() => {
    loadData()
    loadGroupedStats()
    loadTopics()
  }, [page, keyword, typeFilter, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 10 }
      if (keyword) params.keyword = keyword
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter

      const res = await anomaliesApi.list(params)
      if (res.success) {
        setAnomalies(res.data.items)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
      }
    } catch (error) {
      console.error('加载异常失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGroupedStats = async () => {
    try {
      const res = await anomaliesApi.groupByType()
      if (res.success) {
        setGroupedStats(res.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
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

  const getCountByType = (type: string) => {
    const stat = groupedStats.find((s: any) => s.type === type)
    return stat?._count?.id || 0
  }

  const onCreate = async (data: AnomalyForm) => {
    try {
      const createData = {
        ...data,
        conflictDetails: data.conflictDetails ? JSON.parse(data.conflictDetails) : undefined,
      }
      await anomaliesApi.create(createData)
      setCreateModalOpen(false)
      resetAnomaly()
      loadData()
      loadGroupedStats()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const onClose = async (data: CloseForm) => {
    if (!selectedAnomaly) return
    try {
      await anomaliesApi.close(selectedAnomaly.id, data)
      setCloseModalOpen(false)
      resetClose()
      setSelectedAnomaly(null)
      loadData()
      loadGroupedStats()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const openCloseModal = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly)
    setCloseModalOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">异常池管理</h1>
            <p className="text-gray-500 mt-1">按类型归类异常，编辑主管负责办结处理</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            <span>上报异常</span>
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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${config.bgColor} ${config.color}`}>
                {config.icon}
              </div>
              <p className="font-medium text-gray-900">{config.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {getCountByType(type)}
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
              placeholder="搜索异常标题..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
          >
            <option value="">全部类型</option>
            {Object.entries(typeConfig).map(([type, config]) => (
              <option key={type} value={type}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
          >
            <option value="">全部状态</option>
            <option value="OPEN">待处理</option>
            <option value="PROCESSING">处理中</option>
            <option value="RESOLVED">已解决</option>
            <option value="CLOSED">已关闭</option>
          </select>

          <button
            onClick={() => { setTypeFilter(''); setStatusFilter(''); setKeyword(''); setPage(1) }}
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
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${anomaly.status === 'CLOSED' ? 'bg-gray-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[anomaly.type].bgColor} ${typeConfig[anomaly.type].color}`}>
                          {typeConfig[anomaly.type].icon}
                          {typeConfig[anomaly.type].label}
                        </span>
                        <StatusBadge status={anomaly.status} variant="anomaly" />
                        <h3 className={`font-semibold text-gray-900 ${anomaly.status === 'CLOSED' ? 'line-through text-gray-400' : ''}`}>
                          {anomaly.title}
                        </h3>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{anomaly.description}</p>

                      {anomaly.type === 'SCHEDULE_CONFLICT' && anomaly.conflictDetails && (
                        <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                            <Calendar size={12} /> 冲突详情
                          </p>
                          <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                            {typeof anomaly.conflictDetails === 'string'
                              ? anomaly.conflictDetails
                              : JSON.stringify(anomaly.conflictDetails, null, 2)}
                          </pre>
                        </div>
                      )}

                      {anomaly.topic && (
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="text-gray-400">关联选题:</span> {anomaly.topic.title}
                          {anomaly.topic.scheduledDate && (
                            <span className="ml-2">
                              (计划: {new Date(anomaly.topic.scheduledDate).toLocaleDateString('zh-CN')})
                            </span>
                          )}
                        </div>
                      )}

                      {anomaly.status === 'CLOSED' && (
                        <div className="mb-3 grid grid-cols-2 gap-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                              <MessageSquare size={12} /> 办结原因
                            </p>
                            <p className="text-sm text-blue-900">{anomaly.closeReason}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                              <CheckCircle size={12} /> 处理结果
                            </p>
                            <p className="text-sm text-green-900">{anomaly.closeResult}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>上报人: {anomaly.creator.name}</span>
                        </div>
                        {anomaly.handler && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>处理人: {anomaly.handler.name}</span>
                          </div>
                        )}
                        {anomaly.closedAt && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>办结时间: {new Date(anomaly.closedAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>创建时间: {new Date(anomaly.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {canClose && anomaly.status !== 'CLOSED' && (
                        <button
                          onClick={() => openCloseModal(anomaly)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={14} />
                          <span>办结</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && anomalies.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无异常记录</p>
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
        onClose={() => setCreateModalOpen(false)}
        title="上报异常"
        size="lg"
      >
        <form onSubmit={handleSubmitAnomaly(onCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                异常类型 <span className="text-red-500">*</span>
              </label>
              <select
                {...registerAnomaly('type')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {Object.entries(typeConfig).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联选题
              </label>
              <select
                {...registerAnomaly('topicId')}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              异常标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...registerAnomaly('title')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="简要描述异常"
            />
            {anomalyErrors.title && (
              <p className="mt-1 text-sm text-red-600">{anomalyErrors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...registerAnomaly('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="详细描述异常情况、影响范围等..."
            />
            {anomalyErrors.description && (
              <p className="mt-1 text-sm text-red-600">{anomalyErrors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              冲突详情 (JSON格式，排期冲突时填写)
            </label>
            <textarea
              {...registerAnomaly('conflictDetails')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono text-sm"
              placeholder='{"conflictingTopics": ["选题A", "选题B"], "conflictDate": "2024-01-15"}'
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              上报
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={closeModalOpen}
        onClose={() => { setCloseModalOpen(false); setSelectedAnomaly(null) }}
        title="办结异常"
        size="lg"
      >
        {selectedAnomaly && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[selectedAnomaly.type].bgColor} ${typeConfig[selectedAnomaly.type].color}`}>
                  {typeConfig[selectedAnomaly.type].icon}
                  {typeConfig[selectedAnomaly.type].label}
                </span>
                <StatusBadge status={selectedAnomaly.status} variant="anomaly" />
              </div>
              <p className="font-medium text-gray-900">{selectedAnomaly.title}</p>
              <p className="text-sm text-gray-600 mt-1">{selectedAnomaly.description}</p>
            </div>

            <form onSubmit={handleSubmitClose(onClose)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  办结原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...registerClose('closeReason')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  placeholder="请说明办结的原因..."
                />
                {closeErrors.closeReason && (
                  <p className="mt-1 text-sm text-red-600">{closeErrors.closeReason.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  处理结果 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...registerClose('closeResult')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  placeholder="请详细说明处理过程和最终结果..."
                />
                {closeErrors.closeResult && (
                  <p className="mt-1 text-sm text-red-600">{closeErrors.closeResult.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setCloseModalOpen(false); setSelectedAnomaly(null) }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  确认办结
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
