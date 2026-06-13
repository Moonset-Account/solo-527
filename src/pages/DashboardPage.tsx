"use client";

import Link from "next/link";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: consultStats } = api.consultation.stats.useQuery();
  const { data: leadStats } = api.lead.stats.useQuery();
  const { data: paymentStats } = api.payment.dashboard.useQuery();
  const { data: abnormalStats } = api.abnormal.stats.useQuery();
  const { data: upcoming } = api.followUp.plans.upcoming.useQuery();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日咨询"
          value={consultStats?.todayCount ?? 0}
          icon="📝"
          subtitle={`本周 ${consultStats?.weekCount ?? 0} 条`}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="线索总数"
          value={leadStats?.total ?? 0}
          icon="🎯"
          subtitle={`成交率 ${((leadStats?.conversionRate ?? 0) * 100).toFixed(1)}%`}
          color="bg-dental-50 text-dental-700"
        />
        <StatCard
          title="累计回款"
          value={`¥${formatMoney(paymentStats?.totalReceived ?? 0)}`}
          icon="💰"
          subtitle={`回款率 ${((paymentStats?.collectionRate ?? 0) * 100).toFixed(1)}%`}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="待处理异常"
          value={abnormalStats?.unresolved ?? 0}
          icon="⚠️"
          subtitle={`待处理 ${abnormalStats?.pending ?? 0} 条`}
          color={`${(abnormalStats?.critical ?? 0) > 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
          href="/abnormal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="font-semibold">即将回访（近期 10 条）</h3>
            <Link href="/followups" className="text-sm text-primary-600 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="card-body">
            {upcoming?.length ? (
              <div className="space-y-2">
                {upcoming.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                        {methodIcon(plan.method)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {plan.lead?.customer?.name ?? "未知客户"}
                          <span className="ml-2 text-slate-500 font-normal">
                            {plan.lead?.stage?.name ?? "待分配阶段"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{plan.content}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {new Date(plan.planDate).toLocaleDateString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                        })}{" "}
                        {new Date(plan.planDate).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <Link
                        href={`/leads/${plan.leadId}`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        去处理 →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                🎉 暂无待回访任务
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">线索质量分布</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[
                { key: "HIGH", label: "高意向", color: "bg-emerald-500", total: leadStats?.total ?? 1 },
                { key: "MEDIUM", label: "中意向", color: "bg-amber-500", total: leadStats?.total ?? 1 },
                { key: "LOW", label: "低意向", color: "bg-slate-400", total: leadStats?.total ?? 1 },
                { key: "POTENTIAL", label: "待评估", color: "bg-primary-500", total: leadStats?.total ?? 1 },
              ].map((item) => {
                const count = (leadStats?.byQuality as Record<string, number>)?.[item.key] ?? 0;
                const pct = (count / item.total) * 100;
                return (
                  <div key={item.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-slate-500">{count} 条</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">快捷操作</h3>
          </div>
          <div className="card-body grid grid-cols-2 gap-3">
            <Link
              href="/consultations?new=1"
              className="p-4 rounded-lg border border-dashed border-slate-300 hover:border-dental-500 hover:bg-dental-50 transition text-center"
            >
              <div className="text-3xl mb-2">📝</div>
              <div className="font-medium text-sm">新建咨询记录</div>
            </Link>
            <Link
              href="/customers?new=1"
              className="p-4 rounded-lg border border-dashed border-slate-300 hover:border-primary-500 hover:bg-primary-50 transition text-center"
            >
              <div className="text-3xl mb-2">👤</div>
              <div className="font-medium text-sm">新建客户档案</div>
            </Link>
            <Link
              href="/leads"
              className="p-4 rounded-lg border border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50 transition text-center"
            >
              <div className="text-3xl mb-2">🔍</div>
              <div className="font-medium text-sm">线索筛查跟进</div>
            </Link>
            <Link
              href="/abnormal?new=1"
              className="p-4 rounded-lg border border-dashed border-slate-300 hover:border-red-500 hover:bg-red-50 transition text-center"
            >
              <div className="text-3xl mb-2">⚠️</div>
              <div className="font-medium text-sm">上报异常记录</div>
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">回款概览</h3>
            <Link href="/payments" className="text-sm text-primary-600 hover:underline">
              详情 →
            </Link>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">待收金额</div>
                <div className="text-3xl font-bold text-red-600">
                  ¥{formatMoney(paymentStats?.outstanding ?? 0)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500 mb-1">逾期单数</div>
                <div className="text-2xl font-bold text-amber-600">
                  {paymentStats?.overdueCount ?? 0}
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>整体回款进度</span>
                <span className="font-medium">{((paymentStats?.collectionRate ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-dental-400 to-dental-600 transition-all"
                  style={{ width: `${(paymentStats?.collectionRate ?? 0) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>应收 ¥{formatMoney(paymentStats?.totalReceivable ?? 0)}</span>
                <span>已收 ¥{formatMoney(paymentStats?.totalReceived ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  color,
  href,
}: {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className={`p-5 rounded-xl ${color} transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm opacity-80 mb-1">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
        </div>
        <div className="text-3xl opacity-60">{icon}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function methodIcon(m: string) {
  return { PHONE: "📞", WECHAT: "💬", SMS: "✉️", EMAIL: "📧", VISIT: "🚪", OTHER: "📋" }[m] ?? "📞";
}

function formatMoney(n: number) {
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}
