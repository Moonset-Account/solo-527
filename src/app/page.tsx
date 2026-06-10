import UserLayout from '@/components/user/UserLayout';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import {
  CreditCard,
  Calendar,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  FileText,
  Bell,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getHomePageData, DEFAULT_USER_ID } from '@/lib/services';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getHomePageData(DEFAULT_USER_ID);
  const { subscription, currentPlan, recentInvoices, nextInvoice, notifications, usageProgress, changeLogs } = data;

  const seatsUsed = subscription?.seats?.used ?? 0;
  const seatsTotal = currentPlan?.seatLimit ?? subscription?.seatsIncluded ?? 1;
  const nextBillAmount = nextInvoice ? Number(nextInvoice.amount) : Number(currentPlan?.price ?? 0);
  const nextBillingDate = nextInvoice?.dueDate || subscription?.currentPeriodEnd;
  const currentPeriodStart = subscription?.currentPeriodStart;
  const subscriptionStatus = subscription?.status || 'INACTIVE';
  const planName = currentPlan?.name || '未订阅';
  const planPrice = Number(currentPlan?.price ?? 0);
  const planInterval = subscription?.plan?.interval === 'YEARLY' ? '年付' : '月付';

  return (
    <UserLayout>
      <div className="page-container">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-slate-900">
            欢迎回来 👋
          </h1>
          <p className="mt-2 text-slate-500">
            以下是您的订阅概览，点击各模块可查看详细信息。
            {subscription && changeLogs && changeLogs[0] && (
              <span className="ml-2 text-xs text-slate-400">
                · 最近操作：{changeLogs[0].note || `${changeLogs[0].oldValue} → ${changeLogs[0].newValue}`}
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="当前套餐"
            value={planName}
            icon={<CreditCard className="w-6 h-6" />}
            subtitle={planPrice > 0 ? `${formatCurrency(planPrice)}/${planInterval}` : '免费套餐'}
            className="animate-slide-up"
          />
          <StatCard
            title="下期账单"
            value={formatCurrency(nextBillAmount)}
            icon={<Calendar className="w-6 h-6" />}
            subtitle={nextBillingDate ? `到期日: ${formatDate(nextBillingDate)}` : '暂无待结算账单'}
            className="animate-slide-up"
            style={{ animationDelay: '50ms' } as React.CSSProperties}
          />
          <StatCard
            title="席位使用"
            value={`${seatsUsed}/${seatsTotal}`}
            icon={<Users className="w-6 h-6" />}
            subtitle="活跃席位"
            trend={seatsUsed < seatsTotal ? { value: `剩余 ${seatsTotal - seatsUsed} 席`, positive: true } : undefined}
            className="animate-slide-up"
            style={{ animationDelay: '100ms' } as React.CSSProperties}
          />
          <StatCard
            title="用量进度"
            value={`${usageProgress}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            subtitle="本周期使用量"
            className="animate-slide-up"
            style={{ animationDelay: '150ms' } as React.CSSProperties}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-slate-900">订阅详情</h2>
                <Link href="/pricing" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  {subscription ? '升级/变更套餐' : '立即开通'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {!subscription ? (
                <EmptyState
                  icon={<Package className="w-10 h-10" />}
                  title="您还没有订阅任何套餐"
                  description="选择适合您的套餐，开启高效的团队协作体验。所有付费套餐支持 14 天免费试用。"
                  action={
                    <Link href="/pricing">
                      <button className="inline-flex items-center justify-center gap-2 font-medium rounded-lg px-5 py-2.5 text-sm bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        浏览套餐
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  }
                />
              ) : (
                <>
                  <div className="flex items-start justify-between p-5 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lg font-bold text-slate-900">{planName}</h3>
                          <StatusBadge status={subscriptionStatus} />
                          {subscription.cancelAtPeriodEnd && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-danger-100 text-danger-700 font-medium">
                              到期后取消
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {currentPeriodStart && nextBillingDate ? `${formatDate(currentPeriodStart)} - ${formatDate(nextBillingDate)}` : '订阅生效中'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-slate-900">{formatCurrency(planPrice)}</p>
                      <p className="text-sm text-slate-500">{planInterval}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        计费周期
                      </div>
                      <p className="font-semibold text-slate-900">
                        {subscription.plan?.interval === 'YEARLY' ? '年度订阅' : '月度订阅'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                        <Users className="w-4 h-4" />
                        席位数量
                      </div>
                      <p className="font-semibold text-slate-900">{seatsTotal} 席</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500">本周期用量</span>
                      <span className="font-medium text-slate-700">{usageProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                        style={{ width: `${usageProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {subscriptionStatus === 'TRIALING' ? `剩余试用天数：${daysLeft(subscription.trialEnd)} 天` : `${Math.round(usageProgress)}% 的计费周期已消耗`}
                    </p>
                  </div>

                  {changeLogs && changeLogs.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-400" />
                          变更记录
                        </p>
                        <span className="text-xs text-slate-400">共 {changeLogs.length} 条</span>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {changeLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className={cn(
                              'flex-shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold',
                              log.type === 'UPGRADE' ? 'bg-success-100 text-success-700' :
                              log.type === 'DOWNGRADE' ? 'bg-warning-100 text-warning-700' :
                              log.type === 'CANCEL' ? 'bg-danger-100 text-danger-700' :
                              'bg-primary-100 text-primary-700'
                            )}>
                              {describeChange(log.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-700">
                                {log.note || `${log.oldValue || '-'} → ${log.newValue || '-'}`}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(log.createdAt)}</p>
                            </div>
                            {log.result && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">
                                {log.result}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-slate-900">最近账单</h2>
                <Link href="/billing" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  查看全部
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {recentInvoices.length === 0 ? (
                <EmptyState
                  icon={<FileText className="w-10 h-10" />}
                  title="暂无账单记录"
                  description="开通套餐后，账单将自动生成并展示在这里。"
                  compact
                />
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice, index) => (
                    <Link
                      key={invoice.id}
                      href={`/billing/${invoice.id}`}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-slate-500">
                            {formatDate(invoice.createdAt)}
                            {invoice.billingPeriod && <span className="ml-2 text-slate-400">· {invoice.billingPeriod}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-slate-900">{formatCurrency(Number(invoice.amount))}</p>
                        <StatusBadge status={invoice.status} />
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-slate-900">快捷操作</h2>
              </div>
              <div className="space-y-3">
                <Link href="/pricing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-50 transition-colors group">
                  <div className="p-2 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">升级套餐</p>
                    <p className="text-xs text-slate-500">解锁更多高级功能</p>
                  </div>
                </Link>
                <Link href="/seats" className="flex items-center gap-3 p-3 rounded-lg hover:bg-success-50 transition-colors group">
                  <div className="p-2 rounded-lg bg-success-100 text-success-600 group-hover:bg-success-200 transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">邀请成员</p>
                    <p className="text-xs text-slate-500">添加团队席位</p>
                  </div>
                </Link>
                <Link href="/billing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-warning-50 transition-colors group">
                  <div className="p-2 rounded-lg bg-warning-100 text-warning-600 group-hover:bg-warning-200 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">导出账单</p>
                    <p className="text-xs text-slate-500">下载发票记录</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-slate-900">通知提醒</h2>
                <span className="badge-danger badge">{notifications.length} 条</span>
              </div>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-full h-fit ${
                      notif.type === 'usage' ? 'bg-warning-100 text-warning-600' :
                      notif.type === 'billing' ? 'bg-primary-100 text-primary-600' :
                      notif.type === 'trial' ? 'bg-accent-100 text-accent-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

function daysLeft(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const end = new Date(dateStr).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

function describeChange(t: string): string {
  const m: Record<string, string> = {
    UPGRADE: '升级',
    DOWNGRADE: '降级',
    CANCEL: '取消',
    REACTIVATE: '恢复',
    SEAT_CHANGE: '席位',
    PLAN_CHANGE: '变更',
    TRIAL_CONVERT: '转化',
  };
  return m[t] || '变更';
}

function cn(...args: any[]): string {
  return args.filter(Boolean).join(' ');
}
