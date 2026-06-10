'use client';

import { useState, useEffect } from 'react';
import UserLayout from '@/components/user/UserLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import {
  Check,
  Zap,
  Crown,
  Building2,
  Sparkles,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { subscribeToPlan, BillingCycle } from '@/app/actions/subscription-actions';
import { getPlans, getSubscriptionByUser, getInvoicesByUser, getChangeLogs, isUsingMock, DEFAULT_USER_ID } from '@/lib/services';
import type { Plan, Subscription, Invoice, ChangeLog } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DisplayPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice: number;
  interval: string;
  features: string[];
  cta: string;
  popular: boolean;
  icon: any;
  color: string;
  planId: string;
  trialDays: number;
  seatLimit: number;
}

function buildPlanMap(plans: Plan[]): DisplayPlan[] {
  const iconMap: Record<string, any> = {
    plan_free: Sparkles,
    plan_starter: Zap,
    plan_pro: Crown,
    plan_enterprise: Building2,
  };
  const colorMap: Record<string, string> = {
    plan_free: 'slate',
    plan_starter: 'primary',
    plan_pro: 'accent',
    plan_enterprise: 'success',
  };
  const nameFallback: Record<string, string> = {
    plan_free: '免费版',
    plan_starter: '入门版',
    plan_pro: '专业版',
    plan_enterprise: '企业版',
  };

  return plans.map((p) => {
    const monthly = Number(p.price) || 0;
    const yearly = Math.round(monthly * 12 * 0.83);
    const Icon = iconMap[p.id] || Sparkles;
    const color = colorMap[p.id] || 'primary';
    const name = p.name || nameFallback[p.id] || '套餐';
    const isEnterprise = p.id === 'plan_enterprise';
    const hasTrial = p.trialDays && p.trialDays > 0 && monthly > 0;

    let cta = '立即开通';
    if (p.id === 'plan_free') cta = '免费开始';
    else if (isEnterprise) cta = '联系销售';
    else if (hasTrial) cta = `开始${p.trialDays}天试用`;
    else cta = '立即升级';

    return {
      id: p.id,
      planId: p.id,
      name,
      description: p.description || '',
      price: monthly,
      yearlyPrice: yearly,
      interval: '月',
      features: p.features && p.features.length ? p.features : ['完整订阅功能'],
      cta,
      popular: !!p.isPopular,
      icon: Icon,
      color,
      trialDays: p.trialDays || 0,
      seatLimit: p.seatLimit || 1,
    };
  });
}

const planRank: Record<string, number> = {
  plan_free: 0,
  plan_starter: 1,
  plan_pro: 2,
  plan_enterprise: 3,
};

export default function PricingPage() {
  const router = useRouter();
  const toast = useToast();

  const [isYearly, setIsYearly] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<(Subscription & { plan?: Plan }) | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockFlag, setMockFlag] = useState(false);
  const [recentChange, setRecentChange] = useState<ChangeLog | null>(null);
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [fetchedPlans, sub, invData] = await Promise.all([
          getPlans('ACTIVE'),
          getSubscriptionByUser(DEFAULT_USER_ID),
          getInvoicesByUser(DEFAULT_USER_ID, { page: 1, pageSize: 3 }),
        ]);
        setPlans(buildPlanMap(fetchedPlans));
        setCurrentSub(sub);
        setLatestInvoice(invData.invoices[0] || null);
        setMockFlag(isUsingMock());
        if (sub) {
          const logs = await getChangeLogs(sub.id);
          if (logs && logs[0]) setRecentChange(logs[0]);
        }
      } catch (e) {
        console.error(e);
        toast.show({
          variant: 'error',
          message: '加载套餐数据失败',
          description: e instanceof Error ? e.message : '',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshData = async () => {
    try {
      const [fetchedPlans, sub, invData] = await Promise.all([
        getPlans('ACTIVE'),
        getSubscriptionByUser(DEFAULT_USER_ID),
        getInvoicesByUser(DEFAULT_USER_ID, { page: 1, pageSize: 3 }),
      ]);
      setPlans(buildPlanMap(fetchedPlans));
      setCurrentSub(sub);
      setLatestInvoice(invData.invoices[0] || null);
      if (sub) {
        const logs = await getChangeLogs(sub.id);
        if (logs && logs[0]) setRecentChange(logs[0]);
      }
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getPlanStyles = (plan: DisplayPlan, isHovered: boolean) => {
    const baseStyles = 'relative p-6 rounded-2xl border transition-all duration-300';
    if (plan.popular) {
      return cn(
        baseStyles,
        'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white',
        isHovered && 'scale-[1.02] shadow-2xl'
      );
    }
    return cn(
      baseStyles,
      'bg-white border-slate-200 hover:border-primary-300',
      isHovered && 'shadow-lg -translate-y-1'
    );
  };

  const isCurrentPlan = (planId: string) =>
    !!currentSub && currentSub.planId === planId;

  const getActionType = (planId: string): 'CREATE' | 'UPGRADE' | 'DOWNGRADE' | 'RENEW' => {
    if (!currentSub) return 'CREATE';
    if (currentSub.planId === planId) return 'RENEW';
    const oldRank = planRank[currentSub.planId] ?? 0;
    const newRank = planRank[planId] ?? 0;
    return newRank >= oldRank ? 'UPGRADE' : 'DOWNGRADE';
  };

  const getButtonLabel = (plan: DisplayPlan) => {
    if (plan.id === 'plan_enterprise') return '联系销售';
    const action = getActionType(plan.planId);
    if (action === 'CREATE') return plan.cta;
    if (action === 'UPGRADE') return '立即升级';
    if (action === 'DOWNGRADE') return '确认降级';
    return '立即续费';
  };

  const handleSubscribe = async (plan: DisplayPlan) => {
    if (plan.id === 'plan_enterprise') {
      toast.show({
        variant: 'info',
        message: '企业版请联系销售',
        description: '我们的客户经理将在 1 个工作日内与您取得联系',
      });
      return;
    }
    if (pendingPlanId) return;
    const actionType = getActionType(plan.planId);
    const cycle: BillingCycle = isYearly ? 'YEARLY' : 'MONTHLY';

    if (actionType === 'DOWNGRADE') {
      const confirmed = window.confirm(
        `确认将当前套餐降级为「${plan.name}」？\n降级后席位上限将调整为 ${plan.seatLimit} 席，超出席位可能被停用。新账期立即生效。`
      );
      if (!confirmed) return;
    }

    setPendingPlanId(plan.planId);
    const loadingToast = toast.show({
      variant: 'info',
      message:
        actionType === 'CREATE' ? '正在开通套餐...' :
        actionType === 'UPGRADE' ? '正在处理升级请求...' :
        actionType === 'DOWNGRADE' ? '正在处理降级请求...' :
        '正在处理续费请求...',
      duration: 0,
    });

    try {
      const res = await subscribeToPlan(plan.planId, cycle, DEFAULT_USER_ID);
      toast.dismiss(loadingToast);
      if (!res.success) {
        toast.show({
          variant: 'error',
          message: '操作失败',
          description: res.error || '请稍后重试',
        });
        return;
      }
      const data = res.data!;
      toast.show({
        variant: 'success',
        message: data.message,
        description: data.invoice
          ? `账单号 ${data.invoice.invoiceNumber} · ${formatCurrency(Number(data.invoice.amount))}`
          : undefined,
        duration: 6000,
      });
      await refreshData();
      if (data.invoice && data.invoice.status !== 'PAID') {
        setTimeout(() => router.push('/billing'), 1500);
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      console.error(e);
      toast.show({
        variant: 'error',
        message: '网络异常，请稍后重试',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setPendingPlanId(null);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="page-container min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-slate-500">正在加载套餐信息...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="page-container">
        {mockFlag && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-warning-200 bg-warning-50 text-warning-900 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">当前使用演示模式</p>
              <p className="mt-0.5 opacity-80">
                未检测到 PostgreSQL 数据库连接，所有操作将写入内存模拟数据源。刷新页面后新数据保留当前会话。
                配置 <code className="px-1.5 py-0.5 rounded bg-white/60 font-mono text-xs">DATABASE_URL</code> 后即可启用真实写入。
              </p>
            </div>
          </div>
        )}

        {(currentSub || recentChange) && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
            {currentSub && currentSub.plan && (
              <div className="lg:col-span-2 card p-5 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100">
                    <Crown className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">当前订阅</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-display text-lg font-bold text-slate-900">
                        {currentSub.plan.name}
                      </p>
                      <StatusBadge status={currentSub.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isYearly ? '按年计费' : '按月计费'} · 席位 {currentSub.seatsIncluded || currentSub.plan.seatLimit}
                    </p>
                  </div>
                </div>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>当前账期</span>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(Number(currentSub.plan.price) * (isYearly ? 9.96 : 1))}
                      {isYearly ? '/年' : '/月'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${computePeriodProgress(currentSub.currentPeriodStart, currentSub.currentPeriodEnd)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    下次计费：{formatShortDate(new Date(currentSub.currentPeriodEnd))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/billing" className="inline-flex">
                    <Button variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                      查看账单
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            {recentChange && (
              <div className="card p-5">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                  最近变更
                </p>
                <p className="mt-1.5 font-semibold text-slate-900 text-sm line-clamp-1">
                  {describeChangeType(recentChange.type)}：{recentChange.oldValue} → {recentChange.newValue}
                </p>
                {recentChange.note && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{recentChange.note}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {formatShortDate(new Date(recentChange.createdAt))}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-12 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {currentSub ? '选择套餐，随时升级或降级' : '选择适合您的套餐'}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            简单透明的定价
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            无论您是个人开发者还是大型企业，我们都有适合您的方案。随时升级，随时取消。
          </p>

          <div className="inline-flex items-center gap-3 p-1.5 bg-slate-100 rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-full transition-all duration-200',
                !isYearly
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              月付
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2',
                isYearly
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              年付
              <span className="text-xs px-2 py-0.5 bg-success-100 text-success-600 rounded-full">
                省 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.price;
            const isHovered = hoveredPlan === plan.planId;
            const current = isCurrentPlan(plan.planId);
            const action = getActionType(plan.planId);
            const isPending = pendingPlanId === plan.planId;

            return (
              <div
                key={plan.planId}
                className={cn(
                  getPlanStyles(plan, isHovered),
                  'animate-slide-up group'
                )}
                style={{ animationDelay: `${index * 60}ms` }}
                onMouseEnter={() => setHoveredPlan(plan.planId)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold rounded-full shadow-lg">
                    最受欢迎
                  </div>
                )}
                {current && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    当前
                  </div>
                )}

                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  plan.popular
                    ? 'bg-gradient-to-br from-accent-400 to-accent-600'
                    : plan.color === 'primary'
                    ? 'bg-primary-100 text-primary-600'
                    : plan.color === 'success'
                    ? 'bg-success-100 text-success-600'
                    : 'bg-slate-100 text-slate-600'
                )}>
                  <Icon className={cn('w-6 h-6', plan.popular ? 'text-white' : '')} />
                </div>

                <h3 className={cn(
                  'font-display text-xl font-bold mb-1',
                  plan.popular ? 'text-white' : 'text-slate-900'
                )}>
                  {plan.name}
                </h3>
                <p className={cn(
                  'text-sm mb-6',
                  plan.popular ? 'text-slate-300' : 'text-slate-500'
                )}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      'font-display text-4xl font-bold',
                      plan.popular ? 'text-white' : 'text-slate-900'
                    )}>
                      {price === 0 ? '免费' : formatCurrency(price)}
                    </span>
                    {price > 0 && (
                      <span className={cn(
                        'text-sm',
                        plan.popular ? 'text-slate-400' : 'text-slate-500'
                      )}>
                        /{plan.interval}
                      </span>
                    )}
                  </div>
                  {isYearly && price > 0 && (
                    <p className={cn(
                      'text-xs mt-1',
                      plan.popular ? 'text-slate-400' : 'text-slate-500'
                    )}>
                      按年计费，已节省 {formatCurrency(plan.price * 12 - plan.yearlyPrice)}
                    </p>
                  )}
                  {plan.trialDays && plan.trialDays > 0 && price > 0 && (
                    <p className={cn(
                      'text-xs mt-1 font-medium',
                      plan.popular ? 'text-accent-300' : 'text-success-600'
                    )}>
                      含 {plan.trialDays} 天免费试用
                    </p>
                  )}
                </div>

                <Button
                  variant={
                    plan.popular ? 'accent' :
                    plan.id === 'plan_enterprise' ? 'outline' :
                    action === 'DOWNGRADE' ? 'secondary' :
                    'primary'
                  }
                  className="w-full mb-6"
                  disabled={isPending || (current && action === 'RENEW' && plan.id === 'plan_free')}
                  onClick={() => handleSubscribe(plan)}
                  leftIcon={isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isPending
                    ? (action === 'UPGRADE' ? '升级中...' : action === 'DOWNGRADE' ? '处理中...' : action === 'CREATE' ? '开通中...' : '处理中...')
                    : (current ? getButtonLabel(plan) : plan.cta)}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className={cn(
                        'w-5 h-5 flex-shrink-0 mt-0.5',
                        plan.popular ? 'text-accent-400' : 'text-success-500'
                      )} />
                      <span className={cn(
                        'text-sm',
                        plan.popular ? 'text-slate-300' : 'text-slate-600'
                      )}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">
            还在犹豫？
          </h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            所有付费套餐均提供免费试用期，无需信用卡。体验满意后再付费。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-500" />
              <span>随时取消，无任何费用</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-500" />
              <span>7天无理由退款</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-500" />
              <span>数据安全保障</span>
            </div>
          </div>
          {latestInvoice && (
            <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
              <span className="text-xs text-slate-500">最近账单：</span>
              <Link
                href={`/billing/${latestInvoice.id}`}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                {latestInvoice.invoiceNumber} · {formatCurrency(Number(latestInvoice.amount))}
              </Link>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

function computePeriodProgress(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const total = e - s;
  if (total <= 0) return 100;
  const elapsed = Date.now() - s;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function formatShortDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function describeChangeType(t: string): string {
  const m: Record<string, string> = {
    UPGRADE: '升级套餐',
    DOWNGRADE: '降级套餐',
    CANCEL: '取消订阅',
    REACTIVATE: '恢复订阅',
    SEAT_CHANGE: '席位变更',
    PLAN_CHANGE: '套餐变更',
    TRIAL_CONVERT: '试用转化',
    RENEW: '续费',
  };
  return m[t] || '变更';
}
