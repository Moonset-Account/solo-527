import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  console.log('Seeding users...')
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      phone: '13800138000'
    }
  })

  await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      password: hashedPassword,
      name: '运营负责人',
      role: 'OPERATOR',
      phone: '13800138001'
    }
  })

  await prisma.user.upsert({
    where: { username: 'doctor' },
    update: {},
    create: {
      username: 'doctor',
      password: hashedPassword,
      name: '张医生',
      role: 'DOCTOR',
      phone: '13800138002'
    }
  })

  await prisma.user.upsert({
    where: { username: 'finance' },
    update: {},
    create: {
      username: 'finance',
      password: hashedPassword,
      name: '李财务',
      role: 'FINANCE',
      phone: '13800138003'
    }
  })

  console.log('Seeding patients...')
  const patients = []
  const allergyList = [null, null, '青霉素过敏', '花粉过敏', null, '海鲜过敏']
  const historyList = [null, null, '高血压病史10年', '糖尿病史5年', null, '慢性胃炎']
  for (let i = 1; i <= 20; i++) {
    const patientNo = `P${String(i).padStart(6, '0')}`
    const patient = await prisma.patient.upsert({
      where: { patientNo },
      update: {},
      create: {
        patientNo,
        name: `患者${i}`,
        gender: i % 2 === 0 ? '女' : '男',
        age: 30 + i,
        phone: `138${String(10000000 + i).slice(-8)}`,
        idCard: `110101199${i % 10}0101${String(1000 + i).slice(-4)}`,
        address: `北京市朝阳区某某街道${i}号`,
        allergy: allergyList[i % allergyList.length],
        medicalHistory: historyList[i % historyList.length],
        status: i === 7 || i === 14 ? 'LOST' : 'ACTIVE',
        source: ['门诊', '推荐', '网络', '转诊'][i % 4],
        firstVisitDate: new Date(2025, 4, 1 + i),
        lastVisitDate: new Date(2025, 5, 1 + i)
      }
    })
    patients.push(patient)
  }

  console.log('Seeding treatment plans...')
  const plans = [
    {
      planNo: 'PLAN001',
      name: '颈椎病针灸疗程',
      description: '针对颈椎病的针灸治疗方案',
      type: '针灸',
      duration: 30,
      frequency: '每周2次',
      items: { treatments: ['针灸', '拔罐', '艾灸'], eachTime: 30 },
      price: 1500,
      status: 'ACTIVE'
    },
    {
      planNo: 'PLAN002',
      name: '腰椎间盘突出推拿疗程',
      description: '腰椎间盘突出的推拿康复方案',
      type: '推拿',
      duration: 45,
      frequency: '每周3次',
      items: { treatments: ['推拿', '牵引', '理疗'], eachTime: 45 },
      price: 2400,
      status: 'ACTIVE'
    },
    {
      planNo: 'PLAN003',
      name: '失眠调理中药疗程',
      description: '失眠的中药调理方案',
      type: '中药',
      duration: 90,
      frequency: '每日1剂',
      items: { treatments: ['中药内服', '艾灸'], eachTime: 15 },
      price: 1800,
      status: 'ACTIVE'
    },
    {
      planNo: 'PLAN004',
      name: '高血压调理方案',
      description: '高血压的中医调理方案',
      type: '综合调理',
      duration: 60,
      frequency: '每周2次',
      items: { treatments: ['针灸', '中药', '食疗指导'], eachTime: 30 },
      price: 2000,
      status: 'ACTIVE'
    }
  ]

  for (const plan of plans) {
    await prisma.treatmentPlan.upsert({
      where: { planNo: plan.planNo },
      update: {},
      create: plan
    })
  }

  console.log('Seeding medical records & data sources...')
  const diagnoses = ['颈椎病', '腰椎间盘突出症', '失眠症', '高血压病', '骨性关节炎']
  for (let i = 1; i <= 15; i++) {
    const recordNo = `MR${String(i).padStart(8, '0')}`
    const diag = diagnoses[i % 5]
    const result = await prisma.medicalRecord.upsert({
      where: { recordNo },
      update: {},
      create: {
        recordNo,
        patientId: i,
        visitDate: new Date(2025, 5, 1 + i),
        chiefComplaint: ['颈部疼痛伴头晕', '腰痛伴下肢放射痛', '失眠多梦', '高血压头痛', '关节疼痛'][i % 5],
        presentIllness: '患者主诉上述症状已有数月，近一周加重。曾在当地医院就诊，给予药物治疗效果不佳。',
        pastHistory: '既往体健，无高血压、糖尿病病史。',
        diagnosis: diag,
        prescription: '中药汤剂7剂，日1剂水煎服。',
        treatment: ['针灸治疗', '推拿治疗', '艾灸治疗', '牵引治疗'][i % 4],
        summary: `患者${diag}，中医辨证为气滞血瘀证，治以活血化瘀、通络止痛。`,
        createdBy: 3,
        updatedBy: 3
      }
    })

    await prisma.dataSource.upsert({
      where: {
        sourceType_sourceId_targetType_targetId_relation: {
          sourceType: 'PATIENT',
          sourceId: i,
          targetType: 'MEDICAL_RECORD',
          targetId: i,
          relation: '就诊记录'
        }
      },
      update: {},
      create: {
        sourceType: 'PATIENT',
        sourceId: i,
        sourceNo: `P${String(i).padStart(6, '0')}`,
        targetType: 'MEDICAL_RECORD',
        targetId: i,
        targetNo: recordNo,
        relation: '就诊记录',
        remark: `${diag}就诊记录`
      }
    })
  }

  console.log('Seeding treatment courses...')
  for (let i = 1; i <= 10; i++) {
    const courseNo = `TC${String(i).padStart(8, '0')}`
    const planIndex = (i - 1) % 4
    const isLost = i === 7
    const courseName = plans[planIndex].name
    await prisma.treatmentCourse.upsert({
      where: { courseNo },
      update: {},
      create: {
        courseNo,
        patientId: i,
        planId: planIndex + 1,
        medicalRecordId: i,
        name: courseName,
        startDate: new Date(2025, 5, 1 + i),
        totalSessions: 10,
        completedSessions: Math.min(i, 6),
        status: isLost ? 'SUSPENDED' : ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED'][i % 4],
        isLost: isLost,
        lostReason: isLost ? '患者因个人原因搬离北京，无法继续治疗' : null,
        lostDate: isLost ? new Date(2025, 5, 15 + i) : null,
        lostHandlerId: isLost ? 2 : null
      }
    })

    await prisma.dataSource.upsert({
      where: {
        sourceType_sourceId_targetType_targetId_relation: {
          sourceType: 'MEDICAL_RECORD',
          sourceId: i,
          targetType: 'TREATMENT_COURSE',
          targetId: i,
          relation: '开立疗程'
        }
      },
      update: {},
      create: {
        sourceType: 'MEDICAL_RECORD',
        sourceId: i,
        sourceNo: `MR${String(i).padStart(8, '0')}`,
        targetType: 'TREATMENT_COURSE',
        targetId: i,
        targetNo: courseNo,
        relation: '开立疗程',
        remark: `根据病历开立${courseName}`
      }
    })

    if (isLost) {
      await prisma.auditLog.create({
        data: {
          operationType: 'MARK_LOST',
          sourceType: 'TREATMENT_COURSE',
          sourceId: i,
          sourceNo: courseNo,
          changeReason: '患者因个人原因搬离北京，无法继续治疗',
          operatorId: 2,
          patientId: i,
          courseId: i
        }
      })

      const archiveNo = `PA${String(i).padStart(8, '0')}`
      await prisma.patientArchive.upsert({
        where: { archiveNo },
        update: {},
        create: {
          archiveNo,
          patientId: i,
          archiveType: 'PATIENT_LOST',
          treatmentCourseId: i,
          summary: `${courseName}，患者流失：搬离北京，无法继续治疗`,
          remark: '流失处理完成，已沉淀到收费报表'
        }
      })
    }
  }

  console.log('Seeding follow-up tasks & records...')
  const followUpTypes = ['PHONE', 'WECHAT', 'VISIT', 'OTHER']
  const followUpStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED']
  for (let i = 1; i <= 25; i++) {
    const taskNo = `FU${String(i).padStart(8, '0')}`
    const isCompleted = i % 3 === 0
    const patientId = ((i - 1) % 20) + 1
    const courseId = i <= 10 ? ((i - 1) % 10) + 1 : null
    await prisma.followUpTask.upsert({
      where: { taskNo },
      update: {},
      create: {
        taskNo,
        patientId,
        courseId,
        type: followUpTypes[i % 4],
        scheduledDate: new Date(2025, 5, 20 + i),
        status: followUpStatuses[i % 5],
        priority: i % 3 + 1,
        content: ['疗程中随访', '治疗后康复指导', '满意度调查', '复诊提醒', '流失挽回'][i % 5],
        createdBy: 2,
        assignedTo: 2,
        completedDate: isCompleted ? new Date(2025, 5, 20 + i) : null,
        result: isCompleted ? '患者反馈良好，症状有所缓解' : null
      }
    })

    if (courseId) {
      await prisma.dataSource.upsert({
        where: {
          sourceType_sourceId_targetType_targetId_relation: {
            sourceType: 'TREATMENT_COURSE',
            sourceId: courseId,
            targetType: 'FOLLOW_UP_TASK',
            targetId: i,
            relation: '疗程随访'
          }
        },
        update: {},
        create: {
          sourceType: 'TREATMENT_COURSE',
          sourceId: courseId,
          sourceNo: `TC${String(courseId).padStart(8, '0')}`,
          targetType: 'FOLLOW_UP_TASK',
          targetId: i,
          targetNo: taskNo,
          relation: '疗程随访',
          remark: '按疗程方案自动生成随访任务'
        }
      })
    }

    if (isCompleted) {
      const contactResults = [
        { content: '电话随访患者，患者主诉症状明显好转，嘱咐继续按时服药，定期复诊。', result: '联系成功，患者情况良好' },
        { content: '微信发送康复指导资料，患者回复表示感谢。', result: '联系成功，症状有所改善' },
        { content: '上门回访，查看恢复情况，调整治疗方案。', result: '联系成功，需调整方案' }
      ]
      const idx = i % contactResults.length
      const record = await prisma.followUpRecord.create({
        data: {
          taskId: i,
          recordDate: new Date(2025, 5, 20 + i),
          content: contactResults[idx].content,
          contactResult: contactResults[idx].result,
          nextFollowUp: new Date(2025, 6, 5 + i),
          operatorId: 2
        }
      })

      await prisma.dataSource.upsert({
        where: {
          sourceType_sourceId_targetType_targetId_relation: {
            sourceType: 'FOLLOW_UP_TASK',
            sourceId: i,
            targetType: 'FOLLOW_UP_RECORD',
            targetId: record.id,
            relation: '随访记录'
          }
        },
        update: {},
        create: {
          sourceType: 'FOLLOW_UP_TASK',
          sourceId: i,
          sourceNo: taskNo,
          targetType: 'FOLLOW_UP_RECORD',
          targetId: record.id,
          targetNo: `R${String(record.id).padStart(6, '0')}`,
          relation: '随访记录',
          remark: contactResults[idx].result
        }
      })
    }
  }

  console.log('Seeding billing records & reports...')
  const billingItems = [
    { name: '针灸治疗', spec: '每次30分钟', unitPrice: 200, quantity: 5 },
    { name: '中药饮片', spec: '7剂，每日1剂', unitPrice: 150, quantity: 2 },
    { name: '推拿按摩', spec: '每次45分钟', unitPrice: 250, quantity: 4 },
    { name: '理疗仪器', spec: '每次20分钟', unitPrice: 100, quantity: 6 },
    { name: '艾灸调理', spec: '每次20分钟', unitPrice: 80, quantity: 8 }
  ]
  for (let i = 1; i <= 15; i++) {
    const billNo = `BILL${String(i).padStart(8, '0')}`
    const isPaid = i % 3 !== 0
    const baseAmount = [1500, 2400, 1800, 2000, 300][i % 5]
    const courseId = i <= 10 ? ((i - 1) % 10) + 1 : null
    const itemIdx = i % billingItems.length
    const items = [billingItems[itemIdx]]
    const amount = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)

    const bill = await prisma.billingRecord.upsert({
      where: { billNo },
      update: {},
      create: {
        billNo,
        patientId: ((i - 1) % 20) + 1,
        medicalRecordId: ((i - 1) % 15) + 1,
        courseId,
        amount,
        paidAmount: isPaid ? amount : Math.floor(amount * 0.3),
        status: isPaid ? 'PAID' : 'PARTIAL',
        paymentMethod: isPaid ? ['微信', '支付宝', '医保', '现金'][i % 4] : '微信',
        paymentDate: isPaid ? new Date(2025, 5, 1 + i) : new Date(2025, 5, 1 + i),
        createdBy: 4,
        items,
        remark: isPaid ? '已结清' : '已支付部分款项，需催收'
      }
    })

    if (courseId) {
      await prisma.dataSource.upsert({
        where: {
          sourceType_sourceId_targetType_targetId_relation: {
            sourceType: 'TREATMENT_COURSE',
            sourceId: courseId,
            targetType: 'BILLING_RECORD',
            targetId: i,
            relation: '疗程收费'
          }
        },
        update: {},
        create: {
          sourceType: 'TREATMENT_COURSE',
          sourceId: courseId,
          sourceNo: `TC${String(courseId).padStart(8, '0')}`,
          targetType: 'BILLING_RECORD',
          targetId: i,
          targetNo: billNo,
          relation: '疗程收费',
          remark: `治疗费用结算，金额¥${amount}`
        }
      })
    }

    const archiveNo = `BR${String(i).padStart(8, '0')}`
    await prisma.patientArchive.upsert({
      where: { archiveNo },
      update: {},
      create: {
        archiveNo,
        patientId: bill.patientId,
        archiveType: 'BILLING_RECONCILIATION',
        medicalRecordId: ((i - 1) % 15) + 1,
        billingRecordId: i,
        treatmentCourseId: courseId || undefined,
        summary: `收费单${billNo}，金额¥${amount}，${isPaid ? '已结清' : '部分付款'}`,
        remark: '月度收费核对归档'
      }
    })
  }

  console.log('Seeding billing report...')
  const reportNo = `RPT202506`
  await prisma.billingReport.upsert({
    where: { reportNo },
    update: {},
    create: {
      reportNo,
      reportDate: new Date(2025, 5, 30),
      period: '2025-06',
      totalAmount: 21300,
      paidAmount: 16800,
      unpaidAmount: 4500,
      patientCount: 20,
      newPatientCount: 5,
      lostPatientCount: 2,
      remark: '2025年6月收费汇总报表'
    }
  })

  console.log('Seeding monthly summary archives...')
  const monthSummary = `M202506`
  await prisma.patientArchive.upsert({
    where: { archiveNo: monthSummary },
    update: {},
    create: {
      archiveNo: monthSummary,
      patientId: 1,
      archiveType: 'MONTHLY_SUMMARY',
      summary: '2025年6月月度汇总：20位患者、15份病历、25次随访、15笔收费',
      remark: '运营负责人月度核对'
    }
  })

  console.log('All seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
