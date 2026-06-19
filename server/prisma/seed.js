const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化种子数据...')

  const brand1 = await prisma.brand.upsert({
    where: { name: '潮流服饰 VOGUE' },
    update: {},
    create: {
      name: '潮流服饰 VOGUE',
      contactPerson: '张经理',
      phone: '13800138001',
      email: 'zhang@vogue.com',
      industry: '时尚服装',
      level: 'VIP'
    }
  })

  const brand2 = await prisma.brand.upsert({
    where: { name: '轻奢美妆 CHERRY' },
    update: {},
    create: {
      name: '轻奢美妆 CHERRY',
      contactPerson: '李总监',
      phone: '13900139002',
      email: 'li@cherrybeauty.com',
      industry: '美妆护肤',
      level: 'NORMAL'
    }
  })

  const brand3 = await prisma.brand.upsert({
    where: { name: '家居生活 LIVING' },
    update: {},
    create: {
      name: '家居生活 LIVING',
      contactPerson: '王主管',
      phone: '13700137003',
      email: 'wang@livinghome.com',
      industry: '家居生活',
      level: 'NORMAL'
    }
  })

  console.log('品牌数据初始化完成')

  const order1 = await prisma.order.upsert({
    where: { orderNo: 'PO202506001' },
    update: {},
    create: {
      orderNo: 'PO202506001',
      brandId: brand1.id,
      orderType: 'PHOTOSHOOT',
      title: '2025春夏新品形象片拍摄',
      description: '春夏新款服装系列主视觉形象片，包含外景和棚拍',
      status: 'IN_PROGRESS',
      totalAmount: 28000,
      paidAmount: 14000,
      photographer: '陈摄影师',
      clientConfirm: false,
      finalDelivery: false
    }
  })

  const order2 = await prisma.order.upsert({
    where: { orderNo: 'PO202506002' },
    update: {},
    create: {
      orderNo: 'PO202506002',
      brandId: brand2.id,
      orderType: 'PHOTOSHOOT',
      title: '口红系列产品图拍摄',
      description: '新品口红系列精修产品图 + 模特试色图',
      status: 'IN_PROGRESS',
      totalAmount: 15000,
      paidAmount: 15000,
      photographer: '林摄影师',
      clientConfirm: true,
      finalDelivery: false
    }
  })

  const order3 = await prisma.order.upsert({
    where: { orderNo: 'PO202505003' },
    update: {},
    create: {
      orderNo: 'PO202505003',
      brandId: brand3.id,
      orderType: 'PHOTOSHOOT',
      title: '家居场景生活方式拍摄',
      description: '客厅、卧室、厨房三大家居场景生活方式照',
      status: 'COMPLETED',
      totalAmount: 32000,
      paidAmount: 32000,
      photographer: '陈摄影师',
      clientConfirm: true,
      finalDelivery: true
    }
  })

  console.log('订单数据初始化完成')

  await prisma.selectedPhoto.deleteMany({ where: { orderId: order1.id } })
  const selectedPhotos1 = []
  for (let i = 1; i <= 8; i++) {
    selectedPhotos1.push({
      orderId: order1.id,
      photoUrl: `https://picsum.photos/seed/ss${order1.id}-${i}/800/600`,
      photoName: `春夏新品_${String(i).padStart(3, '0')}.jpg`,
      isSelected: i <= 3,
      selectedAt: i <= 3 ? new Date() : null
    })
  }
  await prisma.selectedPhoto.createMany({ data: selectedPhotos1 })

  await prisma.selectedPhoto.deleteMany({ where: { orderId: order2.id } })
  const selectedPhotos2 = []
  for (let i = 1; i <= 6; i++) {
    selectedPhotos2.push({
      orderId: order2.id,
      photoUrl: `https://picsum.photos/seed/ss${order2.id}-${i}/800/600`,
      photoName: `口红产品_${String(i).padStart(3, '0')}.jpg`,
      isSelected: true,
      selectedAt: new Date()
    })
  }
  await prisma.selectedPhoto.createMany({ data: selectedPhotos2 })

  await prisma.selectedPhoto.deleteMany({ where: { orderId: order3.id } })
  const selectedPhotos3 = []
  for (let i = 1; i <= 10; i++) {
    selectedPhotos3.push({
      orderId: order3.id,
      photoUrl: `https://picsum.photos/seed/ss${order3.id}-${i}/800/600`,
      photoName: `家居场景_${String(i).padStart(3, '0')}.jpg`,
      isSelected: true,
      selectedAt: new Date()
    })
  }
  await prisma.selectedPhoto.createMany({ data: selectedPhotos3 })

  console.log('选片照片数据初始化完成')

  await prisma.finalPhoto.deleteMany({ where: { orderId: order2.id } })
  const finalPhotos2 = []
  for (let i = 1; i <= 6; i++) {
    finalPhotos2.push({
      orderId: order2.id,
      photoUrl: `https://picsum.photos/seed/ff${order2.id}-${i}/1600/1200`,
      photoName: `精修成片_口红_${String(i).padStart(3, '0')}.jpg`,
      fileSize: Math.floor(Math.random() * 5 + 3) * 1024 * 1024,
      isDownloaded: false,
      downloadedAt: null
    })
  }
  await prisma.finalPhoto.createMany({ data: finalPhotos2 })

  await prisma.finalPhoto.deleteMany({ where: { orderId: order3.id } })
  const finalPhotos3 = []
  for (let i = 1; i <= 10; i++) {
    finalPhotos3.push({
      orderId: order3.id,
      photoUrl: `https://picsum.photos/seed/ff${order3.id}-${i}/1600/1200`,
      photoName: `精修成片_家居_${String(i).padStart(3, '0')}.jpg`,
      fileSize: Math.floor(Math.random() * 6 + 4) * 1024 * 1024,
      isDownloaded: i <= 5,
      downloadedAt: i <= 5 ? new Date() : null
    })
  }
  await prisma.finalPhoto.createMany({ data: finalPhotos3 })

  console.log('成片数据初始化完成')

  await prisma.schedule.deleteMany({ where: { orderId: order1.id } })
  await prisma.schedule.create({
    data: {
      orderId: order1.id,
      title: '春夏新品拍摄日',
      startTime: new Date('2025-06-25T09:00:00'),
      endTime: new Date('2025-06-25T18:00:00'),
      location: '上海徐汇影棚 A 区',
      status: 'SCHEDULED'
    }
  })

  await prisma.deliveryNode.deleteMany({ where: { orderId: order1.id } })
  await prisma.deliveryNode.createMany({
    data: [
      { orderId: order1.id, nodeName: '选片确认', nodeType: 'MILESTONE', plannedDate: new Date('2025-06-28'), status: 'IN_PROGRESS' },
      { orderId: order1.id, nodeName: '成片交付', nodeType: 'MILESTONE', plannedDate: new Date('2025-07-05'), status: 'PENDING' },
      { orderId: order1.id, nodeName: '尾款结算', nodeType: 'NORMAL', plannedDate: new Date('2025-07-10'), status: 'PENDING' }
    ]
  })

  const member1 = await prisma.member.upsert({
    where: { name: '品牌会员-张先生' },
    update: {},
    create: {
      name: '品牌会员-张先生',
      phone: '13811112222',
      level: 'GOLD',
      status: 'ACTIVE',
      totalSpent: 68000,
      retentionDays: 365
    }
  })

  await prisma.subscription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      memberId: member1.id,
      planName: '年度高级会员',
      planType: 'YEARLY',
      amount: 2999,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'ACTIVE',
      autoRenew: true,
      renewalCount: 2
    }
  })

  await prisma.sponsorship.upsert({
    where: { id: 1 },
    update: {},
    create: {
      brandId: brand1.id,
      title: '2025 春夏时装周赞助',
      sponsorshipType: 'EVENT',
      amount: 50000,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30'),
      status: 'ACTIVE',
      benefits: '活动现场 logo 露出 + 官方社媒曝光',
      deliverables: '活动现场照片 20 张 + 品牌露出视频 1 条'
    }
  })

  await prisma.exceptionPool.upsert({
    where: { id: 1 },
    update: {},
    create: {
      orderId: order1.id,
      brandId: brand1.id,
      exceptionType: 'SYNC_ERROR',
      title: '选片数据同步失败',
      description: '第三方系统同步选片状态时返回 500 错误',
      status: 'PENDING',
      priority: 'HIGH',
      brandConfirmed: false,
      syncError: 'Remote API Error: 500 Internal Server Error',
      syncSuggestion: '请检查第三方系统服务状态，确认后点击重试同步'
    }
  })

  console.log('\n========================================')
  console.log('所有种子数据初始化完成！')
  console.log('========================================')
  console.log(`已创建品牌: 3 个 (${brand1.name}, ${brand2.name}, ${brand3.name})`)
  console.log(`已创建订单: 3 个 (${order1.orderNo}, ${order2.orderNo}, ${order3.orderNo})`)
  console.log(`  - ${order1.orderNo}: 待选片 (未确认选片)`)
  console.log(`  - ${order2.orderNo}: 待成片下载 (已选片, 未交付)`)
  console.log(`  - ${order3.orderNo}: 已完成 (全部交付)`)
  console.log('========================================')
}

main()
  .catch(e => {
    console.error('种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
