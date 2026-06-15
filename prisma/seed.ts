import { PrismaClient, Role, Gender, LeadQuality, ReturnPlanType, ReturnPlanStatus, QuotationStatus, ApprovalType, ApprovalStatus, ApprovalItemResult } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number, decimals: number = 2) => Number((Math.random() * (max - min) + min).toFixed(decimals))
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
const randomPhone = () => `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999)).padStart(9, '0')}`
const randomName = () => {
  const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
  const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '艳', '勇', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英']
  return random(surnames) + random(names) + (Math.random() > 0.6 ? random(names) : '')
}

const userNames = ['admin', 'manager', 'advisor1', 'advisor2', 'advisor3', 'frontdesk1', 'frontdesk2', 'director']
const userRoles: Role[] = [Role.MANAGER, Role.MANAGER, Role.ADVISOR, Role.ADVISOR, Role.ADVISOR, Role.FRONT_DESK, Role.FRONT_DESK, Role.DIRECTOR]

const advisorRoles = ['资深咨询顾问', '高级美学顾问', '客户关系顾问', '初级咨询顾问', 'VIP客户顾问']

const tagData = [
  { name: '高意向', color: '#10B981' },
  { name: 'VIP客户', color: '#8B5CF6' },
  { name: '价格敏感', color: '#F59E0B' },
  { name: '需长期跟进', color: '#6366F1' },
  { name: '老客户', color: '#14B8A6' },
  { name: '转介绍', color: '#EC4899' },
  { name: '犹豫中', color: '#64748B' },
  { name: '对比中', color: '#0EA5A9' },
  { name: '预算充足', color: '#22C55E' },
  { name: '医生推荐', color: '#06B6D4' },
  { name: '口腔问题复杂', color: '#EF4444' },
  { name: '美观需求高', color: '#F97316' },
  { name: '怕疼', color: '#A855F7' },
  { name: '时间紧张', color: '#3B82F6' },
  { name: '儿童客户', color: '#F472B6' },
]

const levelData = [
  { name: '普通客户', threshold: 0, benefits: '基础咨询服务' },
  { name: '银卡客户', threshold: 5000, benefits: '优先预约、9.5折优惠' },
  { name: '金卡客户', threshold: 20000, benefits: '专属顾问、9折优惠、免费洁牙' },
  { name: '钻石客户', threshold: 50000, benefits: 'VIP通道、8.5折优惠、全家口腔检查、专车接送' },
  { name: '黑钻客户', threshold: 100000, benefits: '院长亲诊、8折优惠、私人定制方案、全球联保' },
]

const sourceChannelData = [
  { name: '抖音推广', category: '线上平台' },
  { name: '小红书', category: '线上平台' },
  { name: '美团点评', category: 'O2O平台' },
  { name: '百度搜索', category: '搜索引擎' },
  { name: '微信朋友圈', category: '社交媒体' },
  { name: '朋友推荐', category: '转介绍' },
  { name: '医生推荐', category: '专业渠道' },
  { name: '线下活动', category: '活动推广' },
  { name: '社区宣传', category: '地推' },
  { name: '企业合作', category: 'B端渠道' },
]

const consultIntents = [
  '牙齿矫正咨询',
  '种植牙咨询',
  '牙齿美白咨询',
  '烤瓷牙/全瓷牙咨询',
  '补牙/根管治疗咨询',
  '牙周治疗咨询',
  '儿童齿科咨询',
  '口腔检查咨询',
  '洁牙/洗牙咨询',
  '智齿拔除咨询',
  '牙齿贴面咨询',
  '义齿修复咨询',
]

const returnPreferences = [
  '周末上午',
  '周末下午',
  '工作日上午',
  '工作日下午',
  '工作日晚上',
  '电话沟通优先',
  '微信沟通优先',
]

const projectNames = [
  '隐适美矫正',
  '传统金属矫正',
  '陶瓷半隐形矫正',
  '韩国奥齿泰种植体',
  '瑞士ITI种植体',
  '瑞典诺贝尔种植体',
  '冷光美白',
  '皓齿美白',
  '全瓷牙冠（爱尔创）',
  '全瓷牙冠（泽康）',
  '全瓷牙冠（LAVA）',
  '瓷贴面',
  '树脂补牙',
  '根管治疗（前牙）',
  '根管治疗（后牙）',
  '牙周基础治疗',
  '超声波洁牙',
  '舒适化洁牙',
  '儿童窝沟封闭',
  '儿童全口涂氟',
  '智齿拔除（普通）',
  '智齿拔除（阻生齿）',
]

async function main() {
  console.log('🌱 开始生成种子数据...')

  console.log('👤 创建用户...')
  const users = []
  for (let i = 0; i < userNames.length; i++) {
    const user = await prisma.user.upsert({
      where: { username: userNames[i] },
      update: {},
      create: {
        username: userNames[i],
        password: '$2b$10$hashplaceholder' + i,
        name: userNames[i] === 'admin' ? '系统管理员' : randomName(),
        role: userRoles[i],
        active: true,
      },
    })
    users.push(user)
  }

  console.log('💼 创建顾问...')
  const advisorUsers = users.filter(u => u.role === Role.ADVISOR || u.role === Role.MANAGER || u.role === Role.DIRECTOR)
  const advisors = []
  for (let i = 0; i < 15; i++) {
    const linkedUser = i < advisorUsers.length ? advisorUsers[i] : null
    const advisor = await prisma.advisor.create({
      data: {
        name: linkedUser ? linkedUser.name : randomName(),
        userId: linkedUser ? linkedUser.id : undefined,
        role: random(advisorRoles),
        active: true,
      },
    })
    advisors.push(advisor)
  }

  console.log('🏷️ 创建标签...')
  const tags = []
  for (const t of tagData) {
    const tag = await prisma.tag.create({
      data: t,
    })
    tags.push(tag)
  }

  console.log('⭐ 创建客户等级...')
  const levels = []
  for (const l of levelData) {
    const level = await prisma.customerLevel.create({
      data: {
        name: l.name,
        threshold: new Decimal(l.threshold),
        benefits: l.benefits,
        active: true,
      },
    })
    levels.push(level)
  }

  console.log('📣 创建来源渠道...')
  const sourceChannels = []
  for (const s of sourceChannelData) {
    const sc = await prisma.sourceChannel.create({
      data: s,
    })
    sourceChannels.push(sc)
  }

  console.log('👥 创建客户...')
  const customers = []
  const genders: Gender[] = [Gender.M, Gender.F, Gender.UNKNOWN]
  const leadQualities: LeadQuality[] = [LeadQuality.A, LeadQuality.B, LeadQuality.C, LeadQuality.D]
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  for (let i = 0; i < 100; i++) {
    const levelIdx = randomInt(0, levels.length - 1)
    const advisor = advisors[randomInt(0, advisors.length - 1)]
    const customer = await prisma.customer.create({
      data: {
        name: randomName(),
        phone: randomPhone(),
        gender: random(genders),
        age: randomInt(10, 75),
        leadQuality: random(leadQualities),
        consultIntent: random(consultIntents),
        returnPreference: random(returnPreferences),
        totalConsumption: new Decimal(levelIdx === 0 ? randomFloat(0, 4999) : levelIdx === 1 ? randomFloat(5000, 19999) : levelIdx === 2 ? randomFloat(20000, 49999) : levelIdx === 3 ? randomFloat(50000, 99999) : randomFloat(100000, 300000)),
        visitCount: randomInt(1, 30),
        levelId: levels[levelIdx].id,
        advisorId: advisor.id,
        sourceChannelId: sourceChannels[randomInt(0, sourceChannels.length - 1)].id,
        createdAt: randomDate(sixMonthsAgo, now),
      },
    })
    customers.push(customer)

    const tagCount = randomInt(1, 5)
    const selectedTags = [...tags].sort(() => Math.random() - 0.5).slice(0, tagCount)
    for (const tag of selectedTags) {
      await prisma.customerTag.create({
        data: {
          customerId: customer.id,
          tagId: tag.id,
        },
      })
    }
  }

  console.log('📝 创建咨询记录...')
  const consultNotes = [
    '客户表示对牙齿矫正有强烈需求，预算充足，倾向于隐适美方案。已安排数字化口腔扫描。',
    '客户缺失牙多年，询问种植牙方案。已推荐韩国奥齿泰种植体，价格在预算范围内。',
    '客户希望美白牙齿，了解冷光美白和皓齿美白区别。建议先做洁牙再做美白。',
    '客户牙齿不齐多年，比较多家诊所。强调我们的医生经验和案例优势。',
    '客户对价格敏感，正在对比3家机构。已提供详细报价单，承诺老客户优惠。',
    '儿童客户，家长担心孩子牙齿不齐。建议早期干预治疗，已出初步方案。',
    '客户有牙周炎问题，先做基础治疗再考虑修复方案。已预约牙周科医生会诊。',
    '客户预约了口腔全面检查，已安排CT拍片。等待检查结果后给出完整方案。',
    '客户是朋友推荐过来的，信任度较高。详细介绍了诊所资质和服务流程。',
    '客户想做瓷贴面改善前牙美观。已取模设计，预计一周后可试戴。',
  ]
  for (let i = 0; i < 150; i++) {
    const customer = customers[randomInt(0, customers.length - 1)]
    const operator = users[randomInt(0, users.length - 1)]
    await prisma.consultRecord.create({
      data: {
        customerId: customer.id,
        content: random(consultNotes),
        consultDate: randomDate(new Date(customer.createdAt.getTime()), now),
        operatorId: operator.id,
      },
    })
  }

  console.log('💰 创建消费记录...')
  for (let i = 0; i < 200; i++) {
    const customer = customers[randomInt(0, customers.length - 1)]
    const operator = users.filter(u => u.role === Role.FRONT_DESK || u.role === Role.MANAGER)[randomInt(0, users.filter(u => u.role === Role.FRONT_DESK || u.role === Role.MANAGER).length - 1)]
    const project = random(projectNames)
    const basePrice = {
      '隐适美矫正': 35000, '传统金属矫正': 12000, '陶瓷半隐形矫正': 18000,
      '韩国奥齿泰种植体': 6800, '瑞士ITI种植体': 12800, '瑞典诺贝尔种植体': 15800,
      '冷光美白': 1800, '皓齿美白': 2800,
      '全瓷牙冠（爱尔创）': 2500, '全瓷牙冠（泽康）': 4500, '全瓷牙冠（LAVA）': 6800,
      '瓷贴面': 3200, '树脂补牙': 380, '根管治疗（前牙）': 880, '根管治疗（后牙）': 1280,
      '牙周基础治疗': 1500, '超声波洁牙': 280, '舒适化洁牙': 680,
      '儿童窝沟封闭': 180, '儿童全口涂氟': 280, '智齿拔除（普通）': 380, '智齿拔除（阻生齿）': 1280,
    }[project] || 1000
    await prisma.consumption.create({
      data: {
        customerId: customer.id,
        amount: new Decimal(basePrice * (0.85 + Math.random() * 0.3)),
        project,
        consumeDate: randomDate(new Date(customer.createdAt.getTime()), now),
        operatorId: operator.id,
      },
    })
  }

  console.log('📋 创建报价单...')
  const quoStatuses: QuotationStatus[] = [QuotationStatus.DRAFT, QuotationStatus.SENT, QuotationStatus.ACCEPTED, QuotationStatus.EXPIRED, QuotationStatus.REJECTED]
  for (let i = 0; i < 80; i++) {
    const customer = customers[randomInt(0, customers.length - 1)]
    const advisor = advisors[randomInt(0, advisors.length - 1)]
    const status = random(quoStatuses)
    const total = new Decimal(randomFloat(3000, 80000))
    const quotation = await prisma.quotation.create({
      data: {
        customerId: customer.id,
        advisorId: advisor.id,
        version: `V${randomInt(1, 3)}.0`,
        totalAmount: total,
        expireAt: randomDate(now, new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)),
        status,
        expireReason: status === QuotationStatus.EXPIRED ? '客户逾期未确认，报价单已自动过期' : status === QuotationStatus.REJECTED ? random(['客户选择了其他诊所', '客户预算不足', '客户暂时不需要治疗']) : undefined,
      },
    })

    const itemCount = randomInt(1, 4)
    let remaining = Number(total)
    for (let j = 0; j < itemCount; j++) {
      const isLast = j === itemCount - 1
      const project = random(projectNames)
      const price = isLast ? remaining : Number((remaining / (itemCount - j) * (0.8 + Math.random() * 0.4)).toFixed(2))
      remaining -= price
      await prisma.quotationItem.create({
        data: {
          quotationId: quotation.id,
          itemName: project,
          price: new Decimal(price),
          quantity: randomInt(1, 4),
        },
      })
    }

    if (status === QuotationStatus.DRAFT || status === QuotationStatus.SENT) {
      const nodeCount = randomInt(1, 3)
      for (let k = 0; k < nodeCount; k++) {
        await prisma.responseNode.create({
          data: {
            quotationId: quotation.id,
            nodeName: k === 0 ? '初步沟通' : k === 1 ? '方案确认' : '最终签约',
            ownerId: advisors[randomInt(0, advisors.length - 1)].id,
            dueAt: randomDate(now, new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
            doneAt: status === QuotationStatus.SENT ? randomDate(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) : undefined,
            remark: k === 0 ? '已完成客户需求初步了解' : undefined,
          },
        })
      }
    }
  }

  console.log('📅 创建回访计划...')
  const planTypes: ReturnPlanType[] = [ReturnPlanType.FOLLOW_UP, ReturnPlanType.REVISIT, ReturnPlanType.QUOTATION]
  const planStatuses: ReturnPlanStatus[] = [ReturnPlanStatus.PENDING, ReturnPlanStatus.DONE, ReturnPlanStatus.CANCELLED]
  const planContents = [
    '确认客户对治疗方案的意向，解答剩余疑问',
    '提醒客户复查时间，确认是否按时复诊',
    '跟进报价单反馈，了解客户决策进度',
    '治疗后关怀回访，了解恢复情况',
    '节日关怀，赠送小礼品，维护客户关系',
    '询问是否有新的口腔问题需要咨询',
    '定期口腔检查提醒，预约下次就诊时间',
    '满意度调研，收集客户建议',
  ]
  const resultNotes = [
    '客户表示满意，已预约下次复诊',
    '客户正在考虑中，下周再跟进',
    '客户已确认方案，进入治疗阶段',
    '客户对价格有异议，已提供优惠方案',
    '客户临时有事，重新安排回访时间',
  ]
  for (let i = 0; i < 120; i++) {
    const customer = customers[randomInt(0, customers.length - 1)]
    const assignee = advisors[randomInt(0, advisors.length - 1)]
    const status = random(planStatuses)
    const planDate = randomDate(new Date(customer.createdAt.getTime()), new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000))
    await prisma.returnPlan.create({
      data: {
        customerId: customer.id,
        assigneeId: assignee.id,
        planDate,
        planType: random(planTypes),
        content: random(planContents),
        status,
        resultNote: status === ReturnPlanStatus.DONE ? random(resultNotes) : status === ReturnPlanStatus.CANCELLED ? random(['客户取消', '已电话回访完成', '无需再跟进']) : undefined,
        createdAt: randomDate(new Date(customer.createdAt.getTime()), planDate),
      },
    })
  }

  console.log('🚶 创建流失记录...')
  const churnReasons = [
    { code: 'PRICE', detail: '客户认为价格偏高，选择了价格更低的诊所' },
    { code: 'DISTANCE', detail: '距离太远，交通不便' },
    { code: 'TRUST', detail: '对治疗方案信心不足，转去公立医院' },
    { code: 'SERVICE', detail: '服务体验不满意' },
    { code: 'DELAY', detail: '客户暂时推迟治疗计划' },
    { code: 'OTHER', detail: '其他原因' },
  ]
  const churnCustomers = [...customers].sort(() => Math.random() - 0.5).slice(0, 15)
  for (const customer of churnCustomers) {
    const reason = random(churnReasons)
    await prisma.churnRecord.create({
      data: {
        customerId: customer.id,
        reasonCode: reason.code,
        reasonDetail: reason.detail,
        churnDate: randomDate(new Date(customer.createdAt.getTime()), now),
      },
    })
  }

  console.log('✅ 创建批量审批记录...')
  const approvalTypes: ApprovalType[] = [ApprovalType.LEVEL_UPGRADE, ApprovalType.TAG_ADD, ApprovalType.ADVISOR_TRANSFER, ApprovalType.QUOTATION_APPROVE]
  const approvalStatuses: ApprovalStatus[] = [ApprovalStatus.PENDING, ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, ApprovalStatus.PARTIAL]
  for (let i = 0; i < 20; i++) {
    const submitter = users[randomInt(0, users.length - 1)]
    const type = random(approvalTypes)
    const status = random(approvalStatuses)
    const itemCount = randomInt(2, 10)
    const batchApproval = await prisma.batchApproval.create({
      data: {
        type,
        submitterId: submitter.id,
        status,
        payload: { type, description: `${type}批量审批` },
      },
    })

    for (let j = 0; j < itemCount; j++) {
      const customer = customers[randomInt(0, customers.length - 1)]
      let originalValue: string | undefined
      let newValue: string | undefined
      let targetName = customer.name
      let failReason: string | undefined

      if (type === ApprovalType.LEVEL_UPGRADE) {
        originalValue = random(levelData).name
        newValue = random(levelData).name
      } else if (type === ApprovalType.TAG_ADD) {
        newValue = random(tagData).name
      } else if (type === ApprovalType.ADVISOR_TRANSFER) {
        originalValue = advisors[randomInt(0, advisors.length - 1)].name
        newValue = advisors[randomInt(0, advisors.length - 1)].name
      } else if (type === ApprovalType.QUOTATION_APPROVE) {
        originalValue = `￥${randomInt(5000, 50000)}`
        newValue = originalValue
      }

      const result = status === ApprovalStatus.APPROVED ? ApprovalItemResult.SUCCESS :
        status === ApprovalStatus.REJECTED ? ApprovalItemResult.FAILED :
          status === ApprovalStatus.PARTIAL ? (Math.random() > 0.5 ? ApprovalItemResult.SUCCESS : ApprovalItemResult.FAILED) :
            ApprovalItemResult.PENDING

      if (result === ApprovalItemResult.FAILED) {
        failReason = random(['不符合升级条件', '客户信息不完整', '审批材料缺失', '额度超限'])
      }

      await prisma.approvalItem.create({
        data: {
          approvalId: batchApproval.id,
          targetId: customer.id,
          targetName,
          result,
          originalValue,
          newValue,
          failReason,
        },
      })
    }
  }

  console.log('📄 创建回访模板...')
  const returnTemplates = [
    { name: '治疗后7天关怀', planType: ReturnPlanType.FOLLOW_UP as ReturnPlanType, content: '您好，距离您上次治疗已经7天了，请问恢复情况如何？是否有不适症状？如有任何问题请随时联系我们。', daysOffset: 7 },
    { name: '治疗后30天复查提醒', planType: ReturnPlanType.REVISIT as ReturnPlanType, content: '您好，提醒您按照治疗计划需要进行复查了，请方便时预约复诊时间，我们将为您安排好。', daysOffset: 30 },
    { name: '报价单发送后3天跟进', planType: ReturnPlanType.QUOTATION as ReturnPlanType, content: '您好，3天前为您发送了治疗方案报价单，请问您考虑得如何？有任何疑问都可以随时与我们沟通。', daysOffset: 3 },
    { name: '新客户首次回访', planType: ReturnPlanType.FOLLOW_UP as ReturnPlanType, content: '您好，感谢您选择我们诊所。为了给您提供更好的服务，想了解一下您对首次就诊体验是否满意？有什么建议可以告诉我们。', daysOffset: 2 },
    { name: '年度口腔检查提醒', planType: ReturnPlanType.REVISIT as ReturnPlanType, content: '您好，您的年度口腔检查时间快到了，建议每年进行1-2次口腔检查和洁牙，维护口腔健康。请方便时预约。', daysOffset: 365 },
    { name: '矫正客户月度跟进', planType: ReturnPlanType.FOLLOW_UP as ReturnPlanType, content: '您好，提醒您按时佩戴矫治器，如有任何不适或问题请及时联系。下次复诊时间别忘了哦！', daysOffset: 30 },
  ]
  for (const t of returnTemplates) {
    await prisma.returnTemplate.create({
      data: t,
    })
  }

  console.log('🎉 种子数据生成完成！')
  console.log(`
  📊 数据概览:
  ────────────────────────
  👤 用户:     ${userNames.length}
  💼 顾问:     ${advisors.length}
  🏷️ 标签:     ${tags.length}
  ⭐ 等级:     ${levels.length}
  📣 渠道:     ${sourceChannels.length}
  👥 客户:     ${customers.length}
  📝 咨询记录: 150
  💰 消费记录: 200
  📋 报价单:   80
  📅 回访计划: 120
  🚶 流失记录: ${churnCustomers.length}
  ✅ 审批记录: 20
  📄 回访模板: ${returnTemplates.length}
  ────────────────────────
  `)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
