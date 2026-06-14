import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import SubscriptionPlan from 'App/Models/SubscriptionPlan'
import ConfigService from 'App/Services/ConfigService'
import WarningService from 'App/Services/WarningService'
import BrandPartnership from 'App/Models/BrandPartnership'
import SponsorshipBenefit from 'App/Models/SponsorshipBenefit'
import Order from 'App/Models/Order'
import Subscription from 'App/Models/Subscription'
import RefundException from 'App/Models/RefundException'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  public async run() {
    console.log('开始初始化字典数据...')
    await ConfigService.seedInitialDicts()
    await WarningService.seedInitialReminderConfigs()
    console.log('字典数据初始化完成')

    console.log('创建默认管理员账户...')
    await User.firstOrCreate(
      { email: 'admin@qinghe.com' },
      {
        username: '青禾管理员',
        email: 'admin@qinghe.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      }
    )

    await User.firstOrCreate(
      { email: 'operator@qinghe.com' },
      {
        username: '运营专员',
        email: 'operator@qinghe.com',
        password: 'operator123',
        role: 'operator',
        isActive: true,
      }
    )

    await User.firstOrCreate(
      { email: 'finance@qinghe.com' },
      {
        username: '财务人员',
        email: 'finance@qinghe.com',
        password: 'finance123',
        role: 'finance',
        isActive: true,
      }
    )

    await User.firstOrCreate(
      { email: 'video@qinghe.com' },
      {
        username: '视频团队负责人',
        email: 'video@qinghe.com',
        password: 'video123',
        role: 'video_team',
        isActive: true,
      }
    )
    console.log('默认账户创建完成')

    console.log('创建会员订阅套餐...')
    const plans = [
      {
        planCode: 'BASIC_MONTHLY',
        name: '基础会员',
        description: '适合个人用户，收听会员专属播客内容',
        features: JSON.stringify(['会员专属播客', '无广告收听', '高清音质', '基础数据看板']),
        monthlyPrice: 29,
        yearlyPrice: 290,
        billingCycle: 'monthly',
        level: 'basic',
        isActive: true,
        sortOrder: 1,
      },
      {
        planCode: 'PRO_MONTHLY',
        name: '专业会员',
        description: '适合重度用户，解锁全部会员权益',
        features: JSON.stringify(['全部基础会员权益', '专属社群', '嘉宾互动', '每月1张品牌优惠券', '优先参与线下活动']),
        monthlyPrice: 99,
        yearlyPrice: 990,
        billingCycle: 'monthly',
        level: 'pro',
        isActive: true,
        sortOrder: 2,
      },
      {
        planCode: 'VIP_YEARLY',
        name: 'VIP年度会员',
        description: '年度超值套餐，赠送2个月',
        features: JSON.stringify(['全部专业会员权益', '独家深度报告', '品牌合作优先权', '专属客服', '年度专属礼盒']),
        monthlyPrice: 0,
        yearlyPrice: 999,
        billingCycle: 'yearly',
        level: 'vip',
        isActive: true,
        sortOrder: 3,
      },
    ]

    for (const plan of plans) {
      await SubscriptionPlan.firstOrCreate({ planCode: plan.planCode }, plan)
    }
    console.log('会员套餐创建完成')

    console.log('创建模拟品牌合作数据...')
    const brandNames = [
      { name: '星途咖啡', industry: '餐饮' },
      { name: '清风科技', industry: '消费电子' },
      { name: '云栖书院', industry: '文化教育' },
      { name: '原野旅行', industry: '旅游服务' },
      { name: '臻品美妆', industry: '美妆护肤' },
      { name: '智选理财', industry: '金融服务' },
    ]

    const stages = ['lead', 'negotiation', 'contracting', 'executing', 'completed']
    const priorities = ['high', 'normal', 'low']

    const adminUser = await User.findBy('email', 'admin@qinghe.com')

    for (let i = 0; i < 6; i++) {
      const brand = brandNames[i]
      const partnership = await BrandPartnership.create({
        code: `BP${10000 + i}`,
        brandName: brand.name,
        brandIndustry: brand.industry,
        contactName: `联系人${i + 1}`,
        contactPhone: `138${String(10000000 + i * 11111).padStart(8, '0')}`,
        contactEmail: `contact${i + 1}@${brand.name.toLowerCase()}.com`,
        contractAmount: [50000, 80000, 120000, 200000, 300000, 500000][i],
        currentStage: stages[i % 5],
        priority: priorities[i % 3],
        status: stages[i % 5] === 'completed' ? 'completed' : 'active',
        responsibleUserId: adminUser?.id,
        expectedSignDate: DateTime.now().plus({ days: i * 7 }),
        description: `${brand.name}品牌合作洽谈，${brand.industry}行业头部品牌，合作意向强烈。`,
      })

      const benefitTypes = ['pre_roll', 'mid_roll', 'post_roll', 'description_link', 'sponsored_video']
      const benefitNames = {
        pre_roll: '片头口播广告',
        mid_roll: '片中产品植入',
        post_roll: '片尾品牌鸣谢',
        description_link: '简介区品牌链接',
        sponsored_video: '定制赞助视频',
      }

      for (let j = 0; j < 3; j++) {
        const type = benefitTypes[(i + j) % 5]
        const qty = type === 'description_link' ? 1 : type === 'sponsored_video' ? 1 : [2, 3, 5][j]
        const unitPrice = type === 'sponsored_video' ? 50000 : type === 'pre_roll' ? 8000 : type === 'mid_roll' ? 6000 : type === 'post_roll' ? 4000 : 2000

        await SponsorshipBenefit.create({
          partnershipId: partnership.id,
          benefitType: type,
          name: benefitNames[type],
          description: `${partnership.brandName}${benefitNames[type]}权益`,
          quantity: qty,
          unitPrice,
          totalAmount: qty * unitPrice,
          status: j === 0 ? 'completed' : j === 1 ? 'in_review' : 'draft',
          deliveryStatus: j === 0 ? 'delivered' : j === 1 ? 'delivering' : 'pending',
          expectedDeliveryDate: DateTime.now().plus({ days: (j + 1) * 14 }),
          revisionRound: j,
        })
      }

      if (i >= 2) {
        const order = await Order.create({
          orderNo: `ORD${20000 + i}`,
          partnershipId: partnership.id,
          userId: adminUser?.id,
          type: 'brand',
          amount: [50000, 80000, 120000, 200000][i - 2],
          currency: 'CNY',
          paymentMethod: i % 2 === 0 ? 'bank_transfer' : 'alipay',
          status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'processing' : 'pending',
          paymentStatus: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'paid' : 'unpaid',
          paidAt: i % 3 !== 2 ? DateTime.now().minus({ days: i * 3 }) : null,
          transactionId: i % 3 !== 2 ? `TXN${30000 + i}` : null,
          remark: `${partnership.brandName}品牌赞助合作款`,
        })

        if (i === 5) {
          await RefundException.create({
            orderId: order.id,
            exceptionType: 'service_issue',
            status: 'pending',
            refundAmount: 20000,
            reason: '交付延期申请部分退款',
            description: '因视频制作周期超出预期，品牌方申请退回部分已付款项。需要视频团队负责人审核处理结论。',
            reportedBy: adminUser?.id,
            handlerId: null,
            handlerConclusion: null,
          })
        }
      }
    }
    console.log('品牌合作模拟数据创建完成')

    console.log('创建模拟会员订阅数据...')
    const opUser = await User.findBy('email', 'operator@qinghe.com')
    const basicPlan = await SubscriptionPlan.findBy('planCode', 'BASIC_MONTHLY')
    const proPlan = await SubscriptionPlan.findBy('planCode', 'PRO_MONTHLY')

    if (opUser && basicPlan) {
      for (let i = 0; i < 15; i++) {
        const monthsAgo = Math.floor(Math.random() * 5)
        const startDate = DateTime.now().minus({ months: monthsAgo, days: Math.floor(Math.random() * 20) })
        const isActive = Math.random() > 0.3

        await Subscription.create({
          userId: opUser.id,
          planId: basicPlan.id,
          status: isActive ? 'active' : monthsAgo > 2 ? 'expired' : 'cancelled',
          billingCycle: i % 4 === 0 ? 'yearly' : 'monthly',
          amount: i % 4 === 0 ? 290 : 29,
          startDate,
          endDate: isActive ? startDate.plus(i % 4 === 0 ? { years: 1 } : { months: 1 }) : startDate.plus({ months: monthsAgo }),
          nextBillingDate: isActive ? startDate.plus(i % 4 === 0 ? { years: 1 } : { months: 1 }) : null,
          cancelledAt: !isActive ? startDate.plus({ months: monthsAgo }).minus({ days: Math.floor(Math.random() * 5) }) : null,
          cancelReason: !isActive && monthsAgo > 1 ? ['内容更新慢', '价格太贵', '没时间听', '其他'][i % 4] : null,
          autoRenew: isActive,
        })
      }
    }

    if (opUser && proPlan) {
      for (let i = 0; i < 8; i++) {
        const monthsAgo = Math.floor(Math.random() * 4)
        const startDate = DateTime.now().minus({ months: monthsAgo })
        const isActive = Math.random() > 0.2

        await Subscription.create({
          userId: opUser.id,
          planId: proPlan.id,
          status: isActive ? 'active' : 'cancelled',
          billingCycle: 'monthly',
          amount: 99,
          startDate,
          endDate: isActive ? startDate.plus({ months: 1 }) : startDate.plus({ months: monthsAgo }),
          nextBillingDate: isActive ? startDate.plus({ months: 1 }) : null,
          cancelledAt: !isActive ? startDate.plus({ months: monthsAgo }) : null,
          cancelReason: !isActive ? '预算调整' : null,
          autoRenew: isActive,
        })
      }
    }
    console.log('模拟数据全部初始化完成！')
  }
}
