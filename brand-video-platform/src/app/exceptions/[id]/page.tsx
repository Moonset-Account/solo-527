'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { EXCEPTION_STATUS_MAP } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, FileText, User } from 'lucide-react'

export default function ExceptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const exception = useAppStore((s) => s.exceptions.find((e) => e.id === id))
  const updateExceptionStatus = useAppStore((s) => s.updateExceptionStatus)
  const resolveException = useAppStore((s) => s.resolveException)
  const getTopicById = useAppStore((s) => s.getTopicById)

  const [conclusion, setConclusion] = useState('')

  if (!exception) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">未找到该异常记录</p>
          <Link href="/exceptions" className="text-blue-600 hover:underline text-sm">
            返回异常记录列表
          </Link>
        </div>
      </div>
    )
  }

  const relatedTopic = exception.topic_id ? getTopicById(exception.topic_id) : undefined

  const highlightSnippet = (snippet: string, word: string) => {
    const parts = snippet.split(new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === word.toLowerCase() ? (
        <span key={i} className="text-red-600 font-bold">{part}</span>
      ) : (
        part
      )
    )
  }

  const handleStartProcessing = () => {
    updateExceptionStatus(id, 'processing')
  }

  const handleSubmitConclusion = () => {
    if (!conclusion.trim()) return
    resolveException(id, conclusion.trim())
    setConclusion('')
  }

  const statusIcon = {
    pending: <AlertTriangle className="w-5 h-5 text-red-500" />,
    processing: <Clock className="w-5 h-5 text-amber-500" />,
    resolved: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              {statusIcon[exception.status]}
              <h2 className="text-xl font-bold text-gray-900">{exception.topic_title ?? '未关联选题'}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EXCEPTION_STATUS_MAP[exception.status].color}`}>
                {EXCEPTION_STATUS_MAP[exception.status].label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">敏感词</div>
                  <div className="text-sm font-semibold text-red-600">{exception.sensitive_word}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">命中内容</div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {highlightSnippet(exception.content_snippet, exception.sensitive_word)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">异常类型</div>
                  <div className="text-sm text-gray-700">敏感词命中</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">创建时间</div>
                  <div className="text-sm text-gray-700">{formatDateTime(exception.created_at)}</div>
                </div>
                {exception.handler_name && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">处理人</div>
                    <div className="text-sm text-gray-700">{exception.handler_name}</div>
                  </div>
                )}
                {exception.resolved_at && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">解决时间</div>
                    <div className="text-sm text-gray-700">{formatDateTime(exception.resolved_at)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">处理结论</h3>

            {exception.status === 'pending' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartProcessing}
                  className="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  开始处理
                </button>
                <span className="text-xs text-gray-400">点击后将进入处理中状态</span>
              </div>
            )}

            {exception.status === 'processing' && (
              <div className="space-y-3">
                <textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="请输入处理结论..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleSubmitConclusion}
                  disabled={!conclusion.trim()}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交结论
                </button>
              </div>
            )}

            {exception.status === 'resolved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="text-sm text-green-800">{exception.conclusion}</div>
                <div className="flex items-center gap-4 text-xs text-green-600">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {exception.handler_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {exception.resolved_at && formatDateTime(exception.resolved_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedTopic && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">关联选题信息</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">选题标题</div>
                <div className="text-sm text-gray-700">{relatedTopic.title}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">品牌线</div>
                <div className="text-sm text-gray-700">{relatedTopic.brand_line}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">创建人</div>
                <div className="text-sm text-gray-700">{relatedTopic.creator_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">目标平台</div>
                <div className="text-sm text-gray-700">{relatedTopic.target_platform.join('、')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
