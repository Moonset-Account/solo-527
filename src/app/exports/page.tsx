'use client'

import React, { useState, useEffect } from 'react'
import { Download, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import { exportsApi } from '@/lib/api'
import { ExportStatus, ExportFormat } from '@prisma/client'

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

export default function ExportsPage() {
  const [tasks, setTasks] = useState<ExportTask[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
    startPolling()
    return () => stopPolling()
  }, [page])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exportsApi.list({ page, pageSize: 10 })
      if (res.success) {
        setTasks(res.data.items)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
      }
    } catch (error) {
      console.error('加载导出任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    stopPolling()
    const interval = setInterval(() => {
      loadData()
    }, 5000)
    setPollingInterval(interval)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  const getStatusIcon = (status: ExportStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-gray-500" />
      case 'PROCESSING':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    processing: tasks.filter(t => t.status === 'PROCESSING').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    failed: tasks.filter(t => t.status === 'FAILED').length,
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">导出任务</h1>
            <p className="text-gray-500 mt-1">查看导出任务进度，下载已完成的文件</p>
          </div>
          <button
            onClick={() => { loadData(); startPolling() }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            <span>刷新</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">全部</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">等待中</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-xl font-bold text-blue-600">{stats.processing}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">失败</p>
                <p className="text-xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : (
            <div className="divide-y">
              {tasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(task.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">{task.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {task.format}
                          </span>
                          <StatusBadge status={task.status} variant="export" />
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-500">{task.description}</p>
                        )}
                      </div>
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
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download size={16} />
                        下载文件
                      </button>
                    )}
                  </div>

                  {(task.status === 'PROCESSING' || task.status === 'PENDING') && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>处理进度</span>
                        <span className="font-medium">
                          {task.processedRecords} / {task.totalRecords || '计算中...'}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{task.progress}%</span>
                        {task.status === 'PROCESSING' && (
                          <span className="text-blue-600">正在处理，请耐心等待...</span>
                        )}
                      </div>
                    </div>
                  )}

                  {task.status === 'FAILED' && task.errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">导出失败</p>
                          <p className="text-sm text-red-700 mt-1">{task.errorMessage}</p>
                          <p className="text-xs text-red-500 mt-2">
                            您可以重新提交导出任务，或联系技术支持解决问题。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {task.status === 'COMPLETED' && (
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      {task.fileSize && (
                        <div className="flex items-center gap-1">
                          <Download size={14} />
                          <span>文件大小: {formatFileSize(task.fileSize)}</span>
                        </div>
                      )}
                      {task.completedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle size={14} />
                          <span>完成时间: {new Date(task.completedAt).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>导出记录: {task.totalRecords} 条</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-xs text-gray-400 mt-3">
                    <span>创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                    <span>任务ID: {task.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无导出任务</p>
              <p className="text-sm text-gray-400 mt-1">
                您可以在「产能记录」页面提交导出任务
              </p>
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
    </AppLayout>
  )
}
