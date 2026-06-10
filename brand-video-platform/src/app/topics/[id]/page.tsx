'use client'

import { use, useEffect } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { TOPIC_STATUS_MAP, TASK_STATUS_MAP } from '@/lib/types'
import { TIMELINE_ICON_MAP } from '@/lib/utils'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft,
  PlusCircle,
  CheckCircle,
  XCircle,
  FileText,
  FileCheck,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  CalendarPlus,
  Send,
  Check,
  X,
} from 'lucide-react'

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  PlusCircle,
  CheckCircle,
  XCircle,
  FileText,
  FileCheck,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  CalendarPlus,
  Send,
}

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const {
    getTopicById,
    getTimelineByTopicId,
    getScriptsByTopicId,
    getTasksByTopicId,
    updateTopicStatus,
    addScript,
    addTimelineEvent,
    loadTopicScripts,
    loadTopicTimeline,
    profiles,
    currentUserId,
  } = useAppStore()

  const topicId = id

  useEffect(() => {
    loadTopicScripts(topicId)
    loadTopicTimeline(topicId)
  }, [topicId])

  const topic = getTopicById(id)
  const timeline = getTimelineByTopicId(id)
  const scripts = getScriptsByTopicId(id)
  const tasks = getTasksByTopicId(id)

  if (!topic) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/topics" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-500">选题未找到</h1>
        </div>
        <div className="card p-12 text-center text-surface-400">该选题不存在或已被删除</div>
      </div>
    )
  }

  const currentUser = profiles.find((p) => p.id === currentUserId)

  const handleApprove = async () => {
    await updateTopicStatus(id, 'approved', currentUserId)
    addTimelineEvent({
      topic_id: id,
      event_type: 'topic_approved',
      actor_id: currentUserId,
      actor_name: currentUser?.display_name || '',
      description: `审批通过选题：${topic.title}`,
      metadata: {},
    })
    await addScript({
      topic_id: id,
      content: '',
      version: 1,
      status: 'draft',
      author_id: currentUserId,
      author_name: currentUser?.display_name || '',
    })
  }

  const handleReject = async () => {
    await updateTopicStatus(id, 'rejected', currentUserId)
    addTimelineEvent({
      topic_id: id,
      event_type: 'topic_rejected',
      actor_id: currentUserId,
      actor_name: currentUser?.display_name || '',
      description: `驳回选题：${topic.title}`,
      metadata: {},
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/topics" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-brand-500">{topic.title}</h1>
        <span className={`status-badge ${TOPIC_STATUS_MAP[topic.status].color}`}>
          {TOPIC_STATUS_MAP[topic.status].label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="section-title mb-4">时间轴</h2>
            <div className="relative">
              {timeline.length > 1 && <div className="timeline-line" />}
              <div className="space-y-5">
                {timeline.map((event) => {
                  const iconConfig = TIMELINE_ICON_MAP[event.event_type]
                  const IconComp = iconConfig ? ICON_COMPONENTS[iconConfig.icon] : PlusCircle
                  return (
                    <div key={event.id} className="relative flex items-start gap-3">
                      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-surface-200 flex items-center justify-center ${iconConfig?.color || 'text-gray-500'}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium text-brand-500">{event.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-surface-400">{formatDateTime(event.created_at)}</span>
                          <span className="text-xs text-surface-400">·</span>
                          <span className="text-xs text-surface-400">{event.actor_name}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {timeline.length === 0 && (
                <p className="text-sm text-surface-400 text-center py-8">暂无时间线记录</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="section-title mb-4">基本信息</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs text-surface-400 mb-0.5">品牌线</dt>
                <dd className="text-sm font-medium text-brand-500">{topic.brand_line}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 mb-0.5">创建人</dt>
                <dd className="text-sm text-brand-500">{topic.creator_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 mb-0.5">目标平台</dt>
                <dd className="text-sm text-brand-500">{topic.target_platform.join('、')}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 mb-0.5">创建日期</dt>
                <dd className="text-sm text-brand-500">{formatDate(topic.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 mb-0.5">期望发布日期</dt>
                <dd className="text-sm text-brand-500">{topic.expected_publish_date || '未设定'}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 mb-0.5">标签</dt>
                <dd className="flex flex-wrap gap-1">
                  {topic.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-accent-50 text-accent-600 border border-accent-200">{tag}</span>
                  ))}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-surface-400 mb-0.5">描述</dt>
                <dd className="text-sm text-brand-500">{topic.description}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">脚本列表</h2>
              <Link href={`/topics/${id}/script`} className="btn-ghost text-xs">
                <FileText className="w-3.5 h-3.5" />
                新建脚本
              </Link>
            </div>
            {scripts.length > 0 ? (
              <div className="space-y-3">
                {scripts.map((script) => (
                  <div key={script.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-surface-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium text-brand-500">版本 v{script.version}</p>
                        <p className="text-xs text-surface-400">更新于 {formatDateTime(script.updated_at)}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${script.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : script.status === 'draft' ? 'bg-gray-100 text-gray-700' : script.status === 'submitted' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {script.status === 'approved' ? '已通过' : script.status === 'draft' ? '草稿' : script.status === 'submitted' ? '已提交' : '需修改'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400 text-center py-6">暂无脚本</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">任务列表</h2>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${task.type === 'filming' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {task.type === 'filming' ? '拍' : '剪'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-500">{task.assignee_name || '待分派'}</p>
                        <p className="text-xs text-surface-400">{task.description}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${TASK_STATUS_MAP[task.status].color}`}>
                      {TASK_STATUS_MAP[task.status].label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400 text-center py-6">暂无任务</p>
            )}
          </div>
        </div>
      </div>

      {topic.status === 'pending_review' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-end gap-3">
            <button className="btn-secondary" onClick={handleReject}>
              <X className="w-4 h-4" />
              驳回
            </button>
            <button className="btn-primary" onClick={handleApprove}>
              <Check className="w-4 h-4" />
              通过
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
