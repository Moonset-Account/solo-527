const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化种子数据...')

  await prisma.exceptionPool.deleteMany()
  await prisma.syncLog.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.sponsorship.deleteMany()
  await prisma.member.deleteMany()
  await prisma.finalPhoto.deleteMany()
  await prisma.selectedPhoto.deleteMany()
  await prisma.workAuthorization.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.deliveryNode.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.order.deleteMany()
  await prisma.brandQuote.deleteMany()
  await prisma.brand.deleteMany()

  const brand1 = await prisma.brand.create({
    data: {
      name: '潮流服饰 VOGUE',
      contactPerson: '张经理',
      phone: '13800138001',
      email: 'zhang@vogue.com',
      industry: '时尚服装',
      level: 'VIP'
    }
  })

  const brand2 = await prisma.brand.create({
    data: {
      name: '轻奢美妆 CHERRY',
      contactPerson: '李总监',
      phone: '13900139002',
      email: 'li@cherrybeauty.com',
      industry: '美妆护肤',
      level: 'NORMAL'
    }
  })

  const brand3 = await prisma.brand.create({
    data: {
      name: '家居生活 LIVING',
      contactPerson: '王主管',
      phone: '13700137003',
      email: 'wang@livinghome.com',
      industry: '家居生活',
      level: 'NORMAL'
    }
  })

  console.log('品牌数据初始化完成')

  const order1 = await prisma.order.create({
    data: {
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

  const order2 = await prisma.order.create({
    data: {
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

  const order3 = await prisma.order.create({
    data: {
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

  for (let i = 1; i <= 8; i++) {
    await prisma.selectedPhoto.create({
      data: {
        orderId: order1.id,
        photoUrl: `https://picsum.photos/seed/sel${order1.id}-${i}/800/600`,
        photoName: `春夏新品_${String(i).padStart(3, '0')}.jpg`,
        isSelected: i <= 3,
        selectedAt: i <= 3 ? new Date() : null
      }
    })
  }

  for (let i = 1; i <= 6; i++) {
    await prisma.selectedPhoto.create({
      data: {
        orderId: order2.id,
        photoUrl: `https://picsum.photos/seed/sel${order2.id}-${i}/800/600`,
        photoName: `口红产品_${String(i).padStart(3, '0')}.jpg`,
        isSelected: true,
        selectedAt: new Date()
      }
    })
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.selectedPhoto.create({
      data: {
        orderId: order3.id,
        photoUrl: `https://picsum.photos/seed/sel${order3.id}-${i}/800/600`,
        photoName: `家居场景_${String(i).padStart(3, '0')}.jpg`,
        isSelected: true,
        selectedAt: new Date()
      }
    })
  }

  console.log('选片照片数据初始化完成')

  for (let i = 1; i <= 6; i++) {
    await prisma.finalPhoto.create({
      data: {
        orderId: order2.id,
        photoUrl: `https://picsum.photos/seed/final${order2.id}-${i}/1600/1200`,
        photoName: `精修成片_口红_${String(i).padStart(3, '0')}.jpg`,
        fileSize: Math.floor(Math.random() * 5 + 3) * 1024 * 1024,
        isDownloaded: false,
        downloadedAt: null
      }
    })
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.finalPhoto.create({
      data: {
        orderId: order3.id,
        photoUrl: `https://picsum.photos/seed/final${order3.id}-${i}/1600/1200`,
        photoName: `精修成片_家居_${String(i).padStart(3, '0')}.jpg`,
        fileSize: Math.floor(Math.random() * 6 + 4) * 1024 * 1024,
        isDownloaded: i <= 5,
        downloadedAt: i <= 5 ? new Date() : null
      }
    })
  }

  console.log('成片数据初始化完成')

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

  await prisma.deliveryNode.createMany({
    data: [
      { orderId: order1.id, nodeName: '选片确认', nodeType: 'MILESTONE', plannedDate: new Date('2025-06-28'), status: 'IN_PROGRESS' },
      { orderId: order1.id, nodeName: '成片交付', nodeType: 'MILESTONE', plannedDate: new Date('2025-07-05'), status: 'PENDING' },
      { orderId: order1.id, nodeName: '尾款结算', nodeType: 'NORMAL', plannedDate: new Date('2025-07-10'), status: 'PENDING' }
    ]
  })

  await prisma.payment.create({
    data: {
      paymentNo: 'PAY202506001',
      orderId: order1.id,
      amount: 14000,
      paymentDate: new Date('2025-06-10'),
      paymentMethod: 'BANK_TRANSFER',
      status: 'PAID',
      remark: '50% 定金'
    }
  })

  await prisma.payment.create({
    data: {
      paymentNo: 'PAY202506002',
      orderId: order2.id,
      amount: 15000,
      paymentDate: new Date('2025-06-12'),
      paymentMethod: 'WECHAT',
      status: 'PAID',
      remark: '全额付款'
    }
  })

  await prisma.payment.create({
    data: {
      paymentNo: 'PAY202505003',
      orderId: order3.id,
      amount: 32000,
      paymentDate: new Date('2025-05-28'),
      paymentMethod: 'BANK_TRANSFER',
      status: 'PAID',
      remark: '尾款结算完成'
    }
  })

  console.log('回款数据初始化完成')

  for (const oid of [order1.id, order2.id, order3.id]) {
    const paidPayments = await prisma.payment.findMany({
      where: { orderId: oid, status: 'PAID' }
    })
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    await prisma.order.update({
      where: { id: oid },
      data: { paidAmount: totalPaid }
    })
  }

  console.log('订单已付金额重算完成')

  const member1 = await prisma.member.create({
    data: {
      name: '品牌会员-张先生',
      phone: '13811112222',
      level: 'GOLD',
      status: 'ACTIVE',
      totalSpent: 68000,
      retentionDays: 365
    }
  })

  await prisma.subscription.create({
    data: {
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

  await prisma.sponsorship.create({
    data: {
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

  await prisma.exceptionPool.create({
    data: {
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
  console.log(`品牌: 3 个 (${brand1.name}, ${brand2.name}, ${brand3.name})`)
  console.log(`订单: 3 个`)
  console.log(`  - ${order1.orderNo}: 待选片 (8张选片照片, 3张已选, clientConfirm=false)`)
  console.log(`  - ${order2.orderNo}: 待成片下载 (6张成片, 均未下载, clientConfirm=true)`)
  console.log(`  - ${order3.orderNo}: 已完成 (10张成片, 5张已下载, finalDelivery=true)`)
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
