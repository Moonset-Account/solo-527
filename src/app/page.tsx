'use client'

import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardBody, CardHeader, CardTitle, StatCard, LinkButton } from '@/components/ui'

export default function HomePage() {
  const { isSignedIn } = useAuth()
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
            居民议题协商投票站
          </h1>
          <p className="mt-3 text-sm text-emerald-50 sm:text-base">
            共建美好家园 · 民主协商 · 共同决策 · 志愿服务
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton
              href="/topics"
              className="!bg-white !text-emerald-700 hover:!bg-emerald-50"
            >
              🗳️ 参与议题投票
            </LinkButton>
            <LinkButton
              href="/volunteer"
              className="!bg-emerald-700/40 !text-white !border-emerald-300 hover:!bg-emerald-700/60"
            >
              🤝 我要报名志愿服务
            </LinkButton>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl" />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard icon="🗳️" label="进行中的议题" value="3" subtext="点击查看详情" tone="emerald" />
        <StatCard icon="🏢" label="公共设施" value="12" subtext="2处待维护" tone="blue" />
        <StatCard icon="📋" label="待办维修" value="5" subtext="2项高优先级" tone="amber" />
        <StatCard icon="🤝" label="本月志愿服务" value="48" subtext="累计126小时" tone="purple" />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>📢 最新议题</CardTitle>
            <Link href="/topics" className="text-sm text-emerald-600 hover:text-emerald-700">
              查看全部 →
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            <TopicCard
              title="小区东大门门禁系统改造方案"
              desc="计划更换人脸识别门禁，讨论是否全面启用或保留刷卡功能。"
              status="投票中"
              votes={87}
              deadline="3天后截止"
              color="emerald"
            />
            <TopicCard
              title="社区儿童游乐设施更新选址"
              desc="现有设施老旧，讨论新设施安放位置及预算分配。"
              status="投票中"
              votes={64}
              deadline="5天后截止"
              color="emerald"
            />
            <TopicCard
              title="楼道公共区域照明节能改造"
              desc="改为声控+光控感应灯，预计节电30%。"
              status="已结束"
              votes={112}
              deadline="已截止"
              color="slate"
            />
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🏢 设施维护提醒</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <FacilityAlert
                name="3号楼电梯"
                issue="异响故障待排查"
                priority="高"
                tone="rose"
              />
              <FacilityAlert
                name="地下车库照明"
                issue="部分灯具不亮"
                priority="中"
                tone="amber"
              />
              <FacilityAlert
                name="花园健身器材"
                issue="螺丝松动，已报修"
                priority="低"
                tone="blue"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤝 招募中志愿</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <VolunteerMini title="电梯故障协助检查" type="设施维修" hours="2-4h" />
              <VolunteerMini title="公共区域卫生清扫" type="环境维护" hours="1-2h" />
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon="🗳️" title="议题投票" desc="参与社区公共事务民主决策" href="/topics" />
        <FeatureCard icon="🏢" title="设施上报" desc="发现设施损坏一键上报" href="/facilities" />
        <FeatureCard icon="🤝" title="志愿服务" desc="参与社区建设贡献力量" href="/volunteer" />
        {isSignedIn ? (
          <FeatureCard icon="⚙️" title="管理中心" desc="居民代表后台管理" href="/admin" />
        ) : (
          <FeatureCard icon="🔐" title="登录后体验" desc="登录即可参与投票和志愿" href="/topics" />
        )}
      </section>
    </div>
  )
}

function TopicCard({
  title, desc, status, votes, deadline, color,
}: {
  title: string; desc: string; status: string; votes: number; deadline: string; color: string;
}) {
  const isActive = color === 'emerald'
  return (
    <div className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 truncate">{title}</h4>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{desc}</p>
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {status}
        </span>
        <span className="text-xs text-slate-500">{votes} 票 · {deadline}</span>
      </div>
    </div>
  )
}

function FacilityAlert({
  name, issue, priority, tone,
}: {
  name: string; issue: string; priority: string; tone: string;
}) {
  const toneClasses: Record<string, string> = {
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={`rounded-lg border p-3 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{name}</span>
        <span className="text-xs">{priority}优先级</span>
      </div>
      <p className="mt-1 text-sm opacity-90">{issue}</p>
    </div>
  )
}

function VolunteerMini({ title, type, hours }: { title: string; type: string; hours: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 hover:border-purple-200 hover:bg-purple-50/30 transition-colors">
      <p className="font-medium text-slate-900 text-sm">{title}</p>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{type}</span>
        <span>⏱ {hours}</span>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, href }: { icon: string; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:border-emerald-300 hover:shadow-md">
        <CardBody className="text-center">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="mt-1 text-sm text-slate-500">{desc}</p>
        </CardBody>
      </Card>
    </Link>
  )
}
