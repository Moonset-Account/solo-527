'use client'

import Link from 'next/link'
import { FileText, FileCheck2, Camera, Scissors, Plus, ClipboardList, AlertTriangle, BarChart3, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { TOPIC_STATUS_MAP, TASK_STATUS_MAP, EXCEPTION_STATUS_MAP } from '@/lib/types'

export default function DashboardPage() {
  const topics = useAppStore((s) => s.topics)
  const scripts = useAppStore((s) => s.scripts)
  const tasks = useAppStore((s) => s.tasks)
  const getTopicsByStatus = useAppStore((s) => s.getTopicsByStatus)
  const getTasksByStatus = useAppStore((s) => s.getTasksByStatus)
  const getExceptionsByStatus = useAppStore((s) => s.getExceptionsByStatus)

  const weeklyTopics = topics.length
  const completedScripts = scripts.filter((s) => s.status === 'approved').length
  const completedFilming = tasks.filter((t) => t.type === 'filming' && t.status === 'completed').length
  const completedEditing = tasks.filter((t) => t.type === 'editing' && t.status === 'completed').length

  const pendingExceptions = getExceptionsByStatus('pending')
  const processingExceptions = getExceptionsByStatus('processing')
  const pendingReviewTopics = getTopicsByStatus('pending_review')
  const pendingTasks = getTasksByStatus('pending')

  const cards = [
    { label: '本周选题数', value: weeklyTopics, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
    { label: '脚本完成数', value: completedScripts, icon: FileCheck2, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+8%' },
    { label: '拍摄完成数', value: completedFilming, icon: Camera, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+5%' },
    { label: '剪辑完成数', value: completedEditing, icon: Scissors, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+15%' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">工作台</h1>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.bg} ${card.color} mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <span className="absolute top-5 right-5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {card.trend}
            </span>
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {pendingExceptions.length > 0 && (
        <Link
          href="/exceptions"
          className="block bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl p-4 shadow-sm hover:from-red-700 hover:to-red-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <span className="font-semibold">
                待处理异常告警：{pendingExceptions.length} 条
              </span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">待办提醒</h2>
          </div>
          <div className="p-4 space-y-2">
            {pendingReviewTopics.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">待审批选题</div>
                {pendingReviewTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-1 h-8 rounded-full bg-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{topic.title}</div>
                      <div className="text-xs text-gray-400">{topic.creator_name} · {new Date(topic.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TOPIC_STATUS_MAP[topic.status].color}`}>
                      {TOPIC_STATUS_MAP[topic.status].label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
            {pendingTasks.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">待分派任务</div>
                {pendingTasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-1 h-8 rounded-full bg-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{task.description}</div>
                      <div className="text-xs text-gray-400">{task.topic_title} · {task.type === 'filming' ? '拍摄' : '剪辑'}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TASK_STATUS_MAP[task.status].color}`}>
                      {TASK_STATUS_MAP[task.status].label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
            {pendingReviewTopics.length === 0 && pendingTasks.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">暂无待办事项</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">异常列表</h2>
          </div>
          <div className="p-4 space-y-2">
            {[...pendingExceptions, ...processingExceptions].map((ex) => (
              <Link
                key={ex.id}
                href="/exceptions"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-1 h-8 rounded-full shrink-0 ${ex.status === 'pending' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    敏感词「{ex.sensitive_word}」
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {ex.topic_title} · {new Date(ex.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${EXCEPTION_STATUS_MAP[ex.status].color}`}>
                  {EXCEPTION_STATUS_MAP[ex.status].label}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
              </Link>
            ))}
            {pendingExceptions.length === 0 && processingExceptions.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">暂无异常</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-4 gap-4">
          <Link
            href="/topics/new"
            className="flex flex-col items-center gap-2 py-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-700">新建选题</span>
          </Link>
          <Link
            href="/tasks"
            className="flex flex-col items-center gap-2 py-4 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-violet-700">分派任务</span>
          </Link>
          <Link
            href="/exceptions"
            className="flex flex-col items-center gap-2 py-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-red-700">异常处理</span>
          </Link>
          <Link
            href="/reports"
            className="flex flex-col items-center gap-2 py-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-emerald-700">导出报表</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
