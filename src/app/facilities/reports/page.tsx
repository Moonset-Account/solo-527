'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Select } from '@/components/ui'
import { DamageStatusBadge } from '@/components/Badges'
import { formatDate } from '@/lib/utils'

const statusFilters = [
  { value: undefined, label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'ASSIGNED', label: '已分配' },
  { value: 'IN_PROGRESS', label: '处理中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'REVIEWED', label: '已复查' },
] as const

export default function DamageReportsPage() {
  const [status, setStatus] = useState<typeof statusFilters[number]['value']>(undefined)
  const { data, isLoading } = trpc.facility.listDamageReports.useQuery({ status })

  const priorityLabel = (p: number) => p >= 4 ? '高' : p === 3 ? '中' : '低'
  const priorityClass = (p: number) =>
    p >= 4 ? 'bg-rose-100 text-rose-700' :
    p === 3 ? 'bg-amber-100 text-amber-700' :
    'bg-slate-100 text-slate-600'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📋 损坏报修记录</h1>
          <p className="mt-1 text-sm text-slate-500">全部设施损坏上报与处理进度</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.value ?? 'all'}
            onClick={() => setStatus(f.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === f.value
                ? 'bg-rose-600 text-white shadow-sm'
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
            <Card key={i}><CardBody><div className="h-20 animate-pulse rounded bg-slate-100" /></CardBody></Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon="📋" title="暂无报修记录" description="当前没有符合条件的报修" />
      ) : (
        <div className="grid gap-3">
          {data.map(r => (
            <Link key={r.id} href={`/facilities/${r.facilityId}`} className="group block">
              <Card className="transition-all group-hover:border-rose-200 group-hover:shadow-sm">
                <CardBody className="!p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 group-hover:text-rose-700 transition-colors truncate">
                          {r.title}
                        </h4>
                        <DamageStatusBadge status={r.status} />
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass(r.priority)}`}>
                          {priorityLabel(r.priority)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-1">{r.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>🏢 {r.facility.name}</span>
                        <span>📍 {r.facility.location}</span>
                        <span>👤 {r.reporter?.name || '匿名'}</span>
                        <span>📅 {formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    <span className="hidden sm:block text-slate-400 group-hover:text-rose-600 transition-colors">→</span>
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
