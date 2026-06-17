import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()
const Decimal = Prisma.Decimal

function generateContractNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `HT-${year}${month}${day}-${random}`
}

function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

const now = new Date()
const d = (days: number, hours = 0) => {
  const nd = new Date(now)
  nd.setDate(nd.getDate() + days)
  nd.setHours(nd.getHours() + hours)
  return nd
}

async function main() {
  console.log('开始种子数据初始化...')

  await prisma.$transaction(async (tx) => {
    await tx.complianceGap.deleteMany()
    await tx.downloadRecord.deleteMany()
    await tx.reminder.deleteMany()
    await tx.reviewOpinion.deleteMany()
    await tx.operationLog.deleteMany()
    await tx.assignment.deleteMany()
    await tx.contractVersion.deleteMany()
    await tx.contract.deleteMany()
    await tx.user.deleteMany()

    await tx.user.createMany({
      data: [
        {
          username: 'admin',
          name: '系统管理员',
          email: 'admin@company.com',
          password: hashPassword('admin123'),
          role: 'ADMIN',
          department: '信息技术部',
          phone: '13800000000'
        },
        {
          username: 'manager',
          name: '张明华',
          email: 'zhangmh@company.com',
          password: hashPassword('123456'),
          role: 'LEGAL_MANAGER',
          department: '法务部',
          phone: '13800000001'
        },
        {
          username: 'lawyer1',
          name: '李思远',
          email: 'lisy@company.com',
          password: hashPassword('123456'),
          role: 'LAWYER',
          department: '法务部',
          phone: '13800000002'
        },
        {
          username: 'lawyer2',
          name: '王晓峰',
          email: 'wangxf@company.com',
          password: hashPassword('123456'),
          role: 'LAWYER',
          department: '法务部',
          phone: '13800000003'
        },
        {
          username: 'lawyer3',
          name: '赵雅婷',
          email: 'zhaoyt@company.com',
          password: hashPassword('123456'),
          role: 'LAWYER',
          department: '法务部',
          phone: '13800000004'
        },
        {
          username: 'reviewer1',
          name: '陈志强',
          email: 'chenzq@company.com',
          password: hashPassword('123456'),
          role: 'REVIEWER',
          department: '合规部',
          phone: '13800000005'
        },
        {
          username: 'reviewer2',
          name: '刘美玲',
          email: 'liuml@company.com',
          password: hashPassword('123456'),
          role: 'REVIEWER',
          department: '合规部',
          phone: '13800000006'
        }
      ]
    })

    const users = await tx.user.findMany({
      select: { id: true, username: true, name: true, role: true }
    })
    const userMap: Record<string, any> = {}
    for (const u of users) userMap[u.username] = u
    console.log('✅ 用户创建完成:', users.length, '个')

    const contractTemplates = [
      {
        title: '2024年度服务器采购框架合同',
        partyA: '华信科技集团有限公司',
        partyB: '戴尔(中国)有限公司',
        contractType: '采购合同',
        amount: 5_800_000,
        priority: 'URGENT',
        status: 'COMPLETED',
        signDate: d(-60),
        effectiveDate: d(-55),
        expiryDate: d(300),
        rectifyDeadline: null,
        createdAt: d(-65),
        creator: 'manager'
      },
      {
        title: 'SaaS平台年度服务合同',
        partyA: '华信科技集团有限公司',
        partyB: '阿里云云计算有限公司',
        contractType: '服务合同',
        amount: 1_280_000,
        priority: 'HIGH',
        status: 'REVIEWER_REVIEWING',
        signDate: d(-15),
        effectiveDate: d(-10),
        expiryDate: d(355),
        rectifyDeadline: d(2),
        createdAt: d(-20),
        creator: 'manager'
      },
      {
        title: '办公场地租赁协议',
        partyA: '华信科技集团有限公司',
        partyB: '盛世物业管理有限公司',
        contractType: '租赁合同',
        amount: 960_000,
        priority: 'NORMAL',
        status: 'LAWYER_REVIEWING',
        signDate: null,
        effectiveDate: d(5),
        expiryDate: d(370),
        rectifyDeadline: d(5),
        createdAt: d(-8),
        creator: 'manager'
      },
      {
        title: '核心技术人员保密协议',
        partyA: '华信科技集团有限公司',
        partyB: '各核心技术骨干',
        contractType: '保密协议',
        amount: null,
        priority: 'HIGH',
        status: 'PENDING_RECTIFICATION',
        signDate: null,
        effectiveDate: d(3),
        expiryDate: d(1095),
        rectifyDeadline: d(-1),
        createdAt: d(-12),
        creator: 'manager'
      },
      {
        title: '跨境电商平台合作协议',
        partyA: '华信科技集团有限公司',
        partyB: '东南亚电商联合股份公司',
        contractType: '合作协议',
        amount: 12_000_000,
        priority: 'URGENT',
        status: 'ASSIGNED_LAWYER',
        signDate: null,
        effectiveDate: d(10),
        expiryDate: d(730),
        rectifyDeadline: d(10),
        createdAt: d(-2),
        creator: 'manager'
      },
      {
        title: '数据中心建设工程项目合同',
        partyA: '华信科技集团有限公司',
        partyB: '中建三局集团有限公司',
        contractType: '采购合同',
        amount: 38_500_000,
        priority: 'URGENT',
        status: 'NEW',
        signDate: null,
        effectiveDate: d(20),
        expiryDate: d(540),
        rectifyDeadline: d(20),
        createdAt: d(-1),
        creator: 'manager'
      },
      {
        title: '营销外包服务框架协议',
        partyA: '华信科技集团有限公司',
        partyB: '蓝色光标传播集团',
        contractType: '服务合同',
        amount: 3_200_000,
        priority: 'NORMAL',
        status: 'LAWYER_COMPLETED',
        signDate: d(-25),
        effectiveDate: d(-20),
        expiryDate: d(340),
        rectifyDeadline: null,
        createdAt: d(-30),
        creator: 'manager'
      },
      {
        title: '劳务派遣服务合同',
        partyA: '华信科技集团有限公司',
        partyB: '智联易才人力资源顾问',
        contractType: '劳务合同',
        amount: 2_400_000,
        priority: 'LOW',
        status: 'COMPLETED',
        signDate: d(-90),
        effectiveDate: d(-85),
        expiryDate: d(270),
        rectifyDeadline: null,
        createdAt: d(-95),
        creator: 'manager'
      },
      {
        title: '股权投资框架协议',
        partyA: '华信创业投资有限公司',
        partyB: '智云科技(北京)有限公司',
        contractType: '投资协议',
        amount: 50_000_000,
        priority: 'URGENT',
        status: 'RECTIFYING',
        signDate: null,
        effectiveDate: d(15),
        expiryDate: d(1825),
        rectifyDeadline: d(3),
        createdAt: d(-40),
        creator: 'manager'
      },
      {
        title: '软件许可使用协议',
        partyA: '华信科技集团有限公司',
        partyB: '微软(中国)有限公司',
        contractType: '其他',
        amount: 1_580_000,
        priority: 'NORMAL',
        status: 'ASSIGNED_REVIEWER',
        signDate: d(-5),
        effectiveDate: d(-3),
        expiryDate: d(362),
        rectifyDeadline: null,
        createdAt: d(-10),
        creator: 'manager'
      },
      {
        title: '销售代理合作协议',
        partyA: '华信科技集团有限公司',
        partyB: '华东地区各经销商联合体',
        contractType: '销售合同',
        amount: 8_600_000,
        priority: 'HIGH',
        status: 'NEW',
        signDate: null,
        effectiveDate: d(8),
        expiryDate: d(372),
        rectifyDeadline: d(12),
        createdAt: d(0, -2),
        creator: 'manager'
      },
      {
        title: '咨询服务委托合同',
        partyA: '华信科技集团有限公司',
        partyB: '德勤华永会计师事务所',
        contractType: '服务合同',
        amount: 1_980_000,
        priority: 'HIGH',
        status: 'ERROR',
        signDate: null,
        effectiveDate: null,
        expiryDate: null,
        rectifyDeadline: null,
        createdAt: d(-3),
        creator: 'manager'
      }
    ]

    for (const tpl of contractTemplates) {
      const contract = await tx.contract.create({
        data: {
          contractNo: generateContractNo(),
          title: tpl.title,
          partyA: tpl.partyA,
          partyB: tpl.partyB,
          contractType: tpl.contractType,
          amount: tpl.amount != null ? new Decimal(tpl.amount) : null,
          currency: 'CNY',
          signDate: tpl.signDate,
          effectiveDate: tpl.effectiveDate,
          expiryDate: tpl.expiryDate,
          rectifyDeadline: tpl.rectifyDeadline,
          priority: tpl.priority,
          status: tpl.status,
          description: `本合同为${tpl.contractType}，涉及金额${tpl.amount || '未披露'}元人民币。按照公司合同管理规定执行审查流程。`,
          keywords: `${tpl.contractType},${tpl.partyB.slice(0, 10)}`,
          creatorId: userMap[tpl.creator].id,
          createdAt: tpl.createdAt
        }
      })

      await tx.contractVersion.create({
        data: {
          contractId: contract.id,
          versionNo: 1,
          fileName: `${tpl.title}-V1.pdf`,
          fileUrl: `/uploads/${contract.id}/v1.pdf`,
          fileSize: 256_000 + Math.floor(Math.random() * 1_000_000),
          fileHash: Math.random().toString(36).slice(2, 34),
          mimeType: 'application/pdf',
          note: '首版上传',
          isCurrent: true,
          uploaderId: userMap[tpl.creator].id,
          createdAt: tpl.createdAt
        }
      })

      if (['LAWYER_REVIEWING', 'ASSIGNED_LAWYER', 'ASSIGNED_REVIEWER', 'LAWYER_COMPLETED', 'REVIEWER_REVIEWING', 'PENDING_RECTIFICATION', 'RECTIFYING', 'COMPLETED', 'ERROR'].includes(tpl.status)) {
        const lawyerNames = ['李思远', '王晓峰', '赵雅婷']
        const lawyer = lawyerNames[Math.floor(Math.random() * 3)]
        const lawyerUser = Object.values(userMap).find((u: any) => u.name === lawyer) as any

        const reviewerNames = ['陈志强', '刘美玲']
        const reviewer = reviewerNames[Math.floor(Math.random() * 2)]
        const reviewerUser = Object.values(userMap).find((u: any) => u.name === reviewer) as any

        const assignment: any = {
          contractId: contract.id,
          lawyerId: lawyerUser.id,
          lawyerAssignedAt: d(-18),
          note: '请按标准流程审阅'
        }

        if (tpl.status === 'LAWYER_COMPLETED' || tpl.status === 'ASSIGNED_REVIEWER' || tpl.status === 'REVIEWER_REVIEWING' || tpl.status === 'COMPLETED') {
          assignment.lawyerCompletedAt = d(-10)
        }

        if (['ASSIGNED_REVIEWER', 'REVIEWER_REVIEWING', 'COMPLETED'].includes(tpl.status)) {
          assignment.reviewerId = reviewerUser.id
          assignment.reviewerAssignedAt = d(-8)
        }

        if (tpl.status === 'COMPLETED') {
          assignment.reviewerCompletedAt = d(-5)
        }

        await tx.assignment.create({ data: assignment })

        const lawyerDeadline = new Date(tpl.createdAt)
        lawyerDeadline.setDate(lawyerDeadline.getDate() + 15)
        await tx.reminder.create({
          data: {
            contractId: contract.id,
            userId: lawyerUser.id,
            reminderType: 'LAWYER_DEADLINE',
            title: '律师审阅期限提醒',
            message: `您负责的合同《${tpl.title}》审阅期限临近，请及时处理`,
            deadlineDate: lawyerDeadline,
            daysBefore: 3,
            status: ['COMPLETED', 'ERROR'].includes(tpl.status) ? 'ACKNOWLEDGED' : 'PENDING'
          }
        })
      }

      if (['LAWYER_COMPLETED', 'ASSIGNED_REVIEWER', 'REVIEWER_REVIEWING', 'COMPLETED', 'PENDING_RECTIFICATION', 'RECTIFYING'].includes(tpl.status)) {
        const types: string[] = ['LAW_REVIEW']
        if (tpl.status === 'COMPLETED' || tpl.status === 'REVIEWER_REVIEWING' || tpl.status === 'ASSIGNED_REVIEWER') types.push('FINAL_REVIEW')
        if (tpl.status === 'PENDING_RECTIFICATION' || tpl.status === 'RECTIFYING') types.push('RECTIFICATION')

        for (let i = 0; i < types.length; i++) {
          const type = types[i]
          const isLaw = type === 'LAW_REVIEW'
          const authorId = isLaw ? userMap.lawyer1.id : userMap.reviewer1.id
          const hasGap = Math.random() > 0.5 || tpl.status === 'PENDING_RECTIFICATION'

          await tx.reviewOpinion.create({
            data: {
              contractId: contract.id,
              authorId,
              opinionType: type as any,
              title: isLaw ? '法律条款审阅意见' : (type === 'FINAL_REVIEW' ? '复核审查意见' : '整改说明'),
              content: isLaw
                ? '经审查，合同第3条付款条款表述不够清晰，建议明确分期付款节点与对应里程碑交付物的验收标准。第7条违约责任中，违约金比例建议调整为日万分之五，与行业惯例保持一致。第12条争议解决条款，建议选择我方所在地法院管辖，以降低维权成本。'
                : type === 'FINAL_REVIEW'
                  ? '复核确认：律师提出的三点意见均已在新版合同中落实，付款节点与交付物已绑定，违约金比例调整为0.05%/日，管辖法院变更为甲方所在地。整体风险可控，同意通过。'
                  : '已根据法律意见进行以下整改：1) 付款条款补充了详细的里程碑表(附件二)；2) 违约金比例调整至日0.05%；3) 争议解决条款已修改。请重新审阅确认。',
              clauseRef: isLaw ? '第3条、第7条、第12条' : (type === 'FINAL_REVIEW' ? '全文复核' : '第3、7、12条'),
              severity: hasGap ? (i === 0 ? 'HIGH' : 'MEDIUM') : undefined,
              suggestion: isLaw ? '建议商务团队与对方协商调整上述条款，如对方接受后再送复核。' : undefined,
              hasGap,
              createdAt: d(-5 - i)
            }
          })
        }
      }

      const downloadCount = 2 + Math.floor(Math.random() * 4)
      const downloadUserIds = [userMap.manager.id, userMap.lawyer1.id, userMap.lawyer2.id, userMap.reviewer1.id, userMap.admin.id]
      const reasons = ['审阅参考', '提交审批', '商务洽谈', '内部存档']
      for (let i = 0; i < downloadCount; i++) {
        const randomUserId = downloadUserIds[Math.floor(Math.random() * downloadUserIds.length)]
        const downloadDate = new Date(tpl.createdAt)
        downloadDate.setDate(downloadDate.getDate() + Math.floor(Math.random() * 10))
        await tx.downloadRecord.create({
          data: {
            contractId: contract.id,
            userId: randomUserId,
            downloadReason: reasons[Math.floor(Math.random() * 4)],
            createdAt: downloadDate
          }
        })
      }

      if (tpl.status === 'COMPLETED') {
        const gaps = [
          { title: '违约金比例略低于标准', severity: 'MEDIUM', category: 'LAW_REVIEW', desc: '原合同约定违约金为日万分之三，公司标准模板为万分之五。已与对方沟通，但对方坚持不调整。' },
          { title: '知识产权归属表述模糊', severity: 'HIGH', category: 'FINAL_REVIEW', desc: '定制开发部分的知识产权归属条款仅约定了使用权，未明确所有权归属，存在后续权属纠纷风险。' }
        ]
        for (let i = 0; i < gaps.length; i++) {
          await tx.complianceGap.create({
            data: {
              contractId: contract.id,
              title: gaps[i].title,
              description: gaps[i].desc,
              category: gaps[i].category,
              severity: gaps[i].severity as any,
              status: i === 0 ? 'RESOLVED' : 'IN_PROGRESS',
              clauseRef: i === 0 ? '第7条' : '第9条',
              regulation: '《民法典》合同编',
              reporterId: userMap.reviewer1.id,
              resolverId: i === 0 ? userMap.manager.id : undefined,
              resolution: i === 0 ? '已与对方签订补充协议，将违约金比例上调至万分之四，双方均已盖章确认。' : undefined,
              resolvedAt: i === 0 ? d(-2) : undefined,
              createdAt: d(-5 - i)
            }
          })
        }
      }

      if (tpl.status === 'PENDING_RECTIFICATION' || tpl.status === 'RECTIFYING') {
        await tx.complianceGap.create({
          data: {
            contractId: contract.id,
            title: '保密义务缺乏违约责任约束',
            description: '保密协议仅约定了保密义务，但未明确泄密后的具体赔偿计算方式与金额，一旦发生泄密难以举证损失。建议补充违约金条款或约定损害赔偿计算方法。',
            category: 'LAW_REVIEW',
            severity: 'CRITICAL',
            status: 'OPEN',
            clauseRef: '第5条',
            regulation: '《反不正当竞争法》第九条',
            reporterId: userMap.lawyer1.id,
            createdAt: d(-3)
          }
        })
      }
    }

    const logsToCreate: any[] = []
    const allContracts = await tx.contract.findMany({ include: { creator: true, assignments: { include: { lawyer: true, reviewer: true } } } })

    for (const c of allContracts) {
      logsToCreate.push({
        contractId: c.id,
        userId: c.creatorId,
        action: 'CREATE_CONTRACT',
        description: `创建合同 ${c.contractNo}: ${c.title}`,
        toStatus: 'NEW',
        createdAt: c.createdAt
      })

      logsToCreate.push({
        contractId: c.id,
        userId: c.creatorId,
        action: 'UPLOAD_VERSION',
        description: '上传第1版合同文件',
        createdAt: c.createdAt
      })

      const assignment = c.assignments[0]
      if (assignment) {
        logsToCreate.push({
          contractId: c.id,
          userId: userMap.manager.id,
          action: 'ASSIGN_LAWYER',
          description: `分派律师: ${assignment.lawyer?.name}`,
          fromStatus: 'NEW',
          toStatus: 'ASSIGNED_LAWYER',
          createdAt: assignment.lawyerAssignedAt
        })

        const reviewingAt = new Date(assignment.lawyerAssignedAt)
        reviewingAt.setHours(reviewingAt.getHours() + 2)
        logsToCreate.push({
          contractId: c.id,
          userId: assignment.lawyerId,
          action: 'CHANGE_STATUS',
          description: '开始审阅',
          fromStatus: 'ASSIGNED_LAWYER',
          toStatus: 'LAWYER_REVIEWING',
          createdAt: reviewingAt
        })

        if (assignment.lawyerCompletedAt) {
          logsToCreate.push({
            contractId: c.id,
            userId: assignment.lawyerId,
            action: 'SUBMIT_OPINION',
            description: '律师提交审阅意见',
            fromStatus: 'LAWYER_REVIEWING',
            toStatus: c.status === 'PENDING_RECTIFICATION' || c.status === 'RECTIFYING' ? 'PENDING_RECTIFICATION' : 'LAWYER_COMPLETED',
            createdAt: assignment.lawyerCompletedAt
          })
        }

        if (assignment.reviewerAssignedAt) {
          logsToCreate.push({
            contractId: c.id,
            userId: userMap.manager.id,
            action: 'ASSIGN_REVIEWER',
            description: `分派复核人: ${assignment.reviewer?.name}`,
            fromStatus: 'LAWYER_COMPLETED',
            toStatus: 'ASSIGNED_REVIEWER',
            createdAt: assignment.reviewerAssignedAt
          })
        }

        if (assignment.reviewerCompletedAt) {
          const reviewerReviewing = new Date(assignment.reviewerCompletedAt)
          reviewerReviewing.setHours(reviewerReviewing.getHours() - 4)
          logsToCreate.push({
            contractId: c.id,
            userId: assignment.reviewerId!,
            action: 'SUBMIT_OPINION',
            description: '复核人提交复核意见',
            fromStatus: 'REVIEWER_REVIEWING',
            toStatus: 'REVIEWER_COMPLETED',
            createdAt: reviewerReviewing
          })

          if (c.status === 'COMPLETED') {
            logsToCreate.push({
              contractId: c.id,
              userId: userMap.manager.id,
              action: 'COMPLETE',
              description: '合同审阅流程完成，已归档，合规缺口已入看板',
              fromStatus: 'REVIEWER_COMPLETED',
              toStatus: 'COMPLETED',
              createdAt: assignment.reviewerCompletedAt
            })
          }
        }
      }

      if (c.status === 'ERROR') {
        logsToCreate.push({
          contractId: c.id,
          userId: userMap.manager.id,
          action: 'ERROR',
          description: '发现对方提供资质文件存疑，暂停处理，待核实',
          toStatus: 'ERROR',
          createdAt: d(-1)
        })
      }

      if (c.status === 'RECTIFYING') {
        logsToCreate.push({
          contractId: c.id,
          userId: userMap.manager.id,
          action: 'RECTIFY',
          description: '根据律师意见开始整改，已上传新版合同',
          fromStatus: 'PENDING_RECTIFICATION',
          toStatus: 'RECTIFYING',
          createdAt: d(-1)
        })
      }
    }

    await tx.operationLog.createMany({ data: logsToCreate })

    console.log('✅ 合同创建完成:', contractTemplates.length, '份')
    console.log('✅ 操作日志:', logsToCreate.length, '条')
  })

  console.log('')
  console.log('🎉 种子数据初始化完成！')
  console.log('')
  console.log('演示账户:')
  console.log('  admin      / admin123  → 系统管理员')
  console.log('  manager    / 123456    → 法务负责人 (张明华)')
  console.log('  lawyer1    / 123456    → 律师 (李思远)')
  console.log('  lawyer2    / 123456    → 律师 (王晓峰)')
  console.log('  lawyer3    / 123456    → 律师 (赵雅婷)')
  console.log('  reviewer1  / 123456    → 复核人 (陈志强)')
  console.log('  reviewer2  / 123456    → 复核人 (刘美玲)')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
