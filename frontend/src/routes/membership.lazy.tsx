import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { subscriptionsApi } from '../lib/api'
import type { MembershipPlan } from '../lib/types'

function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const data = await subscriptionsApi.getPlans()
      const activePlans = data.plans.filter((p) => p.isActive)
      setPlans(activePlans.sort((a, b) => a.sortOrder - b.sortOrder))
      if (activePlans.length > 0) {
        const recommended = activePlans.find((p) => (p.features as any)?.recommended)
        setSelectedPlan(recommended?.id || activePlans[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      const defaultPlans: MembershipPlan[] = [
        {
          id: 1,
          name: '基础会员',
          description: '适合初次体验的听众',
          price: '29.00',
          durationDays: 30,
          features: {
            benefits: ['收听所有会员节目', '每月新增 10+ 期内容', '标准音质', '社区讨论区访问'],
          },
          isActive: true,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: '高级会员',
          description: '最受欢迎的选择',
          price: '59.00',
          durationDays: 30,
          features: {
            benefits: [
              '收听所有会员节目',
              '每月新增 30+ 期内容',
              '无损音质',
              '社区讨论区访问',
              '专属会员群',
              '优先参与线下活动',
            ],
            recommended: true,
          },
          isActive: true,
          sortOrder: 2,
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          name: '年度会员',
          description: '最划算的长期订阅',
          price: '588.00',
          durationDays: 365,
          features: {
            benefits: [
              '收听所有会员节目',
              '全年内容无限畅听',
              '无损音质',
              '社区讨论区访问',
              '专属会员群',
              '优先参与线下活动',
              '专属年度礼物',
              '节省 ¥120',
            ],
          },
          isActive: true,
          sortOrder: 3,
          createdAt: new Date().toISOString(),
        },
      ]
      setPlans(defaultPlans)
      setSelectedPlan(2)
    } finally {
      setLoading(false)
    }
  }

  const getPlanFeatures = (plan: MembershipPlan): string[] => {
    const features = plan.features as any
    if (features?.benefits && Array.isArray(features.benefits)) {
      return features.benefits
    }
    return []
  }

  const isRecommended = (plan: MembershipPlan): boolean => {
    const features = plan.features as any
    return features?.recommended === true
  }

  const getDurationText = (days: number): string => {
    if (days >= 365) {
      const years = Math.floor(days / 365)
      return `${years}年`
    }
    if (days >= 30) {
      const months = Math.floor(days / 30)
      return `${months}个月`
    }
    return `${days}天`
  }

  const memberBenefits = [
    {
      icon: '🎧',
      title: '独家内容',
      description: '会员专享节目，深度访谈和专题系列',
    },
    {
      icon: '🎵',
      title: '无损音质',
      description: '高品质音频，享受更佳收听体验',
    },
    {
      icon: '💬',
      title: '会员社区',
      description: '加入专属社群，与同好交流互动',
    },
    {
      icon: '🎁',
      title: '专属福利',
      description: '线下活动优先参与，周边礼物不定期发放',
    },
    {
      icon: '📱',
      title: '多端同步',
      description: '手机、平板、电脑随时随地收听',
    },
    {
      icon: '🚀',
      title: '更新优先',
      description: '会员提前 24 小时收听新节目',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          会员订阅
        </h1>
        <p className="text-gray-500 text-lg">
          选择适合你的会员方案，解锁全部精彩内容
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const recommended = isRecommended(plan)
          const isSelected = selectedPlan === plan.id
          const features = getPlanFeatures(plan)

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${
                recommended
                  ? 'border-blue-500 shadow-lg scale-105 z-10'
                  : isSelected
                  ? 'border-blue-300 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    推荐
                  </span>
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="text-sm text-gray-500">{plan.description}</p>
                )}
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold text-gray-800">¥</span>
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  / {getDurationText(plan.durationDays)}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  recommended
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                    : isSelected
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelected ? '已选择' : '选择该方案'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 rounded-2xl p-6 text-center">
        <p className="text-gray-600 mb-4">
          选择了心仪的方案？立即订阅，享受会员专属内容
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
          立即订阅
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          会员权益
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberBenefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-3">{benefit.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-500">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
          常见问题
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">
              如何取消订阅？
            </h3>
            <p className="text-sm text-gray-500">
              您可以随时在账户设置中取消自动续订，当前订阅期内的权益不会受影响。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">
              会员内容多久更新一次？
            </h3>
            <p className="text-sm text-gray-500">
              我们每周都会更新会员节目，高级会员和年度会员可享受更多独家内容。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">
              可以在哪些设备上收听？
            </h3>
            <p className="text-sm text-gray-500">
              支持手机、平板、电脑等多种设备，登录同一账号即可同步收听进度。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">
              支持退款吗？
            </h3>
            <p className="text-sm text-gray-500">
              首次订阅后 7 天内如对内容不满意，可申请全额退款。
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-sm">
          还有其他问题？
          <Link to="/" className="text-blue-600 hover:underline">
            联系我们
          </Link>
        </p>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/membership')({
  component: MembershipPage,
})
