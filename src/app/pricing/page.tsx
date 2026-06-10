'use client';

import { useState } from 'react';
import UserLayout from '@/components/user/UserLayout';
import Button from '@/components/ui/Button';
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    name: '免费版',
    description: '适合个人开发者体验产品',
    price: 0,
    yearlyPrice: 0,
    interval: '月',
    features: [
      '1 个席位',
      '基础 API 调用 (1,000次/月)',
      '5GB 存储空间',
      '社区支持',
      '基础数据分析',
    ],
    cta: '免费开始',
    popular: false,
    icon: Sparkles,
    color: 'slate',
  },
  {
    id: 'starter',
    name: '入门版',
    description: '适合小型团队快速启动',
    price: 99,
    yearlyPrice: 990,
    interval: '月',
    features: [
      '5 个席位',
      '高级 API 调用 (10,000次/月)',
      '50GB 存储空间',
      '邮件技术支持',
      '进阶数据分析',
      '团队协作功能',
      '14天免费试用',
    ],
    cta: '开始试用',
    popular: false,
    icon: Zap,
    color: 'primary',
  },
  {
    id: 'pro',
    name: '专业版',
    description: '适合成长型团队深度使用',
    price: 299,
    yearlyPrice: 2990,
    interval: '月',
    features: [
      '20 个席位',
      '无限 API 调用',
      '500GB 存储空间',
      '优先技术支持',
      '高级数据分析',
      '自定义报表导出',
      '企业级安全',
      '14天免费试用',
    ],
    cta: '立即升级',
    popular: true,
    icon: Crown,
    color: 'accent',
  },
  {
    id: 'enterprise',
    name: '企业版',
    description: '适合大型企业定制化需求',
    price: 999,
    yearlyPrice: 9990,
    interval: '月',
    features: [
      '100 个席位',
      '无限 API 调用',
      '无限存储空间',
      '专属客户经理',
      '7x24小时技术支持',
      '私有化部署选项',
      'SLA 服务保障',
      '定制开发服务',
      '30天免费试用',
    ],
    cta: '联系销售',
    popular: false,
    icon: Building2,
    color: 'success',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const getPlanStyles = (plan: typeof plans[0], isHovered: boolean) => {
    const baseStyles = 'relative p-6 rounded-2xl border transition-all duration-300';
    
    if (plan.popular) {
      return cn(
        baseStyles,
        'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white',
        isHovered && 'scale-105 shadow-2xl'
      );
    }
    
    return cn(
      baseStyles,
      'bg-white border-slate-200 hover:border-primary-300',
      isHovered && 'shadow-lg -translate-y-1'
    );
  };

  return (
    <UserLayout>
      <div className="page-container">
        <div className="text-center mb-12 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            选择适合您的套餐
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
            const isHovered = hoveredPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={cn(
                  getPlanStyles(plan, isHovered),
                  'animate-slide-up'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold rounded-full shadow-lg">
                    最受欢迎
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
                </div>

                <Button
                  variant={plan.popular ? 'accent' : plan.id === 'enterprise' ? 'outline' : 'primary'}
                  className="w-full mb-6"
                >
                  {plan.cta}
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
        </div>
      </div>
    </UserLayout>
  );
}
