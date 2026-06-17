'use client'

import Link from 'next/link'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, StatCard, EmptyState } from '@/components/ui'
import { TopicStatusBadge, DamageStatusBadge } from '@/components/Badges'
import { formatDateShort } from '@/lib/utils'

const adminNavItems = [
  { href: '/admin', label: '📊 仪表盘', active: true },
  { href: '/admin/users', label: '👥 用户权限' },
  { href: '/admin/voting-rules', label: '⚙️ 投票规则' },
  { href: '/admin/audit', label: '📜 审计日志' },
]

export default function AdminDashboardPage() {
  const { data, isLoading } = trpc.admin.dashboardStats.useQuery()

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">⚙️ 后台管理</h1>
        <p className="mt-1 text-sm text-slate-500">社区管理中心 - 居民代表操作面板</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {adminNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              item.active
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}><CardBody><div className="h-16 animate-pulse rounded bg-slate-100" /></CardBody></Card>
          ))}
        </div>
      ) : !data ? (
        <EmptyState icon="⚙️" title="数据加载失败" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon="👥" label="注册用户" value={data.userCount} tone="emerald" />
            <StatCard icon="🗳️" label="议题总数" value={data.topicCount} tone="blue" />
            <StatCard icon="✅" label="进行中投票" value={data.votingTopicCount} tone="purple" />
            <StatCard icon="🏢" label="设施总数" value={data.facilityCount} tone="amber" />
            <StatCard icon="⚠️" label="待办维修" value={data.pendingDamages} tone="rose" />
            <StatCard icon="🤝" label="志愿任务" value={data.volunteerTaskCount} tone="blue" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>📢 最近议题</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {data.recentTopics.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">暂无议题</p>
                ) : data.recentTopics.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900 truncate">{t.title}</p>
                        <TopicStatusBadge status={t.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDateShort(t.createdAt)} · {t._count.votes} 票
                      </p>
                    </div>
                    <Link href={`/topics/${t.id}`} className="text-sm text-rose-600 hover:text-rose-700 shrink-0">
                      查看 →
                    </Link>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚠️ 最近维修上报</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {data.recentDamages.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">暂无维修上报</p>
                ) : data.recentDamages.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900 truncate">{r.title}</p>
                        <DamageStatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        🏢 {r.facility.name} · 📍 {r.facility.location}
                      </p>
                    </div>
                    <Link href={`/facilities/${r.facilityId}`} className="text-sm text-rose-600 hover:text-rose-700 shrink-0">
                      处理 →
                    </Link>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
