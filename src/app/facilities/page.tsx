'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Button, LinkButton } from '@/components/ui'
import { FacilityStatusBadge } from '@/components/Badges'

const statusFilters = [
  { value: undefined, label: '全部' },
  { value: 'NORMAL', label: '正常' },
  { value: 'DAMAGED', label: '损坏' },
  { value: 'UNDER_REPAIR', label: '维修中' },
  { value: 'REPAIRED', label: '已修复' },
  { value: 'RECTIFIED', label: '已整改' },
] as const

export default function FacilitiesPage() {
  const [status, setStatus] = useState<typeof statusFilters[number]['value']>(undefined)
  const { data, isLoading } = trpc.facility.list.useQuery({ status, limit: 100 })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🏢 设施管理</h1>
          <p className="mt-1 text-sm text-slate-500">公共设施台账、照片维护与损坏上报</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/facilities/reports" variant="secondary">
            📋 损坏报修记录
          </LinkButton>
          <LinkButton href="/facilities/new">+ 添加设施</LinkButton>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.value ?? 'all'}
            onClick={() => setStatus(f.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === f.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardBody>
                <div className="h-32 w-full animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="暂无设施"
          description="当前没有符合条件的设施"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map(facility => (
            <Link
              key={facility.id}
              href={`/facilities/${facility.id}`}
              className="group block"
            >
              <Card className="h-full overflow-hidden transition-all group-hover:border-blue-300 group-hover:shadow-md">
                <div className="relative h-36 bg-gradient-to-br from-blue-100 to-slate-100 flex items-center justify-center overflow-hidden">
                  {facility._count.photos > 0 ? (
                    <div className="text-center">
                      <div className="text-4xl">🖼️</div>
                      <div className="text-xs text-slate-500 mt-1">{facility._count.photos} 张照片</div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <div className="text-4xl">🏗️</div>
                      <div className="text-xs mt-1">暂无照片</div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <FacilityStatusBadge status={facility.status} />
                  </div>
                </div>
                <CardBody className="py-3">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                    {facility.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 truncate">📍 {facility.location}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{facility.type}</span>
                    <span>{facility._count.damageReports} 次报修</span>
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
