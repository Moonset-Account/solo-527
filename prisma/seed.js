import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

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

  const patients = []
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
        status: 'ACTIVE',
        source: ['门诊', '推荐', '网络', '转诊'][i % 4],
        firstVisitDate: new Date(2024, 0, 1 + i),
        lastVisitDate: new Date(2024, 5, 1 + i)
      }
    })
    patients.push(patient)
  }

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

  for (let i = 1; i <= 15; i++) {
    const recordNo = `MR${String(i).padStart(8, '0')}`
    await prisma.medicalRecord.upsert({
      where: { recordNo },
      update: {},
      create: {
        recordNo,
        patientId: i,
        visitDate: new Date(2024, 5, 1 + i),
        chiefComplaint: ['颈部疼痛伴头晕', '腰痛伴下肢放射痛', '失眠多梦', '高血压头痛', '关节疼痛'][i % 5],
        presentIllness: '患者主诉上述症状已有数月，近一周加重。曾在当地医院就诊，给予药物治疗效果不佳。',
        pastHistory: '既往体健，无高血压、糖尿病病史。',
        diagnosis: ['颈椎病', '腰椎间盘突出症', '失眠症', '高血压病', '骨性关节炎'][i % 5],
        prescription: '中药汤剂7剂，日1剂水煎服。',
        treatment: ['针灸治疗', '推拿治疗', '艾灸治疗', '牵引治疗'][i % 4],
        summary: '患者中医辨证为气滞血瘀证，治以活血化瘀、通络止痛。',
        createdBy: 3,
        updatedBy: 3
      }
    })
  }

  for (let i = 1; i <= 10; i++) {
    const courseNo = `TC${String(i).padStart(8, '0')}`
    await prisma.treatmentCourse.upsert({
      where: { courseNo },
      update: {},
      create: {
        courseNo,
        patientId: i,
        planId: (i % 4) + 1,
        medicalRecordId: i,
        name: plans[(i % 4)].name,
        startDate: new Date(2024, 5, 1 + i),
        totalSessions: 10,
        completedSessions: i % 5,
        status: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED'][i % 4],
        isLost: i % 7 === 0,
        lostReason: i % 7 === 0 ? '患者因个人原因中断治疗' : null,
        lostDate: i % 7 === 0 ? new Date(2024, 5, 15 + i) : null,
        lostHandlerId: i % 7 === 0 ? 2 : null
      }
    })
  }

  const followUpTypes = ['PHONE', 'WECHAT', 'VISIT', 'OTHER']
  const followUpStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED']
  for (let i = 1; i <= 25; i++) {
    const taskNo = `FU${String(i).padStart(8, '0')}`
    const isCompleted = i % 3 === 0
    await prisma.followUpTask.upsert({
      where: { taskNo },
      update: {},
      create: {
        taskNo,
        patientId: ((i - 1) % 20) + 1,
        courseId: i <= 10 ? ((i - 1) % 10) + 1 : null,
        type: followUpTypes[i % 4],
        scheduledDate: new Date(2024, 5, 20 + i),
        status: followUpStatuses[i % 5],
        priority: i % 3 + 1,
        content: ['疗程中随访', '治疗后康复指导', '满意度调查', '复诊提醒', '流失挽回'][i % 5],
        createdBy: 2,
        assignedTo: 2,
        completedDate: isCompleted ? new Date(2024, 5, 20 + i) : null,
        result: isCompleted ? '患者反馈良好，症状有所缓解' : null
      }
    })

    if (isCompleted) {
      await prisma.followUpRecord.create({
        data: {
          taskId: i,
          recordDate: new Date(2024, 5, 20 + i),
          content: '电话随访患者，患者主诉症状明显好转，嘱咐继续按时服药，定期复诊。',
          contactResult: 'SUCCESS',
          nextFollowUp: new Date(2024, 6, 5 + i),
          operatorId: 2
        }
      })
    }
  }

  for (let i = 1; i <= 15; i++) {
    const billNo = `BILL${String(i).padStart(8, '0')}`
    const isPaid = i % 3 !== 0
    const amount = [1500, 2400, 1800, 2000, 300][i % 5]
    await prisma.billingRecord.upsert({
      where: { billNo },
      update: {},
      create: {
        billNo,
        patientId: ((i - 1) % 20) + 1,
        medicalRecordId: ((i - 1) % 15) + 1,
        courseId: i <= 10 ? ((i - 1) % 10) + 1 : null,
        amount: amount,
        paidAmount: isPaid ? amount : 0,
        status: isPaid ? 'PAID' : 'UNPAID',
        paymentMethod: isPaid ? ['微信', '支付宝', '医保', '现金'][i % 4] : null,
        paymentDate: isPaid ? new Date(2024, 5, 1 + i) : null,
        createdBy: 4
      }
    })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
