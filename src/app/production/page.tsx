'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Calendar, User, Clock, Download, Filter, BarChart3, FileText, AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import { productionApi, exportsApi, usersApi, topicsApi, materialsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { ExportStatus, ExportFormat, UserRole } from '@prisma/client'

const productionSchema = z.object({
  date: z.string().min(1, '请选择日期'),
  topicId: z.string().optional(),
  materialId: z.string().optional(),
  contentType: z.string().min(1, '请输入内容类型'),
  outputCount: z.coerce.number().min(0, '产出数量不能为负').default(0),
  videoDuration: z.coerce.number().optional(),
  qualityScore: z.coerce.number().min(1).max(100).optional(),
  tags: z.string().transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  remarks: z.string().optional(),
})

const exportSchema = z.object({
  name: z.string().min(1, '请输入导出任务名称'),
  description: z.string().optional(),
  format: z.enum(['CSV', 'EXCEL', 'PDF']).default('CSV'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
  contentType: z.string().optional(),
  minQuality: z.coerce.number().optional(),
  maxQuality: z.coerce.number().optional(),
})

type ProductionForm = z.infer<typeof productionSchema>
type ExportForm = z.infer<typeof exportSchema>

interface ProductionRecord {
  id: string
  date: string
  contentType: string
  outputCount: number
  videoDuration: number | null
  qualityScore: number | null
  tags: string[]
  remarks: string | null
  user: { id: string; name: string; avatarUrl: string | null }
  topic: { id: string; title: string } | null
  material: { id: string; name: string; type: string } | null
  createdAt: string
}

interface ExportTask {
  id: string
  name: string
  description: string | null
  format: ExportFormat
  status: ExportStatus
  progress: number
  totalRecords: number
  processedRecords: number
  errorMessage: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  createdAt: string
  completedAt: string | null
}

export default function ProductionPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    contentType: '',
    minQuality: '',
    maxQuality: '',
  })

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportProgressOpen, setExportProgressOpen] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const {
    register: registerProduction,
    handleSubmit: handleSubmitProduction,
    formState: { errors: productionErrors },
    reset: resetProduction,
    watch,
    setValue,
  } = useForm<ProductionForm>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      outputCount: 0,
    },
  })

  const {
    register: registerExport,
    handleSubmit: handleSubmitExport,
    formState: { errors: exportErrors },
    reset: resetExport,
  } = useForm<ExportForm>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      name: '',
      format: 'CSV',
    },
  })

  const watchTopicId = watch('topicId')

  useEffect(() => {
    loadData()
    loadUsers()
    loadTopics()
    loadMaterials()
  }, [page, filters])

  useEffect(() => {
    if (watchTopicId) {
      loadMaterialsForTopic(watchTopicId)
    }
  }, [watchTopicId])

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 10, ...filters }
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const res = await productionApi.list(params)
      if (res.success) {
        setRecords(res.data.items)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
      }
    } catch (error) {
      console.error('加载产能记录失败:', error)
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

  const loadMaterials = async () => {
    try {
      const res = await materialsApi.list({ pageSize: 100 })
      if (res.success) {
        setMaterials(res.data.items)
      }
    } catch (error) {
      console.error('加载素材失败:', error)
    }
  }

  const loadMaterialsForTopic = async (topicId: string) => {
    try {
      const res = await materialsApi.list({ topicId, pageSize: 100 })
      if (res.success) {
        setMaterials(res.data.items)
      }
    } catch (error) {
      console.error('加载素材失败:', error)
    }
  }

  const loadExportTasks = async () => {
    try {
      const res = await exportsApi.list({ pageSize: 10 })
      if (res.success) {
        setExportTasks(res.data.items)
      }
    } catch (error) {
      console.error('加载导出任务失败:', error)
    }
  }

  const startPolling = () => {
    loadExportTasks()
    const interval = setInterval(() => {
      loadExportTasks()
    }, 3000)
    setPollingInterval(interval)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  const onCreate = async (data: ProductionForm) => {
    try {
      await productionApi.create(data)
      setCreateModalOpen(false)
      resetProduction()
      setValue('topicId', '')
      setMaterials([])
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const onExport = async (data: ExportForm) => {
    setExportLoading(true)
    try {
      const filters: any = {}
      if (data.startDate) filters.startDate = data.startDate
      if (data.endDate) filters.endDate = data.endDate
      if (data.userId) filters.userId = data.userId
      if (data.contentType) filters.contentType = data.contentType
      if (data.minQuality) filters.minQuality = data.minQuality
      if (data.maxQuality) filters.maxQuality = data.maxQuality

      await exportsApi.create({
        name: data.name,
        description: data.description,
        format: data.format,
        filters,
      })

      setExportModalOpen(false)
      resetExport()
      setExportProgressOpen(true)
      startPolling()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setExportLoading(false)
    }
  }

  const applyFilters = () => {
    setPage(1)
    loadData()
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      contentType: '',
      minQuality: '',
      maxQuality: '',
    })
    setPage(1)
  }

  const getStatusIcon = (status: ExportStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'PROCESSING':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const contentTypes = ['短视频', '长视频', '图文', '直播', '海报', '其他']

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">产能记录</h1>
            <p className="text-gray-500 mt-1">记录内容产出数据，支持筛选和批量导出</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setExportProgressOpen(true); startPolling() }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 size={18} />
              <span>导出任务</span>
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} />
              <span>导出数据</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              <span>新增记录</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={18} className="text-gray-500" />
            <span className="font-medium text-gray-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">用户</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option value="">全部用户</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">内容类型</label>
              <select
                value={filters.contentType}
                onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option value="">全部类型</option>
                {contentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">最低质量分</label>
              <input
                type="number"
                min="1"
                max="100"
                value={filters.minQuality}
                onChange={(e) => setFilters({ ...filters, minQuality: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="1-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">最高质量分</label>
              <input
                type="number"
                min="1"
                max="100"
                value={filters.maxQuality}
                onChange={(e) => setFilters({ ...filters, maxQuality: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="1-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              清除筛选
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">总记录数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">总产出数</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {records.reduce((sum, r) => sum + r.outputCount, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">总视频时长(秒)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {records.reduce((sum, r) => sum + (r.videoDuration || 0), 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">平均质量分</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {records.filter(r => r.qualityScore).length > 0
                ? (records.filter(r => r.qualityScore).reduce((sum, r) => sum + (r.qualityScore || 0), 0) / records.filter(r => r.qualityScore).length).toFixed(1)
                : '-'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产出数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">视频时长</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">质量分</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联选题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {record.contentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {record.outputCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.videoDuration ? `${record.videoDuration}秒` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.qualityScore ? (
                          <span className={`font-medium ${
                            record.qualityScore >= 80 ? 'text-green-600' :
                            record.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {record.qualityScore}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.topic?.title || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {record.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {record.tags.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              +{record.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && records.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无产能记录</p>
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
        onClose={() => { setCreateModalOpen(false); setMaterials([]) }}
        title="新增产能记录"
        size="lg"
      >
        <form onSubmit={handleSubmitProduction(onCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...registerProduction('date')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              {productionErrors.date && (
                <p className="mt-1 text-sm text-red-600">{productionErrors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容类型 <span className="text-red-500">*</span>
              </label>
              <select
                {...registerProduction('contentType')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">请选择内容类型</option>
                {contentTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {productionErrors.contentType && (
                <p className="mt-1 text-sm text-red-600">{productionErrors.contentType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联选题
              </label>
              <select
                {...registerProduction('topicId')}
                onChange={(e) => {
                  registerProduction('topicId').onChange(e)
                  setValue('materialId', '')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">请选择选题</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联素材
              </label>
              <select
                {...registerProduction('materialId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                disabled={!watchTopicId}
              >
                <option value="">请选择素材</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                产出数量
              </label>
              <input
                type="number"
                {...registerProduction('outputCount')}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                视频时长(秒)
              </label>
              <input
                type="number"
                {...registerProduction('videoDuration')}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                质量分(1-100)
              </label>
              <input
                type="number"
                {...registerProduction('qualityScore')}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <input
              type="text"
              {...registerProduction('tags')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="多个标签用逗号分隔"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              {...registerProduction('remarks')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="输入备注信息..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setCreateModalOpen(false); setMaterials([]) }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="导出产能数据"
        size="lg"
      >
        <form onSubmit={handleSubmitExport(onExport)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...registerExport('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="产能数据导出"
              />
              {exportErrors.name && (
                <p className="mt-1 text-sm text-red-600">{exportErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                导出格式
              </label>
              <select
                {...registerExport('format')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="CSV">CSV</option>
                <option value="EXCEL">Excel</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务描述
            </label>
            <textarea
              {...registerExport('description')}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="可选，描述导出目的..."
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">导出筛选条件（与当前页面筛选一致）</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                <input
                  type="date"
                  {...registerExport('startDate')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                <input
                  type="date"
                  {...registerExport('endDate')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">用户</label>
                <select
                  {...registerExport('userId')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
                >
                  <option value="">全部用户</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">内容类型</label>
                <select
                  {...registerExport('contentType')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
                >
                  <option value="">全部类型</option>
                  {contentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最低质量分</label>
                <input
                  type="number"
                  {...registerExport('minQuality')}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最高质量分</label>
                <input
                  type="number"
                  {...registerExport('maxQuality')}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              导出量大时将进入任务队列处理，您可以在「导出任务」中查看进度和结果。
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {exportLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {exportLoading ? '提交中...' : '提交导出'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={exportProgressOpen}
        onClose={() => { setExportProgressOpen(false); stopPolling() }}
        title="导出任务"
        size="xl"
      >
        <div className="space-y-4">
          {exportTasks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无导出任务</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(task.status)}
                        <span className="font-medium text-gray-900">{task.name}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {task.format}
                        </span>
                        <StatusBadge status={task.status} variant="export" />
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500">{task.description}</p>
                      )}
                    </div>
                    {task.status === 'COMPLETED' && task.fileUrl && (
                      <button
                        onClick={async () => {
                          try {
                            await exportsApi.download(task.id, task.fileName || '产能记录.csv')
                          } catch (err: any) {
                            alert(err.message || '下载失败')
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download size={14} />
                        下载文件
                      </button>
                    )}
                  </div>

                  {(task.status === 'PROCESSING' || task.status === 'PENDING') && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                        <span>处理进度</span>
                        <span>{task.processedRecords} / {task.totalRecords || '计算中...'}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{task.progress}%</p>
                    </div>
                  )}

                  {task.status === 'FAILED' && task.errorMessage && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                        <AlertCircle size={12} /> 失败原因
                      </p>
                      <p className="text-sm text-red-800">{task.errorMessage}</p>
                    </div>
                  )}

                  {task.status === 'COMPLETED' && (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {task.fileSize && (
                        <span>文件大小: {formatFileSize(task.fileSize)}</span>
                      )}
                      {task.completedAt && (
                        <span>完成时间: {new Date(task.completedAt).toLocaleString('zh-CN')}</span>
                      )}
                      <span>导出记录: {task.totalRecords} 条</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                    <span>创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  )
}
