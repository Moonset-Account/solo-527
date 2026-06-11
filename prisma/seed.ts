import { PrismaClient, UserRole, TopicStatus, ScriptStatus, MaterialAccessLevel, AnomalyType, AnomalyStatus, TodoType, TodoStatus, ExportStatus, ExportFormat, MaterialType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.materialPermission.deleteMany()
  await prisma.coverVersion.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.todo.deleteMany()
  await prisma.anomaly.deleteMany()
  await prisma.productionRecord.deleteMany()
  await prisma.exportTask.deleteMany()
  await prisma.material.deleteMany()
  await prisma.script.deleteMany()
  await prisma.topic.deleteMany()
  await prisma.user.deleteMany()

  const admin = await prisma.user.create({
    data: {
      name: '管理员',
      email: 'admin@example.com',
      password: await hash('admin123', 10),
      role: UserRole.ADMIN,
    },
  })

  const supervisor = await prisma.user.create({
    data: {
      name: '编辑主管',
      email: 'supervisor@example.com',
      password: await hash('admin123', 10),
      role: UserRole.EDITOR_SUPERVISOR,
    },
  })

  const editor1 = await prisma.user.create({
    data: {
      name: '编辑-小李',
      email: 'editor1@example.com',
      password: await hash('admin123', 10),
      role: UserRole.EDITOR,
    },
  })

  const editor2 = await prisma.user.create({
    data: {
      name: '编辑-小张',
      email: 'editor2@example.com',
      password: await hash('admin123', 10),
      role: UserRole.EDITOR,
    },
  })

  const creator1 = await prisma.user.create({
    data: {
      name: '创作者-小王',
      email: 'creator1@example.com',
      password: await hash('admin123', 10),
      role: UserRole.CREATOR,
    },
  })

  const creator2 = await prisma.user.create({
    data: {
      name: '创作者-小赵',
      email: 'creator2@example.com',
      password: await hash('admin123', 10),
      role: UserRole.CREATOR,
    },
  })

  const topic1 = await prisma.topic.create({
    data: {
      title: '春季新品发布短视频',
      description: '展示春季新品系列，重点突出轻盈面料和清新色彩搭配，面向25-35岁都市女性',
      tags: ['春季', '新品', '时尚'],
      priority: 1,
      status: TopicStatus.IN_PRODUCTION,
      scheduledDate: new Date('2026-06-20'),
      deadline: new Date('2026-06-15'),
      creatorId: creator1.id,
      assigneeId: editor1.id,
    },
  })

  const topic2 = await prisma.topic.create({
    data: {
      title: '品牌故事系列-匠心篇',
      description: '讲述品牌创始人的匠心精神，展示手工艺制作过程，传递品牌价值观',
      tags: ['品牌故事', '匠心', '工艺'],
      priority: 2,
      status: TopicStatus.APPROVED,
      scheduledDate: new Date('2026-06-25'),
      creatorId: creator2.id,
      assigneeId: editor2.id,
    },
  })

  const topic3 = await prisma.topic.create({
    data: {
      title: '618大促预热短视频',
      description: '618大促活动预热，突出优惠力度和限时抢购，营造紧迫感',
      tags: ['618', '促销', '电商'],
      priority: 1,
      status: TopicStatus.PENDING_REVIEW,
      creatorId: creator1.id,
      assigneeId: editor1.id,
    },
  })

  const topic4 = await prisma.topic.create({
    data: {
      title: '夏日清凉穿搭指南',
      description: '夏季穿搭教程，展示不同场景的清凉穿搭方案',
      tags: ['夏季', '穿搭', '教程'],
      priority: 3,
      status: TopicStatus.DRAFT,
      creatorId: creator2.id,
    },
  })

  const topic5 = await prisma.topic.create({
    data: {
      title: '用户UGC内容合集',
      description: '收集用户真实使用反馈，制作用户故事合集视频',
      tags: ['UGC', '用户故事', '口碑'],
      priority: 4,
      status: TopicStatus.COMPLETED,
      creatorId: creator1.id,
      assigneeId: editor2.id,
    },
  })

  const topic6 = await prisma.topic.create({
    data: {
      title: '排期冲突选题A',
      description: '与618大促预热排期冲突的选题',
      tags: ['冲突测试'],
      priority: 2,
      status: TopicStatus.APPROVED,
      scheduledDate: new Date('2026-06-18'),
      creatorId: creator1.id,
      assigneeId: editor1.id,
    },
  })

  const script1 = await prisma.script.create({
    data: {
      topicId: topic1.id,
      version: '1.0',
      content: '【开场】品牌logo动画（2秒）\n【场景1】清晨阳光洒进窗户，模特穿着春季新品自然起床（5秒）\n【场景2】搭配细节特写，面料质感展示（8秒）\n【场景3】不同场景切换展示3套搭配（15秒）\n【结尾】品牌slogan + 优惠信息（5秒）',
      duration: 35,
      status: ScriptStatus.APPROVED,
      creatorId: editor1.id,
      assigneeId: creator1.id,
      reviewOpinion: '节奏把控到位，场景切换自然，建议增加面料特写镜头',
      readingFeedback: '整体流畅，目标受众匹配度高',
    },
  })

  const script2 = await prisma.script.create({
    data: {
      topicId: topic2.id,
      version: '1.0',
      content: '【开场】手工工具特写（3秒）\n【正文】创始人讲述品牌起源故事（20秒）\n【展示】手工艺制作过程慢镜头（15秒）\n【结尾】品牌理念文字呈现（5秒）',
      duration: 43,
      status: ScriptStatus.PENDING_REVIEW,
      creatorId: editor2.id,
      assigneeId: creator2.id,
      readingFeedback: '故事性强，但时长偏长，建议精简至30秒内',
    },
  })

  const script3 = await prisma.script.create({
    data: {
      topicId: topic3.id,
      version: '2.0',
      content: '【开场】倒计时特效（2秒）\n【场景1】爆款商品快闪展示（8秒）\n【场景2】价格对比动画（5秒）\n【场景3】限时抢购倒计时（5秒）\n【结尾】下单引导（3秒）',
      duration: 23,
      status: ScriptStatus.REVISION_REQUIRED,
      creatorId: editor1.id,
      reviewOpinion: '促销感不够强，建议增加价格对比和紧迫感元素',
      readingFeedback: '第二版节奏更紧凑，但还需加强优惠力度展示',
    },
  })

  const cover1 = await prisma.coverVersion.create({
    data: {
      scriptId: script1.id,
      version: '1.0',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20fashion%20cover%20clean%20minimal&image_size=landscape_16_9',
      description: '春季新品主封面-清新绿',
      isSelected: true,
      feedback: '色调清新，与春季主题匹配',
    },
  })

  const cover2 = await prisma.coverVersion.create({
    data: {
      scriptId: script1.id,
      version: '2.0',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20fashion%20cover%20warm&image_size=landscape_16_9',
      description: '春季新品备选封面-暖调',
      isSelected: false,
      feedback: '暖调也不错，但不如绿色版本贴合主题',
    },
  })

  await prisma.coverVersion.create({
    data: {
      scriptId: script2.id,
      version: '1.0',
      imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craftsman%20brand%20story%20cover&image_size=landscape_16_9',
      description: '匠心篇主封面',
      isSelected: true,
    },
  })

  const material1 = await prisma.material.create({
    data: {
      name: '春季新品拍摄素材A',
      type: MaterialType.VIDEO,
      url: 'https://example.com/videos/spring-a.mp4',
      thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20fashion%20video%20thumbnail&image_size=landscape_16_9',
      fileSize: 52428800,
      mimeType: 'video/mp4',
      tags: ['春季', '新品', '拍摄'],
      permission: MaterialAccessLevel.INTERNAL,
      topicId: topic1.id,
      scriptId: script1.id,
      uploaderId: creator1.id,
    },
  })

  const material2 = await prisma.material.create({
    data: {
      name: '品牌故事纪录片素材',
      type: MaterialType.VIDEO,
      url: 'https://example.com/videos/brand-story.mp4',
      thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=brand%20documentary%20thumbnail&image_size=landscape_16_9',
      fileSize: 104857600,
      mimeType: 'video/mp4',
      tags: ['品牌故事', '纪录片'],
      permission: MaterialAccessLevel.RESTRICTED,
      topicId: topic2.id,
      uploaderId: creator2.id,
    },
  })

  await prisma.material.create({
    data: {
      name: '618促销海报素材',
      type: MaterialType.IMAGE,
      url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=618%20sale%20poster%20red%20gold&image_size=portrait_4_3',
      tags: ['618', '促销', '海报'],
      permission: MaterialAccessLevel.PUBLIC,
      topicId: topic3.id,
      uploaderId: editor1.id,
    },
  })

  await prisma.material.create({
    data: {
      name: '背景音乐-清新春日',
      type: MaterialType.AUDIO,
      url: 'https://example.com/audio/spring-bgm.mp3',
      fileSize: 5242880,
      mimeType: 'audio/mpeg',
      tags: ['BGM', '春季'],
      permission: MaterialAccessLevel.INTERNAL,
      uploaderId: creator1.id,
    },
  })

  await prisma.material.create({
    data: {
      name: '产品卖点文档',
      type: MaterialType.DOCUMENT,
      url: 'https://example.com/docs/product-notes.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      tags: ['产品', '卖点'],
      permission: MaterialAccessLevel.RESTRICTED,
      topicId: topic1.id,
      uploaderId: editor1.id,
    },
  })

  await prisma.materialPermission.create({
    data: {
      materialId: material2.id,
      userId: editor1.id,
      canView: true,
      canEdit: false,
      canDownload: true,
      canShare: false,
    },
  })

  await prisma.materialPermission.create({
    data: {
      materialId: material2.id,
      userId: creator1.id,
      canView: true,
      canEdit: false,
      canDownload: false,
      canShare: false,
    },
  })

  await prisma.todo.createMany({
    data: [
      {
        type: TodoType.READ_FEEDBACK,
        title: '审核春季新品脚本阅读反馈',
        description: '请查阅并确认脚本阅读反馈',
        status: TodoStatus.PENDING,
        priority: 1,
        dueDate: new Date('2026-06-13'),
        assigneeId: editor1.id,
        creatorId: supervisor.id,
        scriptId: script1.id,
        topicId: topic1.id,
        readFeedback: '整体流畅，目标受众匹配度高，建议关注开场节奏',
      },
      {
        type: TodoType.REVIEW_OPINION,
        title: '处理品牌故事脚本审稿意见',
        description: '根据审稿意见修改脚本',
        status: TodoStatus.IN_PROGRESS,
        priority: 2,
        dueDate: new Date('2026-06-14'),
        assigneeId: editor2.id,
        creatorId: supervisor.id,
        scriptId: script2.id,
        topicId: topic2.id,
        reviewOpinion: '故事性强，但时长偏长，建议精简至30秒内',
      },
      {
        type: TodoType.COVER_VERSION,
        title: '确认春季新品封面版本',
        description: '选择最终封面版本',
        status: TodoStatus.PENDING,
        priority: 1,
        dueDate: new Date('2026-06-12'),
        assigneeId: supervisor.id,
        creatorId: editor1.id,
        coverVersionId: cover1.id,
        scriptId: script1.id,
        topicId: topic1.id,
      },
      {
        type: TodoType.COVER_VERSION,
        title: '审核备选封面',
        description: '评估备选封面方案',
        status: TodoStatus.COMPLETED,
        priority: 3,
        assigneeId: editor1.id,
        creatorId: creator1.id,
        coverVersionId: cover2.id,
        scriptId: script1.id,
        topicId: topic1.id,
      },
      {
        type: TodoType.SCRIPT_REVIEW,
        title: '审核618大促脚本修改版',
        description: '审阅脚本第二版修改',
        status: TodoStatus.PENDING,
        priority: 1,
        dueDate: new Date('2026-06-11'),
        assigneeId: supervisor.id,
        creatorId: editor1.id,
        scriptId: script3.id,
        topicId: topic3.id,
      },
      {
        type: TodoType.TOPIC_REVIEW,
        title: '审核夏日穿搭选题',
        description: '评审夏日清凉穿搭指南选题',
        status: TodoStatus.PENDING,
        priority: 3,
        assigneeId: supervisor.id,
        creatorId: creator2.id,
        topicId: topic4.id,
      },
    ],
  })

  await prisma.anomaly.createMany({
    data: [
      {
        type: AnomalyType.SCHEDULE_CONFLICT,
        title: '618大促与春季新品排期冲突',
        description: '618大促预热视频与春季新品发布视频排期重叠，都在6月18日-20日发布，需要调整排期',
        status: AnomalyStatus.OPEN,
        conflictDetails: {
          conflictingTopics: [topic3.title, topic1.title, topic6.title],
          conflictDate: '2026-06-18',
          affectedScripts: [script1.id, script3.id],
        },
        topicId: topic3.id,
        creatorId: editor1.id,
      },
      {
        type: AnomalyType.MATERIAL_MISSING,
        title: '品牌故事纪录片素材未交付',
        description: '品牌故事纪录片的核心拍摄素材延迟交付，影响后期制作进度',
        status: AnomalyStatus.PROCESSING,
        topicId: topic2.id,
        scriptId: script2.id,
        handlerId: supervisor.id,
        creatorId: editor2.id,
      },
      {
        type: AnomalyType.APPROVAL_DELAY,
        title: '夏日穿搭选题审批延迟',
        description: '夏日清凉穿搭指南选题提交3天仍未获得审批反馈',
        status: AnomalyStatus.OPEN,
        topicId: topic4.id,
        creatorId: creator2.id,
      },
      {
        type: AnomalyType.QUALITY_ISSUE,
        title: 'UGC内容画面质量不达标',
        description: '用户UGC内容合集中部分画面分辨率不足，模糊严重，需要重新筛选或补充拍摄',
        status: AnomalyStatus.CLOSED,
        topicId: topic5.id,
        closeReason: '已与用户沟通，获得高清版本素材替换',
        closeResult: '成功获取3位用户的高清素材，已完成替换并重新剪辑，视频质量提升至1080p',
        closedAt: new Date(),
        handlerId: supervisor.id,
        creatorId: editor2.id,
      },
    ],
  })

  const productionDates = [
    '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05',
    '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10',
  ]

  for (const date of productionDates) {
    await prisma.productionRecord.create({
      data: {
        date: new Date(date),
        userId: editor1.id,
        topicId: topic1.id,
        contentType: '短视频',
        outputCount: Math.floor(Math.random() * 3) + 1,
        videoDuration: Math.floor(Math.random() * 60) + 15,
        qualityScore: Math.floor(Math.random() * 30) + 70,
        tags: ['短视频', '制作'],
        remarks: '正常产出',
      },
    })

    await prisma.productionRecord.create({
      data: {
        date: new Date(date),
        userId: editor2.id,
        contentType: '短视频',
        outputCount: Math.floor(Math.random() * 2) + 1,
        videoDuration: Math.floor(Math.random() * 45) + 20,
        qualityScore: Math.floor(Math.random() * 25) + 65,
        tags: ['短视频', '制作'],
      },
    })

    if (Math.random() > 0.5) {
      await prisma.productionRecord.create({
        data: {
          date: new Date(date),
          userId: creator1.id,
          contentType: '图文',
          outputCount: Math.floor(Math.random() * 5) + 2,
          qualityScore: Math.floor(Math.random() * 20) + 75,
          tags: ['图文', '创意'],
        },
      })
    }
  }

  console.log('种子数据创建完成！')
  console.log('演示账号：')
  console.log('  admin@example.com / admin123 (管理员)')
  console.log('  supervisor@example.com / admin123 (编辑主管)')
  console.log('  editor1@example.com / admin123 (编辑)')
  console.log('  editor2@example.com / admin123 (编辑)')
  console.log('  creator1@example.com / admin123 (创作者)')
  console.log('  creator2@example.com / admin123 (创作者)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
