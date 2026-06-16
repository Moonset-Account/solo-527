import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始初始化种子数据...')

  await prisma.checkIn.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.noShowRecord.deleteMany()
  await prisma.stageHistory.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.apiRetryLog.deleteMany()
  await prisma.interview.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.interviewer.deleteMany()
  await prisma.reminderConfig.deleteMany()
  console.log('🧹 已清理所有历史数据')

  const interviewers = await Promise.all([
    prisma.interviewer.create({
      data: { name: '张技术', email: 'zhangjs@example.com', title: '技术总监', department: '技术' }
    }),
    prisma.interviewer.create({
      data: { name: '李架构', email: 'lijg@example.com', title: '架构师', department: '技术' }
    }),
    prisma.interviewer.create({
      data: { name: '王产品', email: 'wangcp@example.com', title: '产品总监', department: '产品' }
    }),
    prisma.interviewer.create({
      data: { name: '赵设计', email: 'zhaosj@example.com', title: '设计主管', department: '设计' }
    }),
    prisma.interviewer.create({
      data: { name: '钱HR', email: 'qianhr@example.com', title: 'HR经理', department: '人力资源' }
    })
  ])
  console.log('✅ 已创建', interviewers.length, '个面试官')

  const now = new Date()
  const candidatesData = [
    {
      name: '陈小明', email: 'chenxm@example.com', phone: '13800000001',
      position: '高级前端工程师', department: '技术', currentStage: 'FIRST_INTERVIEW',
      status: 'ACTIVE', source: '拉勾网',
      interviews: [
        {
          title: '技术一面 - 高级前端', type: 'TECHNICAL',
          scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          durationMin: 60, status: 'SCHEDULED',
          qualityScore: null, location: 'A座3楼301会议室',
          meetingUrl: 'https://meeting.example.com/123456',
          notes: '重点考察React和工程化能力'
        },
        {
          title: '技术测评 - JavaScript', type: 'PHONE_SCREEN',
          scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          durationMin: 30, status: 'COMPLETED',
          qualityScore: 4, location: '线上',
          qualityDetail: {
            technicalSkill: 4,
            problemSolving: 4,
            communication: 5,
            cultureFit: 4
          },
          feedback: '基础扎实，沟通良好，对前端工程化有一定理解',
          notes: '通过初筛，可以进入下一轮'
        }
      ],
      assessments: [
        {
          title: 'JavaScript 基础测评', type: 'CODING',
          scoreBefore: 65, scoreAfter: 82, status: 'COMPLETED',
          questionsBefore: {
            q1: 'var、let、const 的区别',
            q2: '闭包的原理和应用场景',
            q3: '原型链的理解',
            q4: '事件循环机制'
          },
          questionsAfter: {
            q1: 'var、let、const 的区别',
            q2: '闭包的原理和应用场景',
            q3: '原型链的理解',
            q4: '事件循环机制',
            q5: 'Promise 原理'
          },
          answersBefore: {
            q1: '作用域不同',
            q2: '函数嵌套函数',
            q3: '对象的__proto__',
            q4: '宏任务微任务'
          },
          answersAfter: {
            q1: 'var函数作用域，let/const块级作用域，const不可变',
            q2: '函数和词法环境的组合，用于数据私有化',
            q3: '对象通过__proto__指向原型，形成原型链',
            q4: '调用栈、任务队列，先执行同步代码，再处理微任务',
            q5: 'Promise是异步编程的一种解决方案，三种状态'
          },
          note: '测评后对概念的理解更加深入准确',
          takenAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
        }
      ],
      stageHistory: [
        { fromStage: 'SCREENING', toStage: 'TECH_ASSESSMENT', reason: '简历筛选通过', changedBy: 'system' },
        { fromStage: 'TECH_ASSESSMENT', toStage: 'FIRST_INTERVIEW', reason: '测评成绩良好，进入面试', changedBy: '张技术' }
      ],
      checkIns: [
        {
          interviewIndex: 1, checkInType: 'CANDIDATE_ARRIVED', location: 'A座大厅',
          ipAddress: '192.168.1.100', note: '提前15分钟到达'
        },
        {
          interviewIndex: 1, checkInType: 'INTERVIEWER_READY', location: '3楼301会议室',
          ipAddress: '192.168.1.101', note: '面试官已就位'
        }
      ],
      reminders: [
        {
          type: 'INTERVIEW_UPCOMING', severity: 'INFO', isBlocking: false,
          title: '面试即将开始', message: '您的技术一面将于明天14:00开始，请准时参加',
          sendAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), status: 'PENDING'
        },
        {
          type: 'STAGE_STALLED', severity: 'WARNING', isBlocking: false,
          title: '流程推进提醒', message: '候选人已通过测评，请尽快安排面试',
          sendAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), status: 'SENT',
          sentAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        }
      ]
    },
    {
      name: '刘小红', email: 'liuxh@example.com', phone: '13800000002',
      position: '产品经理', department: '产品', currentStage: 'SECOND_INTERVIEW',
      status: 'ACTIVE', source: '内推', referredBy: '王产品',
      interviews: [
        {
          title: '产品二面', type: 'BEHAVIORAL',
          scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          durationMin: 90, status: 'SCHEDULED', location: 'B座2楼201会议室'
        },
        {
          title: '产品一面', type: 'TECHNICAL',
          scheduledAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          durationMin: 60, status: 'COMPLETED',
          qualityScore: 5, location: '线上',
          qualityDetail: {
            technicalSkill: 5,
            problemSolving: 5,
            communication: 4,
            cultureFit: 5
          },
          feedback: '产品思维清晰，有成功案例，数据分析能力强',
          notes: '强烈推荐进入下一轮'
        },
        {
          title: '电话初筛', type: 'PHONE_SCREEN',
          scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          durationMin: 30, status: 'COMPLETED',
          qualityScore: 4, feedback: '沟通顺畅，经历匹配'
        }
      ],
      assessments: [
        {
          title: '产品案例分析测评', type: 'TAKE_HOME',
          scoreBefore: 70, scoreAfter: 88, status: 'COMPLETED',
          questionsBefore: {
            q1: '如何提升用户留存',
            q2: '竞品分析思路',
            q3: '需求优先级排序'
          },
          questionsAfter: {
            q1: '如何提升用户留存',
            q2: '竞品分析思路',
            q3: '需求优先级排序',
            q4: '数据指标体系搭建'
          },
          note: '案例分析结构完整，数据支撑充分',
          takenAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
        }
      ],
      stageHistory: [
        { fromStage: 'SCREENING', toStage: 'TECH_ASSESSMENT', reason: '内推，简历优秀', changedBy: '王产品' },
        { fromStage: 'TECH_ASSESSMENT', toStage: 'FIRST_INTERVIEW', reason: '测评通过', changedBy: 'system' },
        { fromStage: 'FIRST_INTERVIEW', toStage: 'SECOND_INTERVIEW', reason: '一面评价优秀', changedBy: '王产品' }
      ],
      checkIns: [
        {
          interviewIndex: 1, checkInType: 'CANDIDATE_ARRIVED', location: 'B座大厅',
          ipAddress: '192.168.1.102', note: '提前10分钟到达'
        },
        {
          interviewIndex: 1, checkInType: 'INTERVIEWER_READY', location: '2楼201会议室',
          ipAddress: '192.168.1.103', note: '面试官已就位'
        },
        {
          interviewIndex: 1, checkInType: 'COMPLETED', location: '2楼201会议室',
          ipAddress: '192.168.1.103', note: '面试顺利完成'
        }
      ],
      reminders: [
        {
          type: 'INTERVIEW_UPCOMING', severity: 'INFO', isBlocking: false,
          title: '产品二面提醒', message: '您的产品二面将于明天10:00开始',
          sendAt: new Date(now.getTime() + 12 * 60 * 60 * 1000), status: 'PENDING'
        }
      ],
      noShows: []
    },
    {
      name: '周大海', email: 'zhoudh@example.com', phone: '13800000003',
      position: '后端开发工程师', department: '技术', currentStage: 'TECH_ASSESSMENT',
      status: 'ACTIVE', source: 'BOSS直聘',
      interviews: [
        {
          title: '技术测评 - Java', type: 'TECHNICAL',
          scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          durationMin: 90, status: 'SCHEDULED', location: '线上测评'
        }
      ],
      assessments: [
        {
          title: 'Java 基础测评', type: 'ALGORITHM',
          scoreBefore: 55, scoreAfter: null, status: 'IN_PROGRESS',
          questionsBefore: {
            q1: 'JVM内存结构',
            q2: 'HashMap原理',
            q3: '线程池参数'
          },
          takenAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        }
      ],
      stageHistory: [
        { fromStage: 'SCREENING', toStage: 'TECH_ASSESSMENT', reason: '5年后端经验，匹配度高', changedBy: '李架构' }
      ],
      checkIns: [],
      reminders: [
        {
          type: 'ASSESSMENT_DUE', severity: 'WARNING', isBlocking: false,
          title: '测评即将到期', message: '请在2天内完成Java技术测评',
          sendAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), status: 'PENDING'
        }
      ]
    },
    {
      name: '吴爽约', email: 'wusy@example.com', phone: '13800000004',
      position: 'UI设计师', department: '设计', currentStage: 'SCREENING',
      status: 'ON_HOLD', source: '智联招聘',
      interviews: [
        {
          title: '设计初面', type: 'BEHAVIORAL',
          scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          durationMin: 45, status: 'NO_SHOW', location: 'C座1楼101会议室'
        }
      ],
      assessments: [],
      stageHistory: [
        { fromStage: 'SCREENING', toStage: 'FIRST_INTERVIEW', reason: '作品集优秀', changedBy: '赵设计' },
        { fromStage: 'FIRST_INTERVIEW', toStage: 'SCREENING', reason: '首次爽约，暂停流程', changedBy: '赵设计' }
      ],
      checkIns: [
        {
          interviewIndex: 0, checkInType: 'CANDIDATE_ARRIVED', location: 'C座1楼101会议室',
          ipAddress: '192.168.1.104', note: '候选人未到场'
        },
        {
          interviewIndex: 0, checkInType: 'INTERVIEWER_READY', location: 'C座1楼101会议室',
          ipAddress: '192.168.1.105', note: '面试官已就位等待'
        },
        {
          interviewIndex: 0, checkInType: 'NO_SHOW_CONFIRMED', location: 'C座1楼101会议室',
          ipAddress: '192.168.1.104', note: '等待30分钟未到场，电话无人接听'
        }
      ],
      reminders: [
        {
          type: 'CANDIDATE_NO_SHOW', severity: 'CRITICAL', isBlocking: true,
          title: '候选人爽约 - 阻断告警', message: '候选人吴爽约未参加面试，请评估是否继续流程',
          sendAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: 'SENT',
          sentAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'FOLLOW_UP_NEEDED', severity: 'WARNING', isBlocking: false,
          title: '需要跟进爽约候选人', message: '请与候选人联系确认情况',
          sendAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), status: 'SENT',
          sentAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        }
      ],
      noShows: [
        {
          reason: '未按时参加面试，电话无人接听', isFirstTime: true,
          blockingAction: 'PIPELINE_PAUSED', handledBy: '赵设计',
          note: '已发送警告邮件，等待候选人回复'
        }
      ]
    },
    {
      name: '郑大牛', email: 'zhengdn@example.com', phone: '13800000005',
      position: '技术专家', department: '技术', currentStage: 'OFFER',
      status: 'ACTIVE', source: '猎头推荐',
      interviews: [
        {
          title: '终面 - 技术专家', type: 'FINAL',
          scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          durationMin: 120, status: 'COMPLETED',
          qualityScore: 5, location: '总部18楼董事会议室',
          qualityDetail: {
            technicalSkill: 5,
            problemSolving: 5,
            communication: 5,
            cultureFit: 5
          },
          feedback: '技术视野开阔，有大型系统架构经验，团队管理能力强，完全符合要求',
          notes: '强烈推荐发放Special Offer'
        },
        {
          title: '系统设计面试', type: 'SYSTEM_DESIGN',
          scheduledAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          durationMin: 90, status: 'COMPLETED',
          qualityScore: 5, feedback: '高并发系统设计思路清晰，考虑周全'
        },
        {
          title: '技术二面', type: 'TECHNICAL',
          scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          durationMin: 90, status: 'COMPLETED',
          qualityScore: 4, feedback: 'Java底层原理扎实，分布式经验丰富'
        },
        {
          title: '技术一面', type: 'TECHNICAL',
          scheduledAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          durationMin: 60, status: 'COMPLETED',
          qualityScore: 4, feedback: '基础扎实，项目经验丰富'
        }
      ],
      assessments: [
        {
          title: '系统设计测评', type: 'SYSTEM_DESIGN',
          scoreBefore: 85, scoreAfter: 95, status: 'COMPLETED',
          questionsBefore: {
            q1: '设计一个高并发秒杀系统',
            q2: '分布式事务解决方案'
          },
          questionsAfter: {
            q1: '设计一个高并发秒杀系统',
            q2: '分布式事务解决方案',
            q3: '多级缓存设计',
            q4: '数据库分库分表策略'
          },
          answersAfter: {
            q1: '限流、降级、缓存、消息队列削峰',
            q2: 'TCC、可靠消息、最大努力通知',
            q3: 'CDN、Nginx、Redis、JVM多级缓存',
            q4: '按业务、按ID范围、按Hash分库分表'
          },
          note: '测评后对系统设计的完整性有显著提升',
          takenAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000)
        }
      ],
      stageHistory: [
        { fromStage: 'SCREENING', toStage: 'TECH_ASSESSMENT', reason: '10年大厂经验，猎头强烈推荐', changedBy: '李架构' },
        { fromStage: 'TECH_ASSESSMENT', toStage: 'FIRST_INTERVIEW', reason: '测评优秀', changedBy: 'system' },
        { fromStage: 'FIRST_INTERVIEW', toStage: 'SECOND_INTERVIEW', reason: '一面通过', changedBy: '张技术' },
        { fromStage: 'SECOND_INTERVIEW', toStage: 'HR_INTERVIEW', reason: '二面通过', changedBy: '李架构' },
        { fromStage: 'HR_INTERVIEW', toStage: 'OFFER', reason: 'HR面通过，薪资谈妥', changedBy: '钱HR' }
      ],
      checkIns: [
        { interviewIndex: 0, checkInType: 'CANDIDATE_ARRIVED', location: '总部大厅', ipAddress: '10.0.0.1' },
        { interviewIndex: 0, checkInType: 'INTERVIEWER_READY', location: '18楼会议室', ipAddress: '10.0.0.2' },
        { interviewIndex: 0, checkInType: 'COMPLETED', location: '18楼会议室', ipAddress: '10.0.0.2', note: '面试非常成功' }
      ],
      reminders: [
        {
          type: 'FOLLOW_UP_NEEDED', severity: 'INFO', isBlocking: false,
          title: '准备发放Offer', message: '请尽快准备Offer文件，薪资范围40-50K',
          sendAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), status: 'PENDING'
        }
      ]
    },
    {
      name: '孙入职', email: 'sunrz@example.com', phone: '13800000006',
      position: '运营经理', department: '运营', currentStage: 'HIRED',
      status: 'HIRED', source: '校招',
      interviews: [
        {
          title: '终面', type: 'FINAL',
          scheduledAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          durationMin: 60, status: 'COMPLETED',
          qualityScore: 4, feedback: '综合素质好，有培养潜力'
        },
        {
          title: '业务一面', type: 'BEHAVIORAL',
          scheduledAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          durationMin: 45, status: 'COMPLETED',
          qualityScore: 4, feedback: '逻辑清晰，对运营有自己的理解'
        }
      ],
      assessments: [],
      stageHistory: [
        { fromStage: 'SCREENING', toStage: 'FIRST_INTERVIEW', reason: '985硕士，成绩优异', changedBy: 'system' },
        { fromStage: 'FIRST_INTERVIEW', toStage: 'HR_INTERVIEW', reason: '一面通过', changedBy: '运营主管' },
        { fromStage: 'HR_INTERVIEW', toStage: 'OFFER', reason: 'HR面通过', changedBy: '钱HR' },
        { fromStage: 'OFFER', toStage: 'HIRED', reason: '已接受Offer，下周一入职', changedBy: '钱HR' }
      ],
      checkIns: [],
      reminders: []
    },
    {
      name: '黄拒绝', email: 'huangjj@example.com', phone: '13800000007',
      position: '测试工程师', department: '技术', currentStage: 'REJECTED',
      status: 'REJECTED', source: '51job',
      interviews: [
        {
          title: '技术一面', type: 'TECHNICAL',
          scheduledAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          durationMin: 60, status: 'COMPLETED',
          qualityScore: 2, feedback: '基础薄弱，自动化测试经验不足'
        }
      ],
      assessments: [
        {
          title: '测试基础测评', type: 'CODING',
          scoreBefore: 45, scoreAfter: 50, status: 'COMPLETED',
          note: '基础较差，需要系统学习'
        }
      ],
      stageHistory: [
        { fromStage: 'SCREENING', toStage: 'TECH_ASSESSMENT', reason: '3年经验', changedBy: 'system' },
        { fromStage: 'TECH_ASSESSMENT', toStage: 'FIRST_INTERVIEW', reason: '测评勉强通过', changedBy: 'system' },
        { fromStage: 'FIRST_INTERVIEW', toStage: 'REJECTED', reason: '技术能力不达标', changedBy: '张技术' }
      ],
      checkIns: [],
      reminders: []
    }
  ]

  let candidateCount = 0
  for (const cData of candidatesData) {
    const { interviews, assessments, stageHistory, checkIns, reminders, noShows, ...candidateBase } = cData

    const candidate = await prisma.candidate.create({
      data: {
        ...candidateBase,
        interviews: {
          create: interviews.map((iv: any) => ({
            ...iv,
            interviewerId: interviewers[Math.floor(Math.random() * interviewers.length)].id
          }))
        },
        assessments: { create: assessments },
        stageHistory: { create: stageHistory }
      },
      include: { interviews: true }
    })

    for (const ci of checkIns) {
      const interviewIdx = (ci as any).interviewIndex ?? 0
      await prisma.checkIn.create({
        data: {
          checkInType: ci.checkInType,
          location: ci.location,
          ipAddress: ci.ipAddress,
          note: ci.note,
          candidateId: candidate.id,
          interviewId: candidate.interviews[interviewIdx]?.id
        }
      })
    }

    for (const r of reminders) {
      await prisma.reminder.create({
        data: {
          ...r,
          candidateId: candidate.id,
          interviewId: candidate.interviews[0]?.id
        }
      })
    }

    for (const ns of noShows || []) {
      await prisma.noShowRecord.create({
        data: {
          ...ns,
          candidateId: candidate.id,
          interviewId: candidate.interviews.find((iv: any) => iv.status === 'NO_SHOW')?.id
        }
      })
    }
    candidateCount++
  }
  console.log('✅ 已创建', candidateCount, '个候选人')

  const configs = await Promise.all([
    prisma.reminderConfig.create({
      data: {
        name: '面试前1小时提醒', triggerType: 'INTERVIEW_UPCOMING',
        thresholdHours: 1, severity: 'INFO', isBlocking: false, isEnabled: true,
        messageTemplate: '您的面试将于1小时后开始，请准时参加'
      }
    }),
    prisma.reminderConfig.create({
      data: {
        name: '面试前24小时提醒', triggerType: 'INTERVIEW_UPCOMING',
        thresholdHours: 24, severity: 'INFO', isBlocking: false, isEnabled: true,
        messageTemplate: '您的面试将于明天开始，请做好准备'
      }
    }),
    prisma.reminderConfig.create({
      data: {
        name: '测评到期前2天提醒', triggerType: 'ASSESSMENT_DUE',
        thresholdDays: 2, severity: 'WARNING', isBlocking: false, isEnabled: true,
        messageTemplate: '您的测评还有2天到期，请及时完成'
      }
    }),
    prisma.reminderConfig.create({
      data: {
        name: '阶段停滞超过7天提醒', triggerType: 'STAGE_STALLED',
        thresholdDays: 7, severity: 'WARNING', isBlocking: false, isEnabled: true,
        messageTemplate: '候选人在当前阶段已超过7天，请推进流程'
      }
    }),
    prisma.reminderConfig.create({
      data: {
        name: '阶段停滞超过14天告警', triggerType: 'STAGE_STALLED',
        thresholdDays: 14, severity: 'CRITICAL', isBlocking: false, isEnabled: true,
        messageTemplate: '候选人在当前阶段已超过14天，严重滞后！'
      }
    }),
    prisma.reminderConfig.create({
      data: {
        name: '首次爽约警告', triggerType: 'NO_SHOW_FIRST',
        thresholdMinutes: 30, severity: 'WARNING', isBlocking: false, isEnabled: true,
        messageTemplate: '候选人首次爽约，已发送警告'
      }
    }),
    prisma.reminderConfig.create({
      data: {
        name: '重复爽约阻断', triggerType: 'NO_SHOW_REPEAT',
        thresholdMinutes: 0, severity: 'CRITICAL', isBlocking: true, isEnabled: true,
        messageTemplate: '候选人多次爽约，已自动阻断面试流程！'
      }
    })
  ])
  console.log('✅ 已创建', configs.length, '条提醒规则配置')

  const allInterviews = await prisma.interview.findMany()
  const retryLogs = await Promise.all([
    prisma.apiRetryLog.create({
      data: {
        endpoint: '/api/interviews',
        method: 'POST',
        errorMessage: 'Database connection timeout',
        errorCode: 'CONN_TIMEOUT',
        retryCount: 2,
        maxRetries: 3,
        lastAttemptAt: new Date(now.getTime() - 1000 * 60 * 5),
        nextRetryAt: new Date(now.getTime() + 1000 * 60 * 3),
        isSuccess: false,
        interviewId: allInterviews[0]?.id,
        requestBody: JSON.stringify({ title: '技术一面', candidateId: 1 }) as any,
        responseBody: JSON.stringify({ error: 'Connection timeout after 30s' }) as any
      }
    }),
    prisma.apiRetryLog.create({
      data: {
        endpoint: '/api/reminders',
        method: 'POST',
        errorMessage: 'Third-party SMS service unavailable',
        errorCode: 'SMS_SERVICE_DOWN',
        retryCount: 3,
        maxRetries: 3,
        lastAttemptAt: new Date(now.getTime() - 1000 * 60 * 30),
        isSuccess: false,
        interviewId: allInterviews[1]?.id,
        requestBody: JSON.stringify({ type: 'INTERVIEW_UPCOMING', candidateId: 2 }) as any,
        responseBody: JSON.stringify({ error: 'SMS gateway returned 503' }) as any
      }
    }),
    prisma.apiRetryLog.create({
      data: {
        endpoint: '/api/candidates/1/stage',
        method: 'POST',
        errorMessage: 'Temporary network issue',
        errorCode: 'NETWORK_ERROR',
        retryCount: 1,
        maxRetries: 3,
        lastAttemptAt: new Date(now.getTime() - 1000 * 60 * 120),
        successAt: new Date(now.getTime() - 1000 * 60 * 118),
        isSuccess: true,
        interviewId: allInterviews[2]?.id,
        requestBody: JSON.stringify({ toStage: 'FIRST_INTERVIEW' }) as any,
        responseBody: JSON.stringify({ id: 1, currentStage: 'FIRST_INTERVIEW' }) as any
      }
    }),
    prisma.apiRetryLog.create({
      data: {
        endpoint: '/api/assessments',
        method: 'POST',
        errorMessage: 'Rate limit exceeded',
        errorCode: 'RATE_LIMIT',
        retryCount: 2,
        maxRetries: 3,
        lastAttemptAt: new Date(now.getTime() - 1000 * 60 * 15),
        nextRetryAt: new Date(now.getTime() + 1000 * 60 * 1),
        isSuccess: false,
        requestBody: JSON.stringify({ title: 'Java测评', type: 'ALGORITHM' }) as any,
        responseBody: JSON.stringify({ error: 'Too many requests, please try again later' }) as any
      }
    }),
    prisma.apiRetryLog.create({
      data: {
        endpoint: '/api/interviews/5/no-show',
        method: 'POST',
        errorMessage: '',
        retryCount: 0,
        maxRetries: 3,
        lastAttemptAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        successAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        isSuccess: true,
        interviewId: allInterviews.find(i => i.status === 'NO_SHOW')?.id,
        requestBody: JSON.stringify({ reason: '未按时到场' }) as any,
        responseBody: JSON.stringify({ status: 'NO_SHOW' }) as any
      }
    })
  ])
  console.log('✅ 已创建', retryLogs.length, '条接口重试日志')

  console.log('')
  console.log('🎉 种子数据初始化完成！')
  console.log('')
  console.log('📊 数据概览：')
  console.log('   👨‍💼 面试官：', interviewers.length, '人')
  console.log('   👥 候选人：', candidateCount, '人')
  console.log('   ⚙️  提醒规则：', configs.length, '条')
  console.log('   🔄 重试日志：', retryLogs.length, '条')
  console.log('')
  console.log('📋 候选人分布：')
  console.log('   🟢 面试中：', candidatesData.filter(c => c.status === 'ACTIVE').length, '人')
  console.log('   🟡 暂停中：', candidatesData.filter(c => c.status === 'ON_HOLD').length, '人')
  console.log('   🟢 已入职：', candidatesData.filter(c => c.status === 'HIRED').length, '人')
  console.log('   🔴 已拒绝：', candidatesData.filter(c => c.status === 'REJECTED').length, '人')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
