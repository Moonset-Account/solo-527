import type {
  Project,
  DesignPlan,
  Contract,
  HouseSurvey,
  ConstructionStage,
  StagePhoto,
  CustomerFeedback,
  DelayReminder,
  InspectionTask,
  AfterSales,
  MaterialCost,
  ProcessRecord,
  ProjectSummary
} from '@/types'

export const mockProjects: Project[] = [
  {
    id: '1',
    projectNo: 'XM2024001',
    name: '万科翡翠滨江12栋302室装修工程',
    customerId: '1',
    customerName: '张三',
    status: 'in_progress',
    salesPerson: '李四',
    projectManager: '王五',
    totalPrice: 258000,
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    address: '上海市浦东新区万科翡翠滨江12栋302室',
    remark: '三室两厅一卫，现代简约风格',
    handler: '李四',
    handleTime: '2024-03-20 14:30:00',
    createdAt: '2024-01-10 09:00:00',
    updatedAt: '2024-03-20 14:30:00'
  },
  {
    id: '2',
    projectNo: 'XM2024002',
    name: '保利叶语5栋1001室装修工程',
    customerId: '2',
    customerName: '李四',
    status: 'pending',
    salesPerson: '赵六',
    projectManager: '孙七',
    totalPrice: 380000,
    startDate: '2024-03-01',
    endDate: '2024-09-01',
    address: '上海市宝山区保利叶语5栋1001室',
    remark: '四室两厅两卫，欧式古典风格',
    handler: '赵六',
    handleTime: '2024-02-28 16:00:00',
    createdAt: '2024-02-15 10:00:00',
    updatedAt: '2024-02-28 16:00:00'
  },
  {
    id: '3',
    projectNo: 'XM2024003',
    name: '金地天地云墅8栋503室装修工程',
    customerId: '3',
    customerName: '王五',
    status: 'completed',
    salesPerson: '李四',
    projectManager: '周八',
    totalPrice: 185000,
    startDate: '2023-09-01',
    endDate: '2024-01-30',
    address: '上海市松江区金地天地云墅8栋503室',
    remark: '两室一厅一卫，北欧风格',
    handler: '周八',
    handleTime: '2024-01-30 11:00:00',
    createdAt: '2023-08-20 09:30:00',
    updatedAt: '2024-01-30 11:00:00'
  },
  {
    id: '4',
    projectNo: 'XM2024004',
    name: '龙湖天街3栋1502室装修工程',
    customerId: '4',
    customerName: '赵六',
    status: 'in_progress',
    salesPerson: '钱九',
    projectManager: '王五',
    totalPrice: 420000,
    startDate: '2024-02-10',
    endDate: '2024-08-10',
    address: '上海市闵行区龙湖天街3栋1502室',
    remark: '三室两厅两卫，轻奢风格',
    handler: '王五',
    handleTime: '2024-03-25 10:30:00',
    createdAt: '2024-01-25 14:00:00',
    updatedAt: '2024-03-25 10:30:00'
  },
  {
    id: '5',
    projectNo: 'XM2024005',
    name: '融创玉兰花园6栋801室装修工程',
    customerId: '5',
    customerName: '孙七',
    status: 'cancelled',
    salesPerson: '赵六',
    projectManager: '周八',
    totalPrice: 298000,
    startDate: '2024-01-20',
    endDate: '2024-07-20',
    address: '上海市青浦区融创玉兰花园6栋801室',
    remark: '三室两厅两卫，新中式风格',
    handler: '周八',
    handleTime: '2024-02-10 09:00:00',
    createdAt: '2024-01-15 11:00:00',
    updatedAt: '2024-02-10 09:00:00'
  }
]

export const mockDesignPlans: DesignPlan[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '现代简约风格设计方案',
    description: '三室两厅一卫，主打简约实用，全屋定制收纳系统',
    estimatedPrice: 258000,
    designFile: '',
    status: 'approved',
    handler: '李四',
    handleTime: '2024-01-20 15:30:00',
    createdAt: '2024-01-18 10:00:00',
    updatedAt: '2024-01-20 15:30:00'
  },
  {
    id: '2',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '客厅改造设计方案',
    description: '优化客厅布局，增加储物空间',
    estimatedPrice: 50000,
    designFile: '',
    status: 'submitted',
    handler: '李四',
    handleTime: '2024-02-15 10:00:00',
    createdAt: '2024-02-10 14:00:00',
    updatedAt: '2024-02-15 10:00:00'
  },
  {
    id: '3',
    projectId: '2',
    projectName: '保利叶语5栋1001室装修工程',
    name: '欧式古典风格设计方案',
    description: '四室两厅两卫，豪华欧式风格，大理石地面',
    estimatedPrice: 380000,
    designFile: '',
    status: 'draft',
    handler: '赵六',
    handleTime: '2024-02-25 16:00:00',
    createdAt: '2024-02-20 09:00:00',
    updatedAt: '2024-02-25 16:00:00'
  }
]

export const mockContracts: Contract[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    contractNo: 'HT2024001',
    amount: 258000,
    signDate: '2024-01-20',
    partyA: '张三',
    partyB: '某某装修公司',
    description: '主合同，包含基础装修和主材',
    status: 'signed',
    handler: '李四',
    handleTime: '2024-01-20 16:00:00',
    createdAt: '2024-01-18 10:00:00',
    updatedAt: '2024-01-20 16:00:00'
  },
  {
    id: '2',
    projectId: '2',
    projectName: '保利叶语5栋1001室装修工程',
    contractNo: 'HT2024002',
    amount: 380000,
    signDate: '2024-02-28',
    partyA: '李四',
    partyB: '某某装修公司',
    description: '主合同，全屋整装',
    status: 'draft',
    handler: '赵六',
    handleTime: '2024-02-28 10:00:00',
    createdAt: '2024-02-25 14:00:00',
    updatedAt: '2024-02-28 10:00:00'
  }
]

export const mockHouseSurveys: HouseSurvey[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    surveyDate: '2024-01-12',
    surveyor: '量房师小张',
    area: 120.5,
    layout: '三室两厅一卫',
    floor: 30,
    orientation: '南',
    description: '房屋方正，采光良好，层高2.8米',
    photos: ['https://example.com/survey1.jpg', 'https://example.com/survey2.jpg'],
    handler: '李四',
    handleTime: '2024-01-12 17:00:00',
    createdAt: '2024-01-12 10:00:00',
    updatedAt: '2024-01-12 17:00:00'
  },
  {
    id: '2',
    projectId: '2',
    projectName: '保利叶语5栋1001室装修工程',
    surveyDate: '2024-02-20',
    surveyor: '量房师老李',
    area: 165.0,
    layout: '四室两厅两卫',
    floor: 10,
    orientation: '南北通透',
    description: '大平层，南北通透，主卧带卫生间',
    handler: '赵六',
    handleTime: '2024-02-20 18:00:00',
    createdAt: '2024-02-20 09:00:00',
    updatedAt: '2024-02-20 18:00:00'
  }
]

export const mockConstructionStages: ConstructionStage[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '拆除工程',
    order: 1,
    startDate: '2024-01-15',
    endDate: '2024-01-22',
    actualStartDate: '2024-01-15',
    actualEndDate: '2024-01-21',
    status: 'completed',
    description: '墙体拆除、地面拆除',
    handler: '王五',
    handleTime: '2024-01-21 16:00:00',
    createdAt: '2024-01-14 09:00:00',
    updatedAt: '2024-01-21 16:00:00'
  },
  {
    id: '2',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '水电改造',
    order: 2,
    startDate: '2024-01-23',
    endDate: '2024-02-10',
    actualStartDate: '2024-01-23',
    actualEndDate: '2024-02-12',
    status: 'completed',
    description: '强电、弱电、给排水改造',
    handler: '王五',
    handleTime: '2024-02-12 17:00:00',
    createdAt: '2024-01-20 10:00:00',
    updatedAt: '2024-02-12 17:00:00'
  },
  {
    id: '3',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '泥瓦工程',
    order: 3,
    startDate: '2024-02-11',
    endDate: '2024-03-05',
    actualStartDate: '2024-02-14',
    status: 'in_progress',
    description: '墙地砖铺贴、防水工程',
    handler: '王五',
    handleTime: '2024-03-15 10:00:00',
    createdAt: '2024-02-08 14:00:00',
    updatedAt: '2024-03-15 10:00:00'
  },
  {
    id: '4',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '木工工程',
    order: 4,
    startDate: '2024-03-06',
    endDate: '2024-03-26',
    status: 'pending',
    description: '吊顶、柜体制作',
    handler: '王五',
    handleTime: '2024-02-25 16:00:00',
    createdAt: '2024-02-20 10:00:00',
    updatedAt: '2024-02-25 16:00:00'
  },
  {
    id: '5',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '油漆工程',
    order: 5,
    startDate: '2024-03-27',
    endDate: '2024-04-16',
    status: 'pending',
    description: '墙面腻子、乳胶漆',
    handler: '王五',
    handleTime: '2024-02-25 16:00:00',
    createdAt: '2024-02-20 10:00:00',
    updatedAt: '2024-02-25 16:00:00'
  },
  {
    id: '6',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    name: '安装工程',
    order: 6,
    startDate: '2024-04-17',
    endDate: '2024-05-07',
    status: 'pending',
    description: '橱柜、地板、洁具安装',
    handler: '王五',
    handleTime: '2024-02-25 16:00:00',
    createdAt: '2024-02-20 10:00:00',
    updatedAt: '2024-02-25 16:00:00'
  }
]

export const mockStagePhotos: StagePhoto[] = [
  {
    id: '1',
    stageId: '1',
    stageName: '拆除工程',
    projectId: '1',
    title: '拆除完成后照片',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=demolition%20construction%20site&image_size=square',
    description: '拆除完成后照片',
    uploader: '王五',
    uploadTime: '2024-01-21 15:00:00',
    createdAt: '2024-01-21 15:00:00'
  },
  {
    id: '2',
    stageId: '2',
    stageName: '水电改造',
    projectId: '1',
    title: '水电布线完成',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20wiring%20construction&image_size=square',
    description: '水电布线完成',
    uploader: '王五',
    uploadTime: '2024-02-10 16:30:00',
    createdAt: '2024-02-10 16:30:00'
  },
  {
    id: '3',
    stageId: '3',
    stageName: '泥瓦工程',
    projectId: '1',
    title: '卫生间贴砖中',
    photoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tile%20installation%20bathroom&image_size=square',
    description: '卫生间贴砖中',
    uploader: '王五',
    uploadTime: '2024-03-10 10:00:00',
    createdAt: '2024-03-10 10:00:00'
  }
]

export const mockCustomerFeedbacks: CustomerFeedback[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    content: '卫生间防水做得不够好，有渗水现象，请尽快处理。',
    type: 'quality',
    feedbackTime: '2024-02-18 14:00:00',
    reply: '已安排工人进行防水返工，预计3天内完成。',
    replyTime: '2024-02-20 10:30:00',
    status: 'resolved',
    handler: '王五',
    createdAt: '2024-02-18 14:00:00'
  },
  {
    id: '2',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    content: '想了解一下目前的施工进度，以及预计完工时间。',
    type: 'service',
    feedbackTime: '2024-03-19 16:00:00',
    status: 'processing',
    handler: '王五',
    createdAt: '2024-03-19 16:00:00'
  }
]

export const mockDelayReminders: DelayReminder[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    stageId: '2',
    stageName: '水电改造',
    reason: '春节假期工人返乡，延误2天',
    days: 2,
    remindTime: '2024-02-12 14:00:00',
    status: 'resolved',
    handler: '王五',
    createdAt: '2024-02-12 14:00:00'
  },
  {
    id: '2',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    stageId: '3',
    stageName: '泥瓦工程',
    reason: '瓷砖供应商延迟发货',
    days: 3,
    remindTime: '2024-03-15 14:00:00',
    status: 'pending',
    handler: '王五',
    createdAt: '2024-03-15 14:00:00'
  }
]

export const mockInspectionTasks: InspectionTask[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    stageId: '1',
    stageName: '拆除工程',
    title: '拆除工程验收',
    planDate: '2024-01-22',
    actualDate: '2024-01-22',
    inspector: '质检员老刘',
    result: 'pass',
    status: 'completed',
    handler: '质检员老刘',
    handleTime: '2024-01-22 16:00:00',
    createdAt: '2024-01-20 10:00:00'
  },
  {
    id: '2',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    stageId: '2',
    stageName: '水电改造',
    title: '水电工程验收',
    planDate: '2024-02-12',
    actualDate: '2024-02-12',
    inspector: '质检员老刘',
    result: 'fail',
    status: 'completed',
    issues: '部分线路接线不规范，卫生间防水高度不够',
    rectificationDeadline: '2024-02-18',
    handler: '质检员老刘',
    handleTime: '2024-02-12 17:00:00',
    createdAt: '2024-02-10 09:00:00'
  },
  {
    id: '3',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    stageId: '3',
    stageName: '泥瓦工程',
    title: '中期巡检',
    planDate: '2024-03-25',
    inspector: '质检员老张',
    result: 'pending',
    status: 'pending',
    handler: '王五',
    handleTime: '2024-03-18 10:00:00',
    createdAt: '2024-03-18 10:00:00'
  }
]

export const mockAfterSales: AfterSales[] = [
  {
    id: '1',
    projectId: '3',
    projectName: '金地天地云墅8栋503室装修工程',
    title: '墙面开裂',
    type: 'quality',
    description: '主卧墙面出现多处裂缝，影响美观',
    reporter: '王五',
    reportTime: '2024-03-10 09:00:00',
    solution: '已安排工人进行墙面修补，使用防裂网加固',
    cost: 500,
    status: 'resolved',
    handler: '周八',
    handleTime: '2024-03-15 16:00:00',
    createdAt: '2024-03-10 09:00:00'
  },
  {
    id: '2',
    projectId: '3',
    projectName: '金地天地云墅8栋503室装修工程',
    title: '水龙头漏水',
    type: 'installation',
    description: '厨房水龙头安装后一直有滴水现象',
    reporter: '王五',
    reportTime: '2024-03-18 14:00:00',
    status: 'processing',
    handler: '周八',
    handleTime: '2024-03-19 09:00:00',
    createdAt: '2024-03-18 14:00:00'
  }
]

export const mockMaterialCosts: MaterialCost[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    materialName: '地砖',
    specification: '800x800mm 抛光砖',
    quantity: 120,
    unit: '平方米',
    unitPrice: 150,
    totalPrice: 18000,
    supplier: '东鹏瓷砖',
    purchaseDate: '2024-02-10',
    handler: '王五',
    remark: '含运费',
    createdAt: '2024-02-10 10:00:00'
  },
  {
    id: '2',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    materialName: '乳胶漆',
    specification: '多乐士 5L',
    quantity: 10,
    unit: '桶',
    unitPrice: 450,
    totalPrice: 4500,
    supplier: '多乐士专卖店',
    purchaseDate: '2024-03-15',
    handler: '王五',
    createdAt: '2024-03-15 14:00:00'
  },
  {
    id: '3',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    materialName: '电线',
    specification: '2.5平方 国标铜线',
    quantity: 200,
    unit: '米',
    unitPrice: 3.5,
    totalPrice: 700,
    supplier: '远东电缆',
    purchaseDate: '2024-01-25',
    handler: '王五',
    createdAt: '2024-01-25 09:00:00'
  },
  {
    id: '4',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    materialName: '木地板',
    specification: '实木复合地板 15mm',
    quantity: 80,
    unit: '平方米',
    unitPrice: 280,
    totalPrice: 22400,
    supplier: '圣象地板',
    purchaseDate: '2024-04-01',
    handler: '王五',
    remark: '含安装费',
    createdAt: '2024-04-01 11:00:00'
  },
  {
    id: '5',
    projectId: '2',
    projectName: '保利叶语5栋1001室装修工程',
    materialName: '大理石',
    specification: '天然大理石 20mm',
    quantity: 50,
    unit: '平方米',
    unitPrice: 600,
    totalPrice: 30000,
    supplier: '石材城',
    purchaseDate: '2024-03-05',
    handler: '赵六',
    createdAt: '2024-03-05 10:00:00'
  }
]

export const mockProcessRecords: ProcessRecord[] = [
  {
    id: '1',
    type: 'design',
    title: '现代简约风格设计方案',
    handler: '李四',
    handleTime: '2024-01-20 15:30:00',
    status: 'approved',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    description: '设计方案已通过客户确认'
  },
  {
    id: '2',
    type: 'contract',
    title: '主合同签订',
    handler: '李四',
    handleTime: '2024-01-20 16:00:00',
    status: 'signed',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    description: '主合同签订完成，金额258000元'
  },
  {
    id: '3',
    type: 'survey',
    title: '现场量房',
    handler: '李四',
    handleTime: '2024-01-12 17:00:00',
    status: 'completed',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    description: '量房完成，面积120.5平方米'
  },
  {
    id: '4',
    type: 'inspection',
    title: '拆除工程验收',
    handler: '质检员老刘',
    handleTime: '2024-01-22 16:00:00',
    status: 'pass',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    description: '拆除工程验收通过'
  },
  {
    id: '5',
    type: 'inspection',
    title: '水电工程验收',
    handler: '质检员老刘',
    handleTime: '2024-02-12 17:00:00',
    status: 'fail',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    description: '部分线路接线不规范，需整改'
  },
  {
    id: '6',
    type: 'construction',
    title: '拆除工程完成',
    handler: '王五',
    handleTime: '2024-01-21 16:00:00',
    status: 'completed',
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    description: '拆除工程已完成，比计划提前1天'
  },
  {
    id: '7',
    type: 'aftersales',
    title: '墙面开裂报修处理',
    handler: '周八',
    handleTime: '2024-03-15 16:00:00',
    status: 'resolved',
    projectId: '3',
    projectName: '金地天地云墅8栋503室装修工程',
    description: '墙面开裂已修复完成'
  }
]

export const mockProjectSummaries: ProjectSummary[] = [
  {
    projectId: '1',
    projectName: '万科翡翠滨江12栋302室装修工程',
    totalRevenue: 258000,
    materialCost: 68000,
    laborCost: 85000,
    otherCost: 15000,
    totalCost: 168000,
    profit: 90000,
    profitMargin: 34.88
  },
  {
    projectId: '2',
    projectName: '保利叶语5栋1001室装修工程',
    totalRevenue: 380000,
    materialCost: 120000,
    laborCost: 130000,
    otherCost: 20000,
    totalCost: 270000,
    profit: 110000,
    profitMargin: 28.95
  },
  {
    projectId: '3',
    projectName: '金地天地云墅8栋503室装修工程',
    totalRevenue: 185000,
    materialCost: 55000,
    laborCost: 60000,
    otherCost: 8000,
    totalCost: 123000,
    profit: 62000,
    profitMargin: 33.51
  }
]
