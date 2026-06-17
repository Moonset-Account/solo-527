'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Button, LinkButton } from '@/components/ui'
import { TopicStatusBadge } from '@/components/Badges'
import { formatDate } from '@/lib/utils'

const statusFilters = [
  { value: undefined, label: '全部' },
  { value: 'VOTING', label: '投票中' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'CLOSED', label: '已结束' },
] as const

export default function TopicsPage() {
  const [status, setStatus] = useState<typeof statusFilters[number]['value']>(undefined)
  const { data, isLoading } = trpc.topic.list.useQuery({ status, limit: 50 })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🗳️ 议题投票</h1>
          <p className="mt-1 text-sm text-slate-500">参与社区公共事务的民主协商与投票</p>
        </div>
        <LinkButton href="/topics/new">+ 发起新议题</LinkButton>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.value ?? 'all'}
            onClick={() => setStatus(f.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === f.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardBody>
                <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon="🗳️"
          title="暂无议题"
          description="当前没有符合条件的议题，试试切换筛选条件"
        />
      ) : (
        <div className="grid gap-4">
          {data?.items.map(topic => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="group block"
            >
              <Card className="transition-all group-hover:border-emerald-300 group-hover:shadow-md">
                <CardBody>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {topic.title}
                        </h3>
                        <TopicStatusBadge status={topic.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">{topic.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>📊 {topic._count.votes} 票</span>
                        {topic.startAt && <span>📅 开始: {formatDate(topic.startAt)}</span>}
                        {topic.endAt && <span>⏰ 截止: {formatDate(topic.endAt)}</span>}
                        {topic.voteType === 'SINGLE' && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">单选</span>}
                        {topic.voteType === 'MULTIPLE' && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">多选</span>}
                        {topic.voteType === 'RANKED' && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">排序</span>}
                        {topic.isAnonymous && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">匿名</span>}
                      </div>
                    </div>
                    <span className="hidden sm:block text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
